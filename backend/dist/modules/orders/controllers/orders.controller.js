"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "OrdersController", {
    enumerable: true,
    get: function() {
        return OrdersController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _jwtauthguard = require("../../../guards/jwt-auth.guard");
const _currentuserdecorator = require("../../../common/decorators/current-user.decorator");
const _dtovalidationpipe = require("../../../common/pipes/dto-validation.pipe");
const _ordersservice = require("../services/orders.service");
const _createorderdto = require("../dto/create-order.dto");
const _queryordersdto = require("../dto/query-orders.dto");
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
const createOrderPipe = (0, _dtovalidationpipe.DtoValidationPipe)(_createorderdto.CreateOrderDto);
const queryOrdersPipe = (0, _dtovalidationpipe.DtoValidationPipe)(_queryordersdto.QueryOrdersDto);
let OrdersController = class OrdersController {
    constructor(ordersService){
        this.ordersService = ordersService;
    }
    create(user, dto) {
        return this.ordersService.create(user.userId, dto);
    }
    findAll(user, query) {
        return this.ordersService.findAll(user.userId, query);
    }
    findOne(user, id) {
        return this.ordersService.findOne(user.userId, id);
    }
    cancel(user, id) {
        return this.ordersService.cancel(user.userId, id);
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _common.HttpCode)(201),
    (0, _swagger.ApiOperation)({
        summary: 'Create a new order'
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: 'Order created successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Unauthorized'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Body)(createOrderPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], OrdersController.prototype, "create", null);
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: 'List authenticated user orders'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Orders retrieved successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Unauthorized'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Query)(queryOrdersPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], OrdersController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    (0, _swagger.ApiOperation)({
        summary: 'Get order by id'
    }),
    (0, _swagger.ApiParam)({
        name: 'id',
        description: 'Order UUID'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Order retrieved successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Unauthorized'
    }),
    (0, _swagger.ApiResponse)({
        status: 404,
        description: 'Order not found'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], OrdersController.prototype, "findOne", null);
_ts_decorate([
    (0, _common.Post)(':id/cancel'),
    (0, _common.HttpCode)(200),
    (0, _swagger.ApiOperation)({
        summary: 'Cancel an order'
    }),
    (0, _swagger.ApiParam)({
        name: 'id',
        description: 'Order UUID'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Order cancelled successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 400,
        description: 'Order cannot be cancelled'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], OrdersController.prototype, "cancel", null);
OrdersController = _ts_decorate([
    (0, _swagger.ApiTags)('orders'),
    (0, _swagger.ApiBearerAuth)(),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Controller)('orders'),
    _ts_param(0, (0, _common.Inject)(_ordersservice.OrdersService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], OrdersController);

//# sourceMappingURL=orders.controller.js.map