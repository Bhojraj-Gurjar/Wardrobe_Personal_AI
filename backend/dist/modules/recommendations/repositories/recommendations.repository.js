"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RecommendationsRepository", {
    enumerable: true,
    get: function() {
        return RecommendationsRepository;
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
let RecommendationsRepository = class RecommendationsRepository {
    constructor(prismaService){
        this.prisma = prismaService;
    }
    async getUserSignals(userId) {
        const [profile, fashionDna, wishlistItems, orders, faceAnalysis, bodyAnalysis, closetItems] = await Promise.all([
            this.prisma.userProfile.findUnique({
                where: {
                    user_id: userId
                }
            }),
            this.prisma.fashionDna.findUnique({
                where: {
                    user_id: userId
                }
            }),
            this.prisma.wishlist.findMany({
                where: {
                    user_id: userId
                },
                include: {
                    product: {
                        include: {
                            images: {
                                orderBy: {
                                    sort_order: 'asc'
                                }
                            }
                        }
                    }
                }
            }),
            this.prisma.order.findMany({
                where: {
                    user_id: userId
                },
                orderBy: {
                    created_at: 'desc'
                }
            }),
            this.prisma.faceAnalysis.findUnique({
                where: {
                    user_id: userId
                }
            }),
            this.prisma.bodyAnalysis.findUnique({
                where: {
                    user_id: userId
                }
            }),
            this.prisma.personalClosetItem.findMany({
                where: {
                    user_id: userId,
                    is_removed: false
                },
                include: {
                    product: {
                        include: {
                            images: {
                                orderBy: {
                                    sort_order: 'asc'
                                }
                            }
                        }
                    }
                },
                take: 20,
                orderBy: {
                    created_at: 'desc'
                }
            })
        ]);
        return {
            profile,
            fashionDna,
            wishlistItems,
            orders,
            faceAnalysis,
            bodyAnalysis,
            closetItems
        };
    }
    findProductsByIds(ids) {
        if (!ids.length) {
            return Promise.resolve([]);
        }
        return this.prisma.product.findMany({
            where: {
                id: {
                    in: ids
                }
            },
            include: PRODUCT_INCLUDE
        });
    }
    findCandidateProducts(excludeIds, limit) {
        return this.prisma.product.findMany({
            where: excludeIds.length ? {
                id: {
                    notIn: excludeIds
                }
            } : undefined,
            include: PRODUCT_INCLUDE,
            take: Math.max(limit * 5, 50),
            orderBy: {
                created_at: 'desc'
            }
        });
    }
};
RecommendationsRepository = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_prismaservice.PrismaService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], RecommendationsRepository);

//# sourceMappingURL=recommendations.repository.js.map