"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ProductService", {
    enumerable: true,
    get: function() {
        return ProductService;
    }
});
const _common = require("@nestjs/common");
const _productrepository = require("../repositories/product.repository");
const _aiservice = require("../../ai/services/ai.service");
const _productcatalogmapper = require("../utils/product-catalog.mapper");
const _normalizeproductqueryutil = require("../utils/normalize-product-query.util");
const _productidentityutil = require("../utils/product-identity.util");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let ProductService = class ProductService {
    constructor(productRepository, aiService){
        this.productRepository = productRepository;
        this.aiService = aiService;
    }
    async findAll(query) {
        const normalizedQuery = (0, _normalizeproductqueryutil.normalizeProductQuery)(query);
        const [products, total] = await this.productRepository.findMany(normalizedQuery);
        return this.buildPaginatedResponse(products, total, normalizedQuery);
    }
    async findByCategory(category, query) {
        const normalizedQuery = (0, _normalizeproductqueryutil.normalizeProductQuery)({
            ...query,
            category: decodeURIComponent(category)
        });
        const [products, total] = await this.productRepository.findMany(normalizedQuery);
        return this.buildPaginatedResponse(products, total, normalizedQuery);
    }
    async search(query) {
        const normalizedQuery = (0, _normalizeproductqueryutil.normalizeProductQuery)(query);
        const searchTerm = (normalizedQuery.q ?? normalizedQuery.search)?.trim();
        if (!searchTerm) {
            throw new _common.BadRequestException('Search query is required (use q or search)');
        }
        const [products, total] = await this.productRepository.findMany({
            ...normalizedQuery,
            search: searchTerm
        });
        return this.buildPaginatedResponse(products, total, normalizedQuery);
    }
    buildPaginatedResponse(products, total, query) {
        return {
            items: products.map((product)=>this.formatProduct(product)),
            total,
            page: query.page,
            limit: query.limit
        };
    }
    async findOne(id) {
        const product = await this.productRepository.findById(id);
        if (!product) {
            throw new _common.NotFoundException('Product not found');
        }
        return this.formatProduct(product);
    }
    async findBySku(sku) {
        const product = await this.productRepository.findBySku(sku);
        if (!product) {
            throw new _common.NotFoundException('Product not found');
        }
        return this.formatProduct(product);
    }
    async create(dto) {
        await this.ensureSkuAvailable(dto.sku);
        const createData = (0, _productcatalogmapper.mapCreateOrUpdateProductData)(dto);
        if ((0, _productidentityutil.isCatalogSku)(dto.sku)) {
            createData.id = (0, _productidentityutil.resolveStableProductId)(dto.sku);
        }
        const product = await this.productRepository.create(createData, (0, _productcatalogmapper.resolveCatalogImages)(dto));
        this.scheduleEmbedding(product);
        return this.formatProduct(product);
    }
    async update(id, dto) {
        const existing = await this.ensureProductExists(id);
        if (dto.sku !== undefined && dto.sku !== existing.sku) {
            throw new _common.BadRequestException('SKU is immutable after product creation');
        }
        const images = dto.images !== undefined || dto.imageUrl !== undefined ? (0, _productcatalogmapper.resolveCatalogImages)(dto) : undefined;
        const product = await this.productRepository.update(id, (0, _productcatalogmapper.mapCreateOrUpdateProductData)(dto, {
            allowSku: false
        }), images);
        return this.formatProduct(product);
    }
    async remove(id) {
        const product = await this.ensureProductExists(id);
        const referenceCount = await this.productRepository.countReferences(id);
        if ((0, _productidentityutil.isCatalogSku)(product.sku) || referenceCount > 0) {
            const deactivated = await this.productRepository.update(id, {
                is_active: false
            });
            return {
                message: 'Product deactivated to preserve wishlist and recommendation references',
                product: this.formatProduct(deactivated)
            };
        }
        await this.productRepository.delete(id);
        return {
            message: 'Product deleted successfully'
        };
    }
    async ensureProductExists(id) {
        const product = await this.productRepository.findById(id);
        if (!product) {
            throw new _common.NotFoundException('Product not found');
        }
        return product;
    }
    async ensureSkuAvailable(sku, excludeId) {
        const existing = await this.productRepository.findBySku(sku);
        if (existing && existing.id !== excludeId) {
            throw new _common.ConflictException('SKU already exists');
        }
    }
    scheduleEmbedding(product) {
        if (!this.aiService.isConfigured()) {
            return;
        }
        this.aiService.embedProduct({
            product_id: product.id,
            product: {
                name: product.name,
                description: product.description,
                sku: product.sku,
                category: product.category ?? product.category_id,
                brand: product.brand ?? product.brand_id
            }
        }).catch(()=>null);
    }
    formatProduct(product) {
        return (0, _productcatalogmapper.formatCatalogProduct)(product);
    }
};
ProductService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_productrepository.ProductRepository)),
    _ts_param(1, (0, _common.Inject)(_aiservice.AiService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ])
], ProductService);

//# sourceMappingURL=product.service.js.map