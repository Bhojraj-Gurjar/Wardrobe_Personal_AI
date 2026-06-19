"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "OrdersService", {
    enumerable: true,
    get: function() {
        return OrdersService;
    }
});
const _common = require("@nestjs/common");
const _ordersrepository = require("../repositories/orders.repository");
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
let OrdersService = class OrdersService {
    constructor(ordersRepository){
        this.ordersRepository = ordersRepository;
    }
    async create(userId, dto) {
        const order = await this.ordersRepository.create(userId, dto.total_amount);
        return this.formatOrder(order);
    }
    async findAll(userId, query) {
        const [orders, total] = await this.ordersRepository.findManyByUserId(userId, query);
        return {
            items: orders.map((order)=>this.formatOrder(order)),
            meta: {
                total,
                page: query.page,
                limit: query.limit,
                totalPages: Math.ceil(total / query.limit) || 1
            }
        };
    }
    async findOne(userId, id) {
        const order = await this.ordersRepository.findByIdAndUserId(id, userId);
        if (!order) {
            throw new _common.NotFoundException('Order not found');
        }
        return this.formatOrder(order);
    }
    formatOrder(order) {
        return {
            id: order.id,
            user_id: order.user_id,
            total_amount: order.total_amount,
            status: order.status,
            created_at: order.created_at,
            updated_at: order.updated_at
        };
    }
};
OrdersService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_ordersrepository.OrdersRepository)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], OrdersService);

//# sourceMappingURL=orders.service.js.map