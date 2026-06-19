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
    constructor(wishlistRepository){
        this.wishlistRepository = wishlistRepository;
    }
    async getWishlist(userId) {
        const items = await this.wishlistRepository.findByUserId(userId);
        return {
            items: items.map((item)=>this.formatWishlistItem(item))
        };
    }
    async addToWishlist(userId, dto) {
        const productExists = await this.wishlistRepository.productExists(dto.product_id);
        if (!productExists) {
            throw new _common.NotFoundException('Product not found');
        }
        const existing = await this.wishlistRepository.findByUserAndProduct(userId, dto.product_id);
        if (existing) {
            throw new _common.ConflictException('Product already in wishlist');
        }
        const item = await this.wishlistRepository.create(userId, dto.product_id);
        return this.formatWishlistItem(item);
    }
    async removeFromWishlist(userId, id) {
        const item = await this.wishlistRepository.findByIdAndUserId(id, userId);
        if (!item) {
            throw new _common.NotFoundException('Wishlist item not found');
        }
        await this.wishlistRepository.delete(id);
        return {
            message: 'Removed from wishlist successfully'
        };
    }
    formatWishlistItem(item) {
        return {
            id: item.id,
            user_id: item.user_id,
            product_id: item.product_id,
            created_at: item.created_at,
            product: this.formatProduct(item.product)
        };
    }
    formatProduct(product) {
        if (!product) {
            return null;
        }
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
                    is_primary: image.is_primary
                }))
        };
    }
};
WishlistService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_wishlistrepository.WishlistRepository)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], WishlistService);

//# sourceMappingURL=wishlist.service.js.map