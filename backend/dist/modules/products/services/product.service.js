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
    constructor(productRepository){
        this.productRepository = productRepository;
    }
    async findAll(query) {
        const [products, total] = await this.productRepository.findMany(query);
        return {
            items: products.map((product)=>this.formatProduct(product)),
            meta: {
                total,
                page: query.page,
                limit: query.limit,
                totalPages: Math.ceil(total / query.limit) || 1
            }
        };
    }
    async findOne(id) {
        const product = await this.productRepository.findById(id);
        if (!product) {
            throw new _common.NotFoundException('Product not found');
        }
        return this.formatProduct(product);
    }
    async create(dto) {
        await this.ensureSkuAvailable(dto.sku);
        const product = await this.productRepository.create(this.mapProductFields(dto), dto.images || []);
        return this.formatProduct(product);
    }
    async update(id, dto) {
        await this.ensureProductExists(id);
        if (dto.sku) {
            await this.ensureSkuAvailable(dto.sku, id);
        }
        const product = await this.productRepository.update(id, this.mapProductFields(dto), dto.images);
        return this.formatProduct(product);
    }
    async remove(id) {
        await this.ensureProductExists(id);
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
    mapProductFields(dto) {
        const data = {};
        if (dto.sku !== undefined) {
            data.sku = dto.sku;
        }
        if (dto.name !== undefined) {
            data.name = dto.name;
        }
        if (dto.description !== undefined) {
            data.description = dto.description;
        }
        if (dto.category_id !== undefined) {
            data.category_id = dto.category_id;
        }
        if (dto.brand_id !== undefined) {
            data.brand_id = dto.brand_id;
        }
        if (dto.price !== undefined) {
            data.price = dto.price;
        }
        return data;
    }
    formatProduct(product) {
        return {
            id: product.id,
            sku: product.sku,
            name: product.name,
            description: product.description,
            category_id: product.category_id,
            brand_id: product.brand_id,
            price: product.price,
            images: (product.images || []).map((image)=>({
                    id: image.id,
                    url: image.url,
                    sort_order: image.sort_order,
                    is_primary: image.is_primary,
                    created_at: image.created_at
                })),
            created_at: product.created_at,
            updated_at: product.updated_at
        };
    }
};
ProductService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_productrepository.ProductRepository)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], ProductService);

//# sourceMappingURL=product.service.js.map