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
let OrdersRepository = class OrdersRepository {
    constructor(prismaService){
        this.prisma = prismaService;
    }
    findManyByUserId(userId, query) {
        const where = {
            user_id: userId
        };
        if (query.status) {
            where.status = query.status;
        }
        const skip = (query.page - 1) * query.limit;
        return this.prisma.$transaction([
            this.prisma.order.findMany({
                where,
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
            }
        });
    }
    create(userId, totalAmount) {
        return this.prisma.order.create({
            data: {
                user_id: userId,
                total_amount: totalAmount,
                status: _orderconstants.ORDER_STATUS.CREATED
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