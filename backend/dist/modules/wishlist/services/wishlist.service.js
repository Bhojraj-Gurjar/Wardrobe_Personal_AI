"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "WishlistService", {
    enumerable: true,
    get: function() {
        return WishlistService;
    }
});
const _common = require("@nestjs/common");
const _fashiondnaregenerationconstants = require("../../fashion-dna/constants/fashion-dna-regeneration.constants");
const _fashiondnaregenerationservice = require("../../fashion-dna/services/fashion-dna-regeneration.service");
const _productrepository = require("../../products/repositories/product.repository");
const _productcatalogmapper = require("../../products/utils/product-catalog.mapper");
const _wishlistrepository = require("../repositories/wishlist.repository");
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
let WishlistService = class WishlistService {
    constructor(wishlistRepository, fashionDnaRegenerationService, productRepository){
        this.wishlistRepository = wishlistRepository;
        this.fashionDnaRegenerationService = fashionDnaRegenerationService;
        this.productRepository = productRepository;
    }
    async getWishlist(userId) {
        const items = await this.wishlistRepository.findByUserId(userId);
        return {
            items: items.map((item)=>this.formatWishlistItem(item))
        };
    }
    async addToWishlist(userId, dto) {
        const productId = await this.resolveProductId(dto);
        const existing = await this.wishlistRepository.findByUserAndProduct(userId, productId);
        if (existing) {
            throw new _common.ConflictException('Product already in wishlist');
        }
        const item = await this.wishlistRepository.create(userId, productId);
        this.fashionDnaRegenerationService.trigger(userId, _fashiondnaregenerationconstants.REFRESH_SOURCES.WISHLIST_UPDATE);
        return this.formatWishlistItem(item);
    }
    async removeFromWishlist(userId, id) {
        const item = await this.wishlistRepository.findByIdAndUserId(id, userId);
        if (!item) {
            throw new _common.NotFoundException('Wishlist item not found');
        }
        await this.wishlistRepository.delete(id);
        this.fashionDnaRegenerationService.trigger(userId, _fashiondnaregenerationconstants.REFRESH_SOURCES.WISHLIST_UPDATE);
        return {
            message: 'Removed from wishlist successfully'
        };
    }
    async resolveProductId(dto) {
        if (dto.product_id) {
            const exists = await this.wishlistRepository.productExists(dto.product_id);
            if (!exists) {
                throw new _common.NotFoundException('Product not found');
            }
            return dto.product_id;
        }
        if (dto.sku) {
            const product = await this.productRepository.findBySku(dto.sku);
            if (!product) {
                throw new _common.NotFoundException('Product not found');
            }
            return product.id;
        }
        throw new _common.BadRequestException('product_id or sku is required');
    }
    formatWishlistItem(item) {
        return {
            id: item.id,
            user_id: item.user_id,
            product_id: item.product_id,
            product_sku: item.product?.sku ?? null,
            created_at: item.created_at,
            product: this.formatProduct(item.product)
        };
    }
    formatProduct(product) {
        if (!product) {
            return null;
        }
        return (0, _productcatalogmapper.formatCatalogProduct)(product);
    }
};
WishlistService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_wishlistrepository.WishlistRepository)),
    _ts_param(1, (0, _common.Inject)(_fashiondnaregenerationservice.FashionDnaRegenerationService)),
    _ts_param(2, (0, _common.Inject)(_productrepository.ProductRepository)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0,
        void 0
    ])
], WishlistService);

//# sourceMappingURL=wishlist.service.js.map