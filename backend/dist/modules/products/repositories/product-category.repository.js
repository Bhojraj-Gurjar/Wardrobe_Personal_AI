"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ProductCategoryRepository", {
    enumerable: true,
    get: function() {
        return ProductCategoryRepository;
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
let ProductCategoryRepository = class ProductCategoryRepository {
    constructor(prismaService){
        this.prisma = prismaService;
    }
    findAllGroupsWithCategories({ includeInactive = false } = {}) {
        return this.prisma.productCategoryGroup.findMany({
            where: includeInactive ? undefined : {
                is_active: true
            },
            orderBy: {
                sort_order: 'asc'
            },
            include: {
                categories: {
                    where: includeInactive ? undefined : {
                        is_active: true
                    },
                    orderBy: {
                        sort_order: 'asc'
                    }
                }
            }
        });
    }
    findGroupByCode(code) {
        return this.prisma.productCategoryGroup.findUnique({
            where: {
                code
            },
            include: {
                categories: {
                    orderBy: {
                        sort_order: 'asc'
                    }
                }
            }
        });
    }
    upsertGroup(group) {
        return this.prisma.productCategoryGroup.upsert({
            where: {
                code: group.code
            },
            create: {
                code: group.code,
                name: group.name,
                description: group.description ?? null,
                sort_order: group.sort_order ?? 0,
                is_active: group.is_active ?? true
            },
            update: {
                name: group.name,
                description: group.description ?? null,
                sort_order: group.sort_order ?? 0,
                is_active: group.is_active ?? true
            }
        });
    }
    upsertCategory(groupId, category) {
        return this.prisma.productCategory.upsert({
            where: {
                slug: category.slug
            },
            create: {
                group_id: groupId,
                slug: category.slug,
                name: category.name,
                sort_order: category.sort_order ?? 0,
                is_active: category.is_active ?? true
            },
            update: {
                group_id: groupId,
                name: category.name,
                sort_order: category.sort_order ?? 0,
                is_active: category.is_active ?? true
            }
        });
    }
    countGroups() {
        return this.prisma.productCategoryGroup.count();
    }
};
ProductCategoryRepository = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_prismaservice.PrismaService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], ProductCategoryRepository);

//# sourceMappingURL=product-category.repository.js.map