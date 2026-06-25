import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ProductRepository } from '../products/repositories/product.repository';
import { TryOnService } from '../try-on/try-on.service';
import { StoragePathResolver } from '../../storage/services/storage-path-resolver.service';
import { VirtualTryOnRepository } from './virtual-try-on.repository';
import { BodyImageResolverService } from './services/body-image-resolver.service';
import { BackgroundRemovalService } from './services/background-removal.service';
import { TRY_ON_CATEGORIES, EMPTY_TRY_ON_OUTFIT } from './constants/try-on-layer.constants';
import {
  buildAvatarRenderLayers,
  buildOutfitFromProductIds,
  buildTryOnRenderLayers,
  hasTryOnSelections,
  mapProductToTryOnLayer,
  resolveBodyScaling,
  scoreProductForFashionDna,
} from './utils/avatar-try-on-bridge';

const CATEGORY_SUBCATEGORY_MAP = {
  pants: ['men-jeans', 'men-trousers', 'pants'],
  't-shirts': ['men-t-shirts', 't-shirts'],
  shirts: ['men-shirts', 'shirts'],
  jackets: ['men-jackets', 'jackets'],
  shoes: ['shoes', 'sneakers', 'sandals', 'footwear'],
  footwear: ['shoes', 'sneakers', 'sandals', 'footwear'],
};

function formatDbProduct(product) {
  if (!product) {
    return null;
  }

  const primaryImage = product.images?.find((image) => image.is_primary)
    ?? product.images?.[0];

  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    category: product.category,
    subcategory: product.subcategory,
    brand: product.brand,
    price: product.price,
    currency: product.currency,
    color: product.color,
    fitType: product.fit_type,
    fit_type: product.fit_type,
    imageUrl: product.try_on_image ?? primaryImage?.url ?? product.image_url,
    image_url: product.try_on_image ?? primaryImage?.url ?? product.image_url,
    avatarCategory: product.avatar_category,
    avatar_category: product.avatar_category,
    overlayOrder: product.overlay_order,
    overlay_order: product.overlay_order,
    avatarOverlayUrl: product.avatar_overlay_url,
    avatar_overlay_url: product.avatar_overlay_url,
  };
}

export @Injectable()
class VirtualTryOnService {
  constructor(
    @Inject(VirtualTryOnRepository) repository,
    @Inject(BodyImageResolverService) bodyImageResolver,
    @Inject(BackgroundRemovalService) backgroundRemovalService,
    @Inject(ProductRepository) productRepository,
    @Inject(StoragePathResolver) storagePathResolver,
    @Inject(TryOnService) tryOnService,
  ) {
    this.repository = repository;
    this.bodyImageResolver = bodyImageResolver;
    this.backgroundRemovalService = backgroundRemovalService;
    this.productRepository = productRepository;
    this.storagePathResolver = storagePathResolver;
    this.tryOnService = tryOnService;
    this.logger = new Logger(VirtualTryOnService.name);
  }

  async getSetup(userId) {
    const bodyImagePath = await this.bodyImageResolver.resolveBodyImagePath(userId);

    if (!bodyImagePath) {
      return {
        ready: false,
        message: 'Complete onboarding with a body photo to use Virtual Try-On.',
        bodyPhoto: null,
        bodyPhotoUrl: null,
        bodyPhotoReference: null,
        hasTransparentCache: false,
        transparentImageUrl: null,
      };
    }

    await this.bodyImageResolver.syncTryOnSessionInput(userId);

    const session = await this.repository.findSessionByUserId(userId);
    const hasTransparentCache = Boolean(session?.transparent_image)
      || this.backgroundRemovalService.transparentPngExists(userId);
    const bodyImageUrl = this.bodyImageResolver.toPublicUrl(bodyImagePath);

    return {
      ready: true,
      message: null,
      bodyPhoto: bodyImagePath,
      bodyPhotoUrl: bodyImageUrl,
      bodyPhotoReference: bodyImagePath,
      bodyImage: bodyImagePath,
      bodyImageUrl,
      hasTransparentCache,
      transparentImageUrl: session?.transparent_image
        ? this.bodyImageResolver.toPublicUrl(session.transparent_image)
        : null,
    };
  }

  async listProducts(userId, query = {}) {
    const page = Number.parseInt(String(query.page ?? 1), 10) || 1;
    const limit = Math.min(Number.parseInt(String(query.limit ?? 24), 10) || 24, 48);
    const category = query.category ? String(query.category).toLowerCase() : null;
    const search = query.search ? String(query.search).trim().toLowerCase() : '';

    const [products, total] = await this.productRepository.findMany({
      page,
      limit: search || category ? 100 : limit,
      search: query.search,
      is_active: true,
    });

    let formatted = products.map(formatDbProduct);

    if (category) {
      const subcategories = CATEGORY_SUBCATEGORY_MAP[category] ?? [category];
      formatted = formatted.filter((product) => {
        const subcategory = String(product.subcategory || '').toLowerCase();
        const productCategory = String(product.category || '').toLowerCase();
        return subcategories.some((slug) => (
          subcategory.includes(slug)
          || productCategory.includes(slug)
          || slug.includes(subcategory)
        ));
      });
    }

    if (search) {
      formatted = formatted.filter((product) => {
        const haystack = [
          product.name,
          product.brand,
          product.category,
          product.subcategory,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(search);
      });
    }

    const paged = formatted.slice((page - 1) * limit, page * limit);

    return {
      page,
      limit,
      total: search || category ? formatted.length : total,
      products: paged.map((product) => ({
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        currency: product.currency,
        category: product.category,
        subcategory: product.subcategory,
        imageUrl: product.imageUrl,
        thumbnailUrl: product.imageUrl,
      })),
    };
  }

  async generateTryOn(userId, productId, options = {}) {
    const onboardingBodyPath = await this.bodyImageResolver.resolveBodyImagePath(userId);
    const temporaryBodyImageUrl = options.temporaryBodyImageUrl || null;
    const usingTemporaryBody = Boolean(temporaryBodyImageUrl);

    if (!onboardingBodyPath && !usingTemporaryBody) {
      throw new BadRequestException(
        'Complete onboarding with a body photo to use Virtual Try-On.',
      );
    }

    const bodyPhotoPath = usingTemporaryBody
      ? temporaryBodyImageUrl
      : onboardingBodyPath;

    const record = await this.productRepository.findById(productId);

    if (!record || record.is_active === false) {
      throw new NotFoundException('Product not found');
    }

    const product = formatDbProduct(record);
    const garmentImageUrl = product.imageUrl;

    if (!garmentImageUrl) {
      throw new BadRequestException('Product has no garment image.');
    }

    let transparentPath = null;

    if (!usingTemporaryBody) {
      try {
        const transparent = await this.backgroundRemovalService.ensureTransparentPng(
          userId,
          bodyPhotoPath,
        );
        transparentPath = transparent?.storagePath ?? null;
      } catch (error) {
        this.logger.warn(
          `Transparent PNG generation failed for user ${userId}: ${error.message}`,
        );
      }
    }

    if (!usingTemporaryBody) {
      await this.repository.upsertSession(userId, {
        body_image: bodyPhotoPath,
        transparent_image: transparentPath,
      });
    }

    const personImageUrl = usingTemporaryBody
      ? temporaryBodyImageUrl
      : transparentPath
        ? this.storagePathResolver.toPublicUrl(transparentPath)
        : this.storagePathResolver.toPublicUrl(bodyPhotoPath);

    const catvtonResult = await this.tryOnService.generateTryOn(
      userId,
      personImageUrl,
      garmentImageUrl,
      { persistHistory: false },
    );

    const generatedImageUrl =
      catvtonResult?.resultImageUrl
      || catvtonResult?.result_image_url
      || null;

    const resultRecord = await this.repository.createTryOnResult(userId, {
      product_id: productId,
      body_photo_reference: usingTemporaryBody ? null : bodyPhotoPath,
      transparent_image: transparentPath,
      garment_image: garmentImageUrl,
      generated_image: generatedImageUrl,
      input_image: usingTemporaryBody ? temporaryBodyImageUrl : bodyPhotoPath,
      selected_products: [product],
    });

    return {
      result: this.formatTryOnResult(resultRecord, product),
      bodyPhotoUrl: usingTemporaryBody
        ? temporaryBodyImageUrl
        : this.storagePathResolver.toPublicUrl(bodyPhotoPath),
      generatedImageUrl,
    };
  }

  async listTryOnResults(userId) {
    const records = await this.repository.listTryOnResults(userId);
    return records.map((record) => this.formatTryOnResult(record));
  }

  async deleteTryOnResult(userId, resultId) {
    const result = await this.repository.deleteTryOnResult(userId, resultId);

    if (!result.count) {
      throw new NotFoundException('Try-on result not found');
    }

    return { deleted: true };
  }

  async saveTryOnResultOutfit(userId, resultId, { name } = {}) {
    const record = await this.repository.findTryOnResult(userId, resultId);

    if (!record) {
      throw new NotFoundException('Try-on result not found');
    }

    const products = Array.isArray(record.selected_products)
      ? record.selected_products
      : [];
    const totalPrice = products.reduce(
      (sum, item) => sum + (Number(item?.price) || 0),
      0,
    );

    const saved = await this.repository.createSavedOutfit(userId, {
      name: name || `Try-On ${new Date(record.created_at).toLocaleDateString()}`,
      products,
      items: products,
      preview_image: record.generated_image,
      thumbnail: record.generated_image,
      total_price: totalPrice,
      source: 'virtual-try-on',
    });

    return this.formatSavedOutfit(saved);
  }

  async addTryOnResultToCloset(userId, resultId) {
    return this.saveTryOnResultOutfit(userId, resultId, {
      name: `Closet Look ${new Date().toLocaleDateString()}`,
    });
  }

  formatTryOnResult(record, productOverride = null) {
    const products = Array.isArray(record?.selected_products)
      ? record.selected_products
      : [];
    const product = productOverride || products[0] || null;

    return {
      id: record.id,
      userId: record.user_id,
      productId: record.product_id,
      bodyPhotoReference: record.body_photo_reference || record.input_image,
      bodyPhotoUrl: this.storagePathResolver.toPublicUrl(
        record.body_photo_reference || record.input_image,
      ),
      garmentImage: record.garment_image,
      garmentImageUrl: record.garment_image,
      transparentImage: record.transparent_image,
      transparentImageUrl: this.storagePathResolver.toPublicUrl(record.transparent_image),
      generatedImage: record.generated_image,
      generatedImageUrl: this.storagePathResolver.toPublicUrl(record.generated_image),
      product: product
        ? {
            id: product.id,
            name: product.name,
            brand: product.brand,
            price: product.price,
            category: product.category,
            imageUrl: product.imageUrl || product.image_url,
          }
        : null,
      selectedProducts: products,
      createdAt: record.created_at,
    };
  }

  async getProductsByCategory(userId, categoryId) {
    const subcategories = CATEGORY_SUBCATEGORY_MAP[categoryId] ?? [categoryId];
    const user = await this.repository.findUserContext(userId);

    const [products] = await this.productRepository.findMany({
      page: 1,
      limit: 48,
      is_active: true,
    });

    const filtered = products
      .map(formatDbProduct)
      .filter((product) => {
        const subcategory = String(product.subcategory || '').toLowerCase();
        const category = String(product.category || '').toLowerCase();
        return subcategories.some((slug) => (
          subcategory.includes(slug)
          || category.includes(slug)
          || slug.includes(subcategory)
        ));
      })
      .map((product) => ({
        ...mapProductToTryOnLayer(product, categoryId),
        fashionDnaScore: scoreProductForFashionDna(product, user?.fashion_dna),
      }))
      .sort((left, right) => (right.fashionDnaScore || 0) - (left.fashionDnaScore || 0));

    return {
      categoryId,
      products: filtered,
    };
  }

  async applyProduct(userId, { categoryId, productId }) {
    const context = await this.getLegacyLayerContext(userId);

    let product = null;

    if (productId) {
      const record = await this.productRepository.findById(productId);

      if (!record) {
        throw new NotFoundException('Product not found');
      }

      product = formatDbProduct(record);
    }

    const currentSelection = context.session?.selection || {};
    const nextSelection = { ...currentSelection };

    if (productId) {
      nextSelection[categoryId] = productId;
    } else {
      delete nextSelection[categoryId];
    }

    const productsById = {};

    for (const id of Object.values(nextSelection)) {
      const record = await this.productRepository.findById(id);

      if (record) {
        productsById[id] = formatDbProduct(record);
      }
    }

    const outfit = buildOutfitFromProductIds(productsById, nextSelection);
    const userLayers = buildTryOnRenderLayers({
      bodyImageUrl: context.bodyImageUrl,
      transparentImageUrl: context.transparentImageUrl,
      outfit,
      scaling: context.scaling,
    });

    const avatarLayers = buildAvatarRenderLayers({
      baseAvatarUrl: context.avatar?.imageUrl ?? null,
      outfit,
    });

    const session = await this.repository.upsertSession(userId, {
      body_image: context.bodyImage,
      transparent_image: context.transparentImage,
      selected_products: Object.entries(nextSelection).map(([category, id]) => ({
        categoryId: category,
        productId: id,
        product: productsById[id]
          ? mapProductToTryOnLayer(productsById[id], category)
          : null,
      })),
      generated_outfit_image: context.transparentImage || null,
    });

    return {
      session: this.formatSession(session),
      outfit,
      userLayers,
      avatarLayers,
      scaling: context.scaling,
      hasSelections: hasTryOnSelections(outfit),
    };
  }

  async resetOutfit(userId) {
    const context = await this.getLegacyLayerContext(userId);

    const session = await this.repository.upsertSession(userId, {
      body_image: context.bodyImage,
      transparent_image: context.transparentImage,
      selected_products: [],
      generated_outfit_image: context.transparentImage || null,
    });

    const userLayers = buildTryOnRenderLayers({
      bodyImageUrl: context.bodyImageUrl,
      transparentImageUrl: context.transparentImageUrl,
      outfit: EMPTY_TRY_ON_OUTFIT,
      scaling: context.scaling,
    });

    return {
      session: this.formatSession(session),
      outfit: EMPTY_TRY_ON_OUTFIT,
      userLayers,
      avatarLayers: buildAvatarRenderLayers({
        baseAvatarUrl: context.avatar?.imageUrl ?? null,
        outfit: EMPTY_TRY_ON_OUTFIT,
      }),
      hasSelections: false,
    };
  }

  async getLegacyLayerContext(userId) {
    const setup = await this.getSetup(userId);

    if (!setup.ready) {
      throw new BadRequestException(setup.message);
    }

    const user = await this.repository.findUserContext(userId);
    const sessionRecord = await this.repository.findSessionByUserId(userId);
    const bodyAnalysis = user?.body_analysis
      ? {
          bodyType: user.body_analysis.body_type,
          bodyShape: user.body_analysis.body_shape,
          height: user.body_analysis.height,
          waist: user.body_analysis.waist,
          hip: user.body_analysis.hip,
          shoulderWidth: user.body_analysis.shoulder_width,
        }
      : null;
    const fashionDna = user?.fashion_dna
      ? {
          styleType: user.fashion_dna.style_type,
          budgetRange: user.fashion_dna.budget_range,
          colorAffinity: user.fashion_dna.color_affinity,
          preferenceTraits: user.fashion_dna.preference_traits,
        }
      : null;
    const activeAvatar = user?.digital_avatars?.[0] ?? null;

    return {
      ...setup,
      bodyImage: setup.bodyPhoto,
      transparentImage: sessionRecord?.transparent_image ?? null,
      transparentImageUrl: this.storagePathResolver.toPublicUrl(
        sessionRecord?.transparent_image,
      ),
      session: sessionRecord ? this.formatSession(sessionRecord) : null,
      bodyAnalysis,
      fashionDna,
      avatar: activeAvatar
        ? {
            id: activeAvatar.id,
            imageUrl: this.storagePathResolver.toPublicUrl(activeAvatar.avatar_image),
            avatarType: activeAvatar.avatar_type,
          }
        : null,
      scaling: resolveBodyScaling(bodyAnalysis, user?.profile),
    };
  }

  async saveOutfit(userId, { name, source } = {}) {
    const context = await this.getLegacyLayerContext(userId);
    const session = context.session;

    if (!session?.selection || !Object.keys(session.selection).length) {
      throw new BadRequestException('Select at least one product before saving an outfit.');
    }

    const selectedProducts = session.selectedProducts || [];
    const totalPrice = selectedProducts.reduce(
      (sum, item) => sum + (Number(item?.price) || 0),
      0,
    );

    const saved = await this.repository.createSavedOutfit(userId, {
      name: name || `Outfit ${new Date().toLocaleDateString()}`,
      products: selectedProducts,
      items: selectedProducts,
      preview_image: session.generatedOutfitImage,
      thumbnail: session.generatedOutfitImage,
      total_price: totalPrice,
      source: source || 'virtual-try-on',
    });

    return this.formatSavedOutfit(saved);
  }

  async listSavedOutfits(userId) {
    const outfits = await this.repository.listSavedOutfits(userId);
    return outfits.map((outfit) => this.formatSavedOutfit(outfit));
  }

  async deleteSavedOutfit(userId, outfitId) {
    const result = await this.repository.deleteSavedOutfit(userId, outfitId);

    if (!result.count) {
      throw new NotFoundException('Saved outfit not found');
    }

    return { deleted: true };
  }

  async ensureSession(userId, data) {
    const existing = await this.repository.findSessionByUserId(userId);

    if (existing) {
      return existing;
    }

    return this.repository.upsertSession(userId, data);
  }

  formatSession(record) {
    const selectedProducts = Array.isArray(record?.selected_products)
      ? record.selected_products
      : [];

    const selection = {};

    for (const item of selectedProducts) {
      if (item?.categoryId && item?.productId) {
        selection[item.categoryId] = item.productId;
      }
    }

    return {
      id: record.id,
      userId: record.user_id,
      tryOnInputImage: record.body_image,
      tryOnInputImageUrl: this.bodyImageResolver.toPublicUrl(record.body_image),
      tryOnTransparentImage: record.transparent_image,
      tryOnTransparentImageUrl: this.bodyImageResolver.toPublicUrl(record.transparent_image),
      tryOnResultImage: record.generated_outfit_image,
      tryOnResultImageUrl: this.bodyImageResolver.toPublicUrl(record.generated_outfit_image),
      bodyImage: record.body_image,
      bodyImageUrl: this.bodyImageResolver.toPublicUrl(record.body_image),
      transparentImage: record.transparent_image,
      transparentImageUrl: this.bodyImageResolver.toPublicUrl(record.transparent_image),
      selectedProducts,
      selection,
      generatedOutfitImage: record.generated_outfit_image,
      generatedOutfitImageUrl: this.bodyImageResolver.toPublicUrl(
        record.generated_outfit_image,
      ),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  formatSavedOutfit(record) {
    const products = Array.isArray(record?.items) && record.items.length
      ? record.items
      : (Array.isArray(record?.products) ? record.products : []);

    return {
      id: record.id,
      userId: record.user_id,
      name: record.name,
      products,
      items: products,
      previewImage: record.preview_image,
      previewImageUrl: this.bodyImageResolver.toPublicUrl(record.preview_image),
      thumbnail: record.thumbnail || record.preview_image,
      thumbnailUrl: this.bodyImageResolver.toPublicUrl(
        record.thumbnail || record.preview_image,
      ),
      totalPrice: record.total_price ?? products.reduce(
        (sum, item) => sum + (Number(item?.price) || 0),
        0,
      ),
      source: record.source || 'virtual-try-on',
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }
}
