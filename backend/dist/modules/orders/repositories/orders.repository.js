"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "OrdersRepository", {
    enumerable: true,
    get: function() {
        return OrdersRepository;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../../../database/prisma.service");
const _orderconstants = require("../validators/order.constants");
const _orderstatusutil = require("../utils/order-status.util");
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
const ORDER_INCLUDE = {
    product: {
        include: PRODUCT_INCLUDE
    },
    user: {
        include: {
            profile: true
        }
    }
};
let OrdersRepository = class OrdersRepository {
    constructor(prismaService){
        this.prisma = prismaService;
    }
    findManyByUserId(userId, query) {
        const where = {
            user_id: userId
        };
        const statusValues = (0, _orderstatusutil.resolveStatusFilterValues)(query.status);
        if (statusValues) {
            where.status = {
                in: statusValues
            };
        }
        const skip = (query.page - 1) * query.limit;
        return this.prisma.$transaction([
            this.prisma.order.findMany({
                where,
                include: ORDER_INCLUDE,
                orderBy: {
                    created_at: 'desc'
                },
                skip,
                take: query.limit
            }),
            this.prisma.order.count({
                where
            })
        ]);
    }
    findByIdAndUserId(id, userId) {
        return this.prisma.order.findFirst({
            where: {
                id,
                user_id: userId
            },
            include: ORDER_INCLUDE
        });
    }
    findById(id) {
        return this.prisma.order.findUnique({
            where: {
                id
            },
            include: ORDER_INCLUDE
        });
    }
    findManyAdmin(query) {
        const where = {};
        const statusValues = (0, _orderstatusutil.resolveStatusFilterValues)(query.status);
        if (statusValues) {
            where.status = {
                in: statusValues
            };
        }
        if (query.search) {
            const term = query.search.trim();
            where.OR = [
                {
                    order_number: {
                        contains: term,
                        mode: 'insensitive'
                    }
                },
                {
                    user: {
                        email: {
                            contains: term,
                            mode: 'insensitive'
                        }
                    }
                },
                {
                    user: {
                        profile: {
                            name: {
                                contains: term,
                                mode: 'insensitive'
                            }
                        }
                    }
                }
            ];
        }
        const skip = ((query.page || 1) - 1) * (query.limit || 50);
        return this.prisma.$transaction([
            this.prisma.order.findMany({
                where,
                include: ORDER_INCLUDE,
                orderBy: {
                    created_at: 'desc'
                },
                skip,
                take: query.limit || 50
            }),
            this.prisma.order.count({
                where
            })
        ]);
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
    findProductsByIds(ids) {
        return this.prisma.product.findMany({
            where: {
                id: {
                    in: ids
                }
            },
            include: PRODUCT_INCLUDE
        });
    }
    create(userId, dto) {
        const data = {
            user_id: userId,
            total_amount: dto.total_amount,
            status: _orderconstants.ORDER_STATUS.CREATED
        };
        if (dto.product_id) {
            data.product_id = dto.product_id;
        }
        if (dto.order_number) {
            data.order_number = dto.order_number;
        }
        if (dto.subtotal !== undefined) {
            data.subtotal = dto.subtotal;
        }
        if (dto.shipping !== undefined) {
            data.shipping = dto.shipping;
        }
        if (dto.discount !== undefined) {
            data.discount = dto.discount;
        }
        if (dto.coupon_code) {
            data.coupon_code = dto.coupon_code;
        }
        if (dto.metadata) {
            data.metadata = dto.metadata;
        }
        return this.prisma.order.create({
            data,
            include: ORDER_INCLUDE
        });
    }
    updateStatus(id, status) {
        return this.prisma.order.update({
            where: {
                id
            },
            data: {
                status
            },
            include: ORDER_INCLUDE
        });
    }
    async syncAutoStatuses() {
        const orders = await this.prisma.order.findMany({
            where: {
                status: {
                    notIn: _orderstatusutil.TERMINAL_ORDER_STATUSES
                }
            },
            select: {
                id: true,
                status: true,
                created_at: true
            }
        });
        const now = Date.now();
        const updates = [];
        for (const order of orders){
            const nextStatus = (0, _orderstatusutil.resolveAutoStatus)(order.created_at, order.status, now);
            if (nextStatus && nextStatus !== order.status) {
                updates.push(this.prisma.order.update({
                    where: {
                        id: order.id
                    },
                    data: {
                        status: nextStatus
                    }
                }));
            }
        }
        if (!updates.length) {
            return 0;
        }
        await this.prisma.$transaction(updates);
        return updates.length;
    }
    countByStatus() {
        return this.prisma.order.groupBy({
            by: [
                'status'
            ],
            _count: {
                status: true
            }
        });
    }
    aggregateRevenue() {
        return this.prisma.order.aggregate({
            _sum: {
                total_amount: true
            },
            _count: {
                id: true
            },
            where: {
                status: {
                    not: _orderconstants.ORDER_STATUS.CANCELLED
                }
            }
        });
    }
};
OrdersRepository = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_prismaservice.PrismaService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], OrdersRepository);

//# sourceMappingURL=orders.repository.js.map