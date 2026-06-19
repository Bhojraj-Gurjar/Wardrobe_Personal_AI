"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "WishlistRepository", {
    enumerable: true,
    get: function() {
        return WishlistRepository;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../../../database/prisma.service");
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
const PRODUCT_INCLUDE = {
    images: {
        orderBy: {
            sort_order: 'asc'
        }
    }
};
let WishlistRepository = class WishlistRepository {
    constructor(prismaService){
        this.prisma = prismaService;
    }
    findByUserId(userId) {
        return this.prisma.wishlist.findMany({
            where: {
                user_id: userId
            },
            include: {
                product: {
                    include: PRODUCT_INCLUDE
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });
    }
    findByIdAndUserId(id, userId) {
        return this.prisma.wishlist.findFirst({
            where: {
                id,
                user_id: userId
            },
            include: {
                product: {
                    include: PRODUCT_INCLUDE
                }
            }
        });
    }
    findByUserAndProduct(userId, productId) {
        return this.prisma.wishlist.findUnique({
            where: {
                user_id_product_id: {
                    user_id: userId,
                    product_id: productId
                }
            }
        });
    }
    async productExists(productId) {
        const count = await this.prisma.product.count({
            where: {
                id: productId
            }
        });
        return count > 0;
    }
    create(userId, productId) {
        return this.prisma.wishlist.create({
            data: {
                user_id: userId,
                product_id: productId
            },
            include: {
                product: {
                    include: PRODUCT_INCLUDE
                }
            }
        });
    }
    delete(id) {
        return this.prisma.wishlist.delete({
            where: {
                id
            }
        });
    }
};
WishlistRepository = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_prismaservice.PrismaService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], WishlistRepository);

//# sourceMappingURL=wishlist.repository.js.map