"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ProductRepository", {
    enumerable: true,
    get: function() {
        return ProductRepository;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../../../database/prisma.service");
const _normalizeproductqueryutil = require("../utils/normalize-product-query.util");
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
let ProductRepository = class ProductRepository {
    constructor(prismaService){
        this.prisma = prismaService;
    }
    findMany(query) {
        const normalizedQuery = (0, _normalizeproductqueryutil.normalizeProductQuery)(query);
        const where = this.buildWhereClause(normalizedQuery);
        const orderBy = {
            [normalizedQuery.sortBy]: normalizedQuery.sortOrder
        };
        const skip = (normalizedQuery.page - 1) * normalizedQuery.limit;
        return this.prisma.$transaction([
            this.prisma.product.findMany({
                where,
                orderBy,
                skip,
                take: normalizedQuery.limit,
                include: {
                    images: {
                        orderBy: {
                            sort_order: 'asc'
                        }
                    }
                }
            }),
            this.prisma.product.count({
                where
            })
        ]);
    }
    findById(id) {
        return this.prisma.product.findUnique({
            where: {
                id
            },
            include: {
                images: {
                    orderBy: {
                        sort_order: 'asc'
                    }
                }
            }
        });
    }
    findBySku(sku) {
        return this.prisma.product.findUnique({
            where: {
                sku
            },
            include: {
                images: {
                    orderBy: {
                        sort_order: 'asc'
                    }
                }
            }
        });
    }
    countReferences(productId) {
        return this.prisma.$transaction([
            this.prisma.wishlist.count({
                where: {
                    product_id: productId
                }
            }),
            this.prisma.productView.count({
                where: {
                    product_id: productId
                }
            }),
            this.prisma.order.count({
                where: {
                    product_id: productId
                }
            })
        ]).then(([wishlist, views, orders])=>wishlist + views + orders);
    }
    create(data, images = []) {
        return this.prisma.product.create({
            data: {
                ...data,
                images: images.length ? {
                    create: this.mapImages(images)
                } : undefined
            },
            include: {
                images: {
                    orderBy: {
                        sort_order: 'asc'
                    }
                }
            }
        });
    }
    update(id, data, images) {
        const updateData = {
            ...data
        };
        if (images !== undefined) {
            updateData.images = {
                deleteMany: {},
                create: this.mapImages(images)
            };
        }
        return this.prisma.product.update({
            where: {
                id
            },
            data: updateData,
            include: {
                images: {
                    orderBy: {
                        sort_order: 'asc'
                    }
                }
            }
        });
    }
    delete(id) {
        return this.prisma.product.delete({
            where: {
                id
            }
        });
    }
    buildWhereClause(query) {
        const and = [];
        if (query.search) {
            and.push({
                OR: [
                    {
                        name: {
                            contains: query.search,
                            mode: 'insensitive'
                        }
                    },
                    {
                        sku: {
                            contains: query.search,
                            mode: 'insensitive'
                        }
                    },
                    {
                        description: {
                            contains: query.search,
                            mode: 'insensitive'
                        }
                    },
                    {
                        brand: {
                            contains: query.search,
                            mode: 'insensitive'
                        }
                    },
                    {
                        category: {
                            contains: query.search,
                            mode: 'insensitive'
                        }
                    },
                    {
                        subcategory: {
                            contains: query.search,
                            mode: 'insensitive'
                        }
                    },
                    {
                        color: {
                            contains: query.search,
                            mode: 'insensitive'
                        }
                    }
                ]
            });
        }
        if (query.category) {
            and.push({
                OR: [
                    {
                        category: {
                            equals: query.category,
                            mode: 'insensitive'
                        }
                    },
                    {
                        category_id: {
                            equals: query.category,
                            mode: 'insensitive'
                        }
                    },
                    {
                        subcategory: {
                            equals: query.category,
                            mode: 'insensitive'
                        }
                    }
                ]
            });
        } else if (query.category_id) {
            and.push({
                OR: [
                    {
                        category_id: {
                            equals: query.category_id,
                            mode: 'insensitive'
                        }
                    },
                    {
                        category: {
                            equals: query.category_id,
                            mode: 'insensitive'
                        }
                    },
                    {
                        subcategory: {
                            equals: query.category_id,
                            mode: 'insensitive'
                        }
                    }
                ]
            });
        }
        if (query.subcategory) {
            and.push({
                subcategory: query.subcategory
            });
        }
        if (query.gender) {
            and.push({
                gender: query.gender
            });
        }
        if (query.brand) {
            and.push({
                OR: [
                    {
                        brand: {
                            equals: query.brand,
                            mode: 'insensitive'
                        }
                    },
                    {
                        brand_id: {
                            equals: query.brand,
                            mode: 'insensitive'
                        }
                    }
                ]
            });
        } else if (query.brand_id) {
            and.push({
                OR: [
                    {
                        brand_id: {
                            equals: query.brand_id,
                            mode: 'insensitive'
                        }
                    },
                    {
                        brand: {
                            equals: query.brand_id,
                            mode: 'insensitive'
                        }
                    }
                ]
            });
        }
        if (query.color) {
            and.push({
                color: {
                    equals: query.color,
                    mode: 'insensitive'
                }
            });
        }
        if (query.avatarCategory) {
            and.push({
                avatar_category: query.avatarCategory
            });
        }
        if (query.is_active !== undefined) {
            and.push({
                is_active: query.is_active
            });
        }
        const minPrice = query.min_price ?? query.minPrice;
        const maxPrice = query.max_price ?? query.maxPrice;
        if (minPrice !== undefined || maxPrice !== undefined) {
            const price = {};
            if (minPrice !== undefined) {
                price.gte = minPrice;
            }
            if (maxPrice !== undefined) {
                price.lte = maxPrice;
            }
            and.push({
                price
            });
        }
        return and.length ? {
            AND: and
        } : {};
    }
    mapImages(images) {
        return images.map((image, index)=>({
                url: image.url,
                sort_order: image.sort_order ?? index,
                is_primary: image.is_primary ?? index === 0
            }));
    }
};
ProductRepository = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_prismaservice.PrismaService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], ProductRepository);

//# sourceMappingURL=product.repository.js.map