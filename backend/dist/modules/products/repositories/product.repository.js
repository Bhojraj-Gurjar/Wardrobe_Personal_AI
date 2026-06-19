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
        const where = this.buildWhereClause(query);
        const orderBy = {
            [query.sortBy]: query.sortOrder
        };
        const skip = (query.page - 1) * query.limit;
        return this.prisma.$transaction([
            this.prisma.product.findMany({
                where,
                orderBy,
                skip,
                take: query.limit,
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
            }
        });
    }
    create(data, images = []) {
        return this.prisma.product.create({
            data: {
                ...data,
                images: {
                    create: this.mapImages(images)
                }
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
        const where = {};
        if (query.search) {
            where.OR = [
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
                }
            ];
        }
        if (query.category_id) {
            where.category_id = query.category_id;
        }
        if (query.brand_id) {
            where.brand_id = query.brand_id;
        }
        if (query.min_price !== undefined || query.max_price !== undefined) {
            where.price = {};
            if (query.min_price !== undefined) {
                where.price.gte = query.min_price;
            }
            if (query.max_price !== undefined) {
                where.price.lte = query.max_price;
            }
        }
        return where;
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