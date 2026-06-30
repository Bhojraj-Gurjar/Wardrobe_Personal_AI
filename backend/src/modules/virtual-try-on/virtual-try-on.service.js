import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ProductRepository } from '../products/repositories/product.repository';
import { TryOnService } from '../try-on/try-on.service';
import { assessTryOnCompatibility } from '../try-on/utils/try-on-product-compatibility.util';
import {
  buildTryOnGarmentPlan,
  describeTryOnMode,
} from '../try-on/utils/try-on-garment-plan.util';
import {
  inferProductType,
  resolveCatvtonRegionFromProductType,
  resolveTryOnSlotFromProductType,
} from '../products/constants/product-type.constants';
import {
  mapProductImagesForResponse,
  resolvePublicProductImageUrl,
} from '../products/utils/resolve-product-image.util';
import { StoragePathResolver } from '../../storage/services/storage-path-resolver.service';
import { FashionDnaRegenerationService } from '../fashion-dna/services/fashion-dna-regeneration.service';
import { REFRESH_SOURCES } from '../fashion-dna/constants/fashion-dna-regeneration.constants';
import { UserMediaRegistryService } from '../user-media/services/user-media-registry.service';
import { VirtualTryOnRepository } from './virtual-try-on.repository';
import { NotificationsService } from '../notifications/notifications.service';
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

function formatDbProduct(product, storagePathResolver) {
  if (!product) {
    return null;
  }

  const imageUrl = resolvePublicProductImageUrl(product, storagePathResolver);
  const compatibility = assessTryOnCompatibility(product);
  const tryOnImage = compatibility.tryOnImage
    ? (storagePathResolver?.toPublicUrl(compatibility.tryOnImage) || compatibility.tryOnImage)
    : imageUrl;

  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    category: product.category,
    subcategory: product.subcategory,
    productType: product.product_type,
    product_type: product.product_type,
    brand: product.brand,
    price: product.price,
    currency: product.currency,
    color: product.color,
    fitType: product.fit_type,
    fit_type: product.fit_type,
    imageUrl,
    image_url: imageUrl,
    tryOnImage,
    try_on_image: tryOnImage,
    images: mapProductImagesForResponse(product, storagePathResolver),
    avatarCategory: product.avatar_category,
    avatar_category: product.avatar_category,
    overlayOrder: product.overlay_order,
    overlay_order: product.overlay_order,
    avatarOverlayUrl: product.avatar_overlay_url
      ? (storagePathResolver?.toPublicUrl(product.avatar_overlay_url) || product.avatar_overlay_url)
      : null,
    avatar_overlay_url: product.avatar_overlay_url,
    is_try_on_compatible: product.is_try_on_compatible,
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
    @Inject(FashionDnaRegenerationService) fashionDnaRegenerationService,
    @Inject(UserMediaRegistryService) userMediaRegistryService,
    @Inject(NotificationsService) notificationsService,
  ) {
    this.repository = repository;
    this.bodyImageResolver = bodyImageResolver;
    this.backgroundRemovalService = backgroundRemovalService;
    this.productRepository = productRepository;
    this.storagePathResolver = storagePathResolver;
    this.tryOnService = tryOnService;
    this.fashionDnaRegenerationService = fashionDnaRegenerationService;
    this.userMediaRegistryService = userMediaRegistryService;
    this.notificationsService = notificationsService;
    this.logger = new Logger(VirtualTryOnService.name);
  }

  scheduleFashionDnaRefresh(userId, source = REFRESH_SOURCES.TRY_ON) {
    this.fashionDnaRegenerationService?.trigger(userId, source);
  }

  async getSetup(userId) {
    const session = await this.repository.findSessionByUserId(userId);
    const tryOnSessionPath = this.isTryOnPersonSessionPath(session?.body_image)
      ? session.body_image
      : null;
    const bodyImagePath = tryOnSessionPath
      || await this.bodyImageResolver.resolveBodyImagePath(userId);

    if (!bodyImagePath) {
      return {
        ready: false,
        message: 'Complete onboarding with a body photo to use Virtual Try-On.',
        bodyPhoto: null,
        bodyPhotoUrl: null,
        bodyPhotoReference: null,
        hasTransparentCache: false,
        transparentImageUrl: null,
        sessionPhotoActive: false,
        sessionBodyPhotoUrl: null,
      };
    }

    if (!tryOnSessionPath) {
      await this.bodyImageResolver.syncTryOnSessionInput(userId);
    }

    const displayPath = tryOnSessionPath
      ? tryOnSessionPath
      : await this.bodyImageResolver.resolveDisplayBodyImagePath(userId);
    const transparentPath = tryOnSessionPath
      ? null
      : await this.bodyImageResolver.resolveTransparentBodyImagePath(userId);
    const refreshedSession = tryOnSessionPath
      ? session
      : await this.repository.findSessionByUserId(userId);
    const hasTransparentCache = Boolean(transparentPath)
      || Boolean(refreshedSession?.transparent_image)
      || this.backgroundRemovalService.transparentPngExists(userId);
    const bodyPhotoUrl = this.bodyImageResolver.toPublicUrl(displayPath || bodyImagePath);
    const sessionBodyPhotoUrl = tryOnSessionPath
      ? this.bodyImageResolver.toPublicUrl(tryOnSessionPath)
      : null;

    return {
      ready: true,
      message: null,
      bodyPhoto: bodyImagePath,
      bodyPhotoUrl,
      bodyPhotoReference: bodyImagePath,
      bodyImage: bodyImagePath,
      bodyImageUrl: bodyPhotoUrl,
      bodyPhotoOriginalUrl: this.bodyImageResolver.toPublicUrl(bodyImagePath),
      bodyPhotoTransparentUrl: transparentPath
        ? this.bodyImageResolver.toPublicUrl(transparentPath)
        : null,
      hasTransparentCache,
      transparentImageUrl: transparentPath
        ? this.bodyImageResolver.toPublicUrl(transparentPath)
        : refreshedSession?.transparent_image
          ? this.bodyImageResolver.toPublicUrl(refreshedSession.transparent_image)
          : null,
      sessionPhotoActive: Boolean(tryOnSessionPath),
      sessionBodyPhotoUrl,
    };
  }

  isTryOnPersonSessionPath(storagePath) {
    return typeof storagePath === 'string' && storagePath.includes('/uploads/try-on/');
  }

  async saveSessionPersonPhoto(userId, storagePath) {
    if (!storagePath) {
      return { saved: false };
    }

    await this.repository.upsertSession(userId, {
      body_image: storagePath,
    });

    return { saved: true, storagePath };
  }

  async clearSessionPersonPhoto(userId) {
    const session = await this.repository.findSessionByUserId(userId);

    if (!this.isTryOnPersonSessionPath(session?.body_image)) {
      return { cleared: false };
    }

    await this.repository.upsertSession(userId, {
      body_image: null,
      transparent_image: null,
    });

    return { cleared: true };
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
      category: query.category,
      productType: query.productType ?? query.product_type,
      gender: query.gender,
      color: query.color,
      size: query.size,
      is_active: true,
    });

    let mapped = products.map((product) => {
      const compatibility = assessTryOnCompatibility(product);
      const imageUrl = resolvePublicProductImageUrl(product, this.storagePathResolver);
      const tryOnImage = compatibility.tryOnImage
        ? (this.storagePathResolver.toPublicUrl(compatibility.tryOnImage)
          || compatibility.tryOnImage)
        : imageUrl;
      const images = mapProductImagesForResponse(product, this.storagePathResolver);

      return {
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        currency: product.currency,
        category: product.category,
        subcategory: product.subcategory,
        productType: product.product_type,
        imageUrl,
        image: imageUrl,
        tryOnImage,
        thumbnailUrl: imageUrl,
        thumbnail: imageUrl,
        images,
        productImages: images,
        isTryOnCompatible: compatibility.isTryOnCompatible,
        compatibilityLabel: compatibility.compatibilityLabel,
        tryOnSlot: resolveTryOnSlotFromProductType(product.product_type || inferProductType(product)),
        tryOnRegion: resolveCatvtonRegionFromProductType(
          product.product_type || inferProductType(product),
        ),
      };
    });

    if (category) {
      const subcategories = CATEGORY_SUBCATEGORY_MAP[category] ?? [category];
      mapped = mapped.filter((product) => {
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
      mapped = mapped.filter((product) => {
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

    const compatibleOnly = String(query.compatibleOnly || query.compatible_only || '')
      .toLowerCase() === 'true';

    let filtered = compatibleOnly
      ? mapped.filter((product) => product.isTryOnCompatible)
      : mapped;

    let compatibleFallbackApplied = false;

    if (
      compatibleOnly
      && filtered.length === 0
      && !search
      && !category
    ) {
      compatibleFallbackApplied = true;
      filtered = mapped;
    }

    const paged = filtered.slice((page - 1) * limit, page * limit);
    const resultTotal = search || category || compatibleOnly
      ? filtered.length
      : total;

    return {
      page,
      limit,
      total: resultTotal,
      products: paged,
      meta: {
        total: resultTotal,
        page,
        limit,
        totalPages: Math.ceil(resultTotal / limit) || 1,
        compatibleFallbackApplied,
      },
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

    const compatibility = assessTryOnCompatibility(record);

    if (!compatibility.isTryOnCompatible || !compatibility.tryOnImage) {
      throw new BadRequestException('Selected product is not compatible with virtual try-on.');
    }

    const product = formatDbProduct(record, this.storagePathResolver);
    const garmentImageUrl = this.storagePathResolver.toPublicUrl(compatibility.tryOnImage)
      || product.imageUrl;

    if (!garmentImageUrl) {
      throw new BadRequestException('Product has no garment image.');
    }

    let transparentPath = null;

    if (!usingTemporaryBody) {
      await this.repository.upsertSession(userId, {
        body_image: bodyPhotoPath,
        transparent_image: null,
      });
    }

    const personImageUrl = usingTemporaryBody
      ? temporaryBodyImageUrl
      : this.storagePathResolver.toPublicUrl(bodyPhotoPath);

    this.logger.log(`Generating virtual try-on for user=${userId} product=${productId}`);

    const garmentRegion = resolveCatvtonRegionFromProductType(
      inferProductType(record),
    ) || 'upper';

    const catvtonResult = await this.tryOnService.generateTryOn(
      userId,
      personImageUrl,
      garmentImageUrl,
      { persistHistory: false, garmentRegion },
    );

    const generatedImageUrl = this.tryOnService.toBrowserAccessibleTryOnUrl(
      catvtonResult?.resultImageUrl
      || catvtonResult?.result_image_url
      || null,
    );

    const persistedGeneratedImage = await this.tryOnService.persistGeneratedResult(
      userId,
      generatedImageUrl,
    );

    if (persistedGeneratedImage) {
      await this.userMediaRegistryService.registerTryOnResult(userId, persistedGeneratedImage, {
        productId,
        bodyPhotoReference: usingTemporaryBody ? null : bodyPhotoPath,
      });
    }

    const resultRecord = await this.repository.createTryOnResult(userId, {
      product_id: productId,
      body_photo_reference: usingTemporaryBody ? null : bodyPhotoPath,
      transparent_image: transparentPath,
      garment_image: garmentImageUrl,
      generated_image: persistedGeneratedImage || generatedImageUrl,
      input_image: usingTemporaryBody ? temporaryBodyImageUrl : bodyPhotoPath,
      selected_products: [product],
    });

    const session = await this.repository.findSessionByUserId(userId);
    const sessionBodyImage = usingTemporaryBody
      ? (this.isTryOnPersonSessionPath(session?.body_image)
        ? session.body_image
        : null)
      : bodyPhotoPath;

    await this.repository.upsertSession(userId, {
      body_image: sessionBodyImage || bodyPhotoPath,
      transparent_image: usingTemporaryBody ? null : transparentPath,
      generated_outfit_image: persistedGeneratedImage || generatedImageUrl,
      selected_products: [product],
    });

    this.scheduleFashionDnaRefresh(userId, REFRESH_SOURCES.TRY_ON);

    const displayBodyPath = usingTemporaryBody
      ? null
      : await this.bodyImageResolver.resolveDisplayBodyImagePath(userId);

    this.logger.log(
      `Virtual try-on completed for user=${userId} product=${productId} image=${persistedGeneratedImage || generatedImageUrl}`,
    );

    this.notificationsService.notifyVirtualTryOnCompleted(
      userId,
      resultRecord.id,
      product?.name,
    ).catch(() => null);

    return {
      result: this.formatTryOnResult(resultRecord, product),
      bodyPhotoUrl: usingTemporaryBody
        ? temporaryBodyImageUrl
        : this.storagePathResolver.toPublicUrl(
          displayBodyPath || bodyPhotoPath,
        ),
      generatedImageUrl: this.tryOnService.toPublicTryOnUrl(
        persistedGeneratedImage || generatedImageUrl,
        (path) => this.storagePathResolver.toPublicUrl(path),
      ),
      tryOnMode: catvtonResult?.tryOnMode || (garmentRegion === 'lower' ? 'lower' : 'upper'),
      tryOnModeLabel: describeTryOnMode(
        catvtonResult?.tryOnMode || (garmentRegion === 'lower' ? 'lower' : 'upper'),
      ),
      garmentsApplied: catvtonResult?.garmentsApplied || 1,
    };
  }

  async generateOutfitTryOn(userId, productIds = [], options = {}) {
    const uniqueIds = [...new Set((productIds || []).filter(Boolean))];

    if (!uniqueIds.length) {
      throw new BadRequestException('Select at least one product to try on.');
    }

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

    const records = await Promise.all(
      uniqueIds.map((id) => this.productRepository.findById(id)),
    );

    const products = records
      .filter((record) => record && record.is_active !== false)
      .map((record) => formatDbProduct(record, this.storagePathResolver));

    if (!products.length) {
      throw new NotFoundException('No valid products found for try-on.');
    }

    const plan = buildTryOnGarmentPlan(records.filter(Boolean));

    if (!plan.garments.length) {
      const reason = plan.unsupported[0]?.reason
        || 'Selected products are not compatible with virtual try-on.';
      throw new BadRequestException(reason);
    }

    if (plan.unsupported.length) {
      this.logger.warn(
        `Skipping unsupported try-on products for user=${userId}: ${plan.unsupported
          .map((entry) => entry.product?.name)
          .filter(Boolean)
          .join(', ')}`,
      );
    }

    const garmentLayers = plan.garments.map((entry) => {
      const compatibility = assessTryOnCompatibility(
        records.find((record) => record?.id === entry.product.id),
      );
      const garmentImageUrl = this.storagePathResolver.toPublicUrl(compatibility.tryOnImage)
        || entry.product.imageUrl;

      if (!garmentImageUrl) {
        throw new BadRequestException(`${entry.product.name} has no garment image.`);
      }

      return {
        garmentImageUrl,
        garmentRegion: entry.region,
      };
    });

    if (!usingTemporaryBody) {
      await this.repository.upsertSession(userId, {
        body_image: bodyPhotoPath,
        transparent_image: null,
      });
    }

    const personImageUrl = usingTemporaryBody
      ? temporaryBodyImageUrl
      : this.storagePathResolver.toPublicUrl(bodyPhotoPath);

    this.logger.log(
      `Generating outfit try-on for user=${userId} mode=${plan.mode} layers=${garmentLayers.length}`,
    );

    const catvtonResult = await this.tryOnService.generateTryOn(
      userId,
      personImageUrl,
      null,
      { persistHistory: false, garments: garmentLayers },
    );

    const generatedImageUrl = this.tryOnService.toBrowserAccessibleTryOnUrl(
      catvtonResult?.resultImageUrl
      || catvtonResult?.result_image_url
      || null,
    );

    const persistedGeneratedImage = await this.tryOnService.persistGeneratedResult(
      userId,
      generatedImageUrl,
    );

    if (persistedGeneratedImage) {
      await this.userMediaRegistryService.registerTryOnResult(userId, persistedGeneratedImage, {
        productId: products[0]?.id,
        bodyPhotoReference: usingTemporaryBody ? null : bodyPhotoPath,
      });
    }

    const resultRecord = await this.repository.createTryOnResult(userId, {
      product_id: products[0]?.id,
      body_photo_reference: usingTemporaryBody ? null : bodyPhotoPath,
      transparent_image: null,
      garment_image: garmentLayers[0]?.garmentImageUrl || null,
      generated_image: persistedGeneratedImage || generatedImageUrl,
      input_image: usingTemporaryBody ? temporaryBodyImageUrl : bodyPhotoPath,
      selected_products: products,
    });

    const session = await this.repository.findSessionByUserId(userId);
    const sessionBodyImage = usingTemporaryBody
      ? (this.isTryOnPersonSessionPath(session?.body_image)
        ? session.body_image
        : null)
      : bodyPhotoPath;

    await this.repository.upsertSession(userId, {
      body_image: sessionBodyImage || bodyPhotoPath,
      transparent_image: usingTemporaryBody ? null : null,
      generated_outfit_image: persistedGeneratedImage || generatedImageUrl,
      selected_products: products,
    });

    this.scheduleFashionDnaRefresh(userId, REFRESH_SOURCES.TRY_ON);

    const displayBodyPath = usingTemporaryBody
      ? null
      : await this.bodyImageResolver.resolveDisplayBodyImagePath(userId);

    this.notificationsService.notifyVirtualTryOnCompleted(
      userId,
      resultRecord.id,
      products.map((item) => item.name).filter(Boolean).join(' + '),
    ).catch(() => null);

    const resolvedMode = catvtonResult?.tryOnMode || plan.mode;

    return {
      result: this.formatTryOnResult(resultRecord, products[0]),
      bodyPhotoUrl: usingTemporaryBody
        ? temporaryBodyImageUrl
        : this.storagePathResolver.toPublicUrl(
          displayBodyPath || bodyPhotoPath,
        ),
      generatedImageUrl: this.tryOnService.toPublicTryOnUrl(
        persistedGeneratedImage || generatedImageUrl,
        (path) => this.storagePathResolver.toPublicUrl(path),
      ),
      tryOnMode: resolvedMode,
      tryOnModeLabel: describeTryOnMode(resolvedMode),
      garmentsApplied: catvtonResult?.garmentsApplied || garmentLayers.length,
      selectedProducts: products,
      skippedProducts: plan.unsupported.map((entry) => ({
        id: entry.product?.id,
        name: entry.product?.name,
        reason: entry.reason,
      })),
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

    this.scheduleFashionDnaRefresh(userId, REFRESH_SOURCES.SAVED_LOOK);

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
      generatedImageUrl: this.tryOnService.toPublicTryOnUrl(
        record.generated_image,
        (path) => this.storagePathResolver.toPublicUrl(path),
      ),
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
      .map((product) => formatDbProduct(product, this.storagePathResolver))
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

      product = formatDbProduct(record, this.storagePathResolver);
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
        productsById[id] = formatDbProduct(record, this.storagePathResolver);
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

    this.scheduleFashionDnaRefresh(userId, REFRESH_SOURCES.SAVED_LOOK);

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
