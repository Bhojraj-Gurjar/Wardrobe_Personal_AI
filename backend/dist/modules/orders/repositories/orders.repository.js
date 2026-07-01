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
const _userrole = require("../../../common/constants/user-role");
const _orderconstants = require("../validators/order.constants");
const _inventoryutil = require("../../commerce/utils/inventory.util");
const _orderstatusutil = require("../utils/order-status.util");
const _orderrevenueutil = require("../utils/order-revenue.util");
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
    },
    documents: {
        orderBy: {
            created_at: 'desc'
        }
    },
    timeline: {
        orderBy: {
            created_at: 'asc'
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
                    invoice_number: {
                        contains: term,
                        mode: 'insensitive'
                    }
                },
                {
                    tracking_number: {
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
                        mobile: {
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
        if (query.payment_method) {
            where.payment_method = query.payment_method;
        }
        if (query.priority) {
            where.priority = query.priority;
        }
        if (query.city) {
            where.shipping_address = {
                path: [
                    'city'
                ],
                string_contains: query.city
            };
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
            include: {
                ...PRODUCT_INCLUDE,
                variants: {
                    select: {
                        id: true,
                        stock: true
                    }
                }
            }
        });
    }
    async reserveStock(tx, productId, quantity) {
        const updated = await tx.product.updateMany({
            where: {
                id: productId,
                is_active: true,
                stock_quantity: {
                    gte: quantity
                }
            },
            data: {
                stock_quantity: {
                    decrement: quantity
                }
            }
        });
        if (updated.count !== 1) {
            return false;
        }
        const product = await tx.product.findUnique({
            where: {
                id: productId
            },
            select: {
                stock_quantity: true
            }
        });
        if (product && product.stock_quantity <= 0) {
            await tx.product.update({
                where: {
                    id: productId
                },
                data: {
                    visibility: 'OUT_OF_STOCK'
                }
            });
        }
        return true;
    }
    async restoreStock(tx, productId, quantity) {
        const product = await tx.product.update({
            where: {
                id: productId
            },
            data: {
                stock_quantity: {
                    increment: quantity
                }
            },
            select: {
                stock_quantity: true,
                visibility: true
            }
        });
        if (product && product.stock_quantity > 0 && product.visibility === 'OUT_OF_STOCK') {
            await tx.product.update({
                where: {
                    id: productId
                },
                data: {
                    visibility: 'IN_STOCK'
                }
            });
        }
    }
    getLineItemsFromOrder(order) {
        const metadataItems = Array.isArray(order?.metadata?.items) ? order.metadata.items : [];
        if (metadataItems.length) {
            return metadataItems.map((item)=>({
                    product_id: item.product_id,
                    quantity: Number(item.quantity ?? 1)
                }));
        }
        if (order?.product_id) {
            return [
                {
                    product_id: order.product_id,
                    quantity: 1
                }
            ];
        }
        return [];
    }
    async cancelWithStockRestore(orderId, fromStatus = null) {
        return this.prisma.$transaction(async (tx)=>{
            const order = await tx.order.findUnique({
                where: {
                    id: orderId
                }
            });
            if (!order) {
                return null;
            }
            if (fromStatus && order.status !== fromStatus) {
                return null;
            }
            const lineItems = this.getLineItemsFromOrder(order);
            const requestedByProduct = (0, _inventoryutil.aggregateRequestedQuantities)(lineItems);
            for (const [productId, quantity] of requestedByProduct.entries()){
                await this.restoreStock(tx, productId, quantity);
            }
            return tx.order.update({
                where: {
                    id: orderId
                },
                data: {
                    status: _orderconstants.ORDER_STATUS.CANCELLED
                },
                include: ORDER_INCLUDE
            });
        });
    }
    checkoutWithCartClear(userId, dto, items) {
        return this.prisma.$transaction(async (tx)=>{
            const cartItems = await tx.cartItem.findMany({
                where: {
                    user_id: userId
                },
                select: {
                    id: true
                }
            });
            if (!cartItems.length) {
                throw new Error('CART_EMPTY');
            }
            const order = await this.createWithInventoryReservation(userId, dto, items, tx);
            await tx.cartItem.deleteMany({
                where: {
                    user_id: userId
                }
            });
            return order;
        }, {
            isolationLevel: 'Serializable'
        });
    }
    buildOrderCreateData(userId, dto) {
        const data = {
            user_id: userId,
            total_amount: dto.total_amount,
            status: _orderconstants.ORDER_STATUS.CREATED
        };
        if (dto.product_id) data.product_id = dto.product_id;
        if (dto.order_number) data.order_number = dto.order_number;
        if (dto.invoice_number) data.invoice_number = dto.invoice_number;
        if (dto.subtotal !== undefined) data.subtotal = dto.subtotal;
        if (dto.shipping !== undefined) data.shipping = dto.shipping;
        if (dto.discount !== undefined) data.discount = dto.discount;
        if (dto.tax !== undefined) data.tax = dto.tax;
        if (dto.coupon_code) data.coupon_code = dto.coupon_code;
        if (dto.payment_method) data.payment_method = dto.payment_method;
        if (dto.payment_status) data.payment_status = dto.payment_status;
        if (dto.shipping_address) data.shipping_address = dto.shipping_address;
        if (dto.billing_address) data.billing_address = dto.billing_address;
        if (dto.estimated_delivery) data.estimated_delivery = dto.estimated_delivery;
        if (dto.priority) data.priority = dto.priority;
        if (dto.metadata) data.metadata = dto.metadata;
        if (dto.oms_metadata) data.oms_metadata = dto.oms_metadata;
        return data;
    }
    create(userId, dto) {
        return this.prisma.order.create({
            data: this.buildOrderCreateData(userId, dto),
            include: ORDER_INCLUDE
        });
    }
    createWithInventoryReservation(userId, dto, items, client = null) {
        const requestedByProduct = (0, _inventoryutil.aggregateRequestedQuantities)(items);
        const run = async (tx)=>{
            for (const [productId, quantity] of requestedByProduct.entries()){
                const reserved = await this.reserveStock(tx, productId, quantity);
                if (!reserved) {
                    throw new _inventoryutil.StockExceededError();
                }
            }
            return tx.order.create({
                data: this.buildOrderCreateData(userId, dto),
                include: ORDER_INCLUDE
            });
        };
        if (client) {
            return run(client);
        }
        return this.prisma.$transaction(run);
    }
    updateOrder(id, data) {
        return this.prisma.order.update({
            where: {
                id
            },
            data,
            include: ORDER_INCLUDE
        });
    }
    updateStatus(id, status, extra = {}, expectedFromStatus = null) {
        const where = expectedFromStatus ? {
            id,
            status: expectedFromStatus
        } : {
            id
        };
        return this.prisma.order.updateMany({
            where,
            data: {
                status,
                ...extra
            }
        }).then(async (result)=>{
            if (expectedFromStatus && result.count !== 1) {
                return null;
            }
            return this.prisma.order.findUnique({
                where: {
                    id
                },
                include: ORDER_INCLUDE
            });
        });
    }
    createTimelineEntry(data) {
        return this.prisma.orderTimeline.create({
            data
        });
    }
    createDocument(data) {
        return this.prisma.orderDocument.create({
            data
        });
    }
    findDocuments(orderId) {
        return this.prisma.orderDocument.findMany({
            where: {
                order_id: orderId
            },
            orderBy: {
                created_at: 'desc'
            }
        });
    }
    createNotification(data) {
        return this.prisma.orderNotification.create({
            data
        });
    }
    findUserNotifications(userId, { limit = 20, unreadOnly = false } = {}) {
        return this.prisma.orderNotification.findMany({
            where: {
                user_id: userId,
                ...unreadOnly ? {
                    is_read: false
                } : {}
            },
            include: {
                order: {
                    select: {
                        id: true,
                        order_number: true,
                        status: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            },
            take: limit
        });
    }
    markNotificationsRead(userId, ids = null) {
        return this.prisma.orderNotification.updateMany({
            where: {
                user_id: userId,
                ...ids?.length ? {
                    id: {
                        in: ids
                    }
                } : {}
            },
            data: {
                is_read: true
            }
        });
    }
    findAddressesByUserId(userId) {
        return this.prisma.userAddress.findMany({
            where: {
                user_id: userId
            },
            orderBy: [
                {
                    is_default: 'desc'
                },
                {
                    updated_at: 'desc'
                }
            ]
        });
    }
    findAddressByIdAndUserId(id, userId) {
        return this.prisma.userAddress.findFirst({
            where: {
                id,
                user_id: userId
            }
        });
    }
    createAddress(userId, data) {
        return this.prisma.$transaction(async (tx)=>{
            if (data.is_default) {
                await tx.userAddress.updateMany({
                    where: {
                        user_id: userId
                    },
                    data: {
                        is_default: false
                    }
                });
            }
            return tx.userAddress.create({
                data: {
                    user_id: userId,
                    ...data
                }
            });
        });
    }
    updateAddress(id, userId, data) {
        return this.prisma.$transaction(async (tx)=>{
            if (data.is_default) {
                await tx.userAddress.updateMany({
                    where: {
                        user_id: userId
                    },
                    data: {
                        is_default: false
                    }
                });
            }
            return tx.userAddress.update({
                where: {
                    id
                },
                data
            });
        });
    }
    deleteAddress(id, userId) {
        return this.prisma.userAddress.deleteMany({
            where: {
                id,
                user_id: userId
            }
        });
    }
    /** Auto-complete in-transit orders that have passed the delivery window. */ async syncAutoStatuses() {
        return 0;
    }
    findOrdersByStatus(status) {
        return this.prisma.order.findMany({
            where: {
                status
            },
            include: ORDER_INCLUDE
        });
    }
    findShippedOrdersReadyForCompletion(cutoff) {
        return this.prisma.order.findMany({
            where: {
                status: _orderconstants.ORDER_STATUS.SHIPPED,
                OR: [
                    {
                        dispatched_at: {
                            lte: cutoff
                        }
                    },
                    {
                        dispatched_at: null,
                        updated_at: {
                            lte: cutoff
                        }
                    }
                ]
            },
            include: ORDER_INCLUDE
        });
    }
    async migrateDeliveredOrdersToCompleted() {
        const legacyOrders = await this.prisma.order.findMany({
            where: {
                status: 'DELIVERED'
            },
            select: {
                id: true,
                delivered_at: true,
                completed_at: true
            }
        });
        if (!legacyOrders.length) {
            return 0;
        }
        await Promise.all(legacyOrders.map((order)=>{
            const deliveredAt = order.delivered_at || new Date();
            const completedAt = order.completed_at || deliveredAt;
            return this.prisma.order.update({
                where: {
                    id: order.id
                },
                data: {
                    status: 'COMPLETED',
                    delivered_at: deliveredAt,
                    completed_at: completedAt
                }
            });
        }));
        return legacyOrders.length;
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
    countTodayOrders() {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        return this.prisma.order.count({
            where: {
                created_at: {
                    gte: start
                }
            }
        });
    }
    countWeeklyOrders() {
        const start = new Date();
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        return this.prisma.order.count({
            where: {
                created_at: {
                    gte: start
                }
            }
        });
    }
    aggregateTodayRevenue() {
        return this.prisma.order.aggregate({
            _sum: {
                total_amount: true
            },
            where: (0, _orderrevenueutil.buildTodayCompletedRevenueWhere)()
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
                    notIn: [
                        _orderconstants.ORDER_STATUS.CANCELLED,
                        _orderconstants.ORDER_STATUS.REFUNDED
                    ]
                }
            }
        });
    }
    getOmsAnalytics() {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        return this.prisma.$transaction([
            this.countByStatus(),
            this.countTodayOrders(),
            this.countWeeklyOrders(),
            this.aggregateTodayRevenue(),
            this.aggregateRevenue(),
            this.prisma.order.aggregate({
                _avg: {
                    total_amount: true
                },
                where: {
                    status: {
                        not: _orderconstants.ORDER_STATUS.CANCELLED
                    }
                }
            })
        ]);
    }
    findAdminUsers() {
        return this.prisma.user.findMany({
            where: {
                role: _userrole.USER_ROLE.ADMIN,
                status: 'ACTIVE'
            },
            select: {
                id: true,
                email: true,
                profile: {
                    select: {
                        name: true
                    }
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