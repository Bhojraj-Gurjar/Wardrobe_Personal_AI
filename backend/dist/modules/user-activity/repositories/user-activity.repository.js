"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UserActivityRepository", {
    enumerable: true,
    get: function() {
        return UserActivityRepository;
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
let UserActivityRepository = class UserActivityRepository {
    constructor(prismaService){
        this.prisma = prismaService;
    }
    productExists(productId) {
        return this.prisma.product.findUnique({
            where: {
                id: productId
            },
            select: {
                id: true
            }
        });
    }
    createProductView(userId, productId) {
        return this.prisma.productView.create({
            data: {
                user_id: userId,
                product_id: productId
            }
        });
    }
    createSearchHistory(userId, query) {
        return this.prisma.searchHistory.create({
            data: {
                user_id: userId,
                query: query.trim()
            }
        });
    }
    findRecentSearches(userId, limit = 10) {
        return this.prisma.searchHistory.findMany({
            where: {
                user_id: userId
            },
            orderBy: {
                searched_at: 'desc'
            },
            take: 50
        });
    }
    deleteSearchHistory(userId) {
        return this.prisma.searchHistory.deleteMany({
            where: {
                user_id: userId
            }
        });
    }
    deleteSearchHistoryByIds(userId, ids = []) {
        if (!ids.length) {
            return {
                count: 0
            };
        }
        return this.prisma.searchHistory.deleteMany({
            where: {
                user_id: userId,
                id: {
                    in: ids
                }
            }
        });
    }
};
UserActivityRepository = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_prismaservice.PrismaService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], UserActivityRepository);

//# sourceMappingURL=user-activity.repository.js.map