"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "FashionDnaActivityRepository", {
    enumerable: true,
    get: function() {
        return FashionDnaActivityRepository;
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
const ACTIVITY_LOOKBACK_DAYS = 90;
let FashionDnaActivityRepository = class FashionDnaActivityRepository {
    constructor(prismaService){
        this.prisma = prismaService;
    }
    activitySince() {
        const since = new Date();
        since.setDate(since.getDate() - ACTIVITY_LOOKBACK_DAYS);
        return since;
    }
    findOrders(userId) {
        return this.prisma.order.findMany({
            where: {
                user_id: userId
            },
            include: {
                product: true
            },
            orderBy: {
                created_at: 'desc'
            }
        });
    }
    findWishlistProducts(userId) {
        return this.prisma.wishlist.findMany({
            where: {
                user_id: userId
            },
            include: {
                product: true
            },
            orderBy: {
                created_at: 'desc'
            }
        });
    }
    findRecentProductViews(userId) {
        return this.prisma.productView.findMany({
            where: {
                user_id: userId,
                viewed_at: {
                    gte: this.activitySince()
                }
            },
            include: {
                product: true
            },
            orderBy: {
                viewed_at: 'desc'
            }
        });
    }
    findRecentSearchHistory(userId) {
        return this.prisma.searchHistory.findMany({
            where: {
                user_id: userId,
                searched_at: {
                    gte: this.activitySince()
                }
            },
            orderBy: {
                searched_at: 'desc'
            },
            take: 100
        });
    }
};
FashionDnaActivityRepository = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_prismaservice.PrismaService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], FashionDnaActivityRepository);

//# sourceMappingURL=fashion-dna-activity.repository.js.map