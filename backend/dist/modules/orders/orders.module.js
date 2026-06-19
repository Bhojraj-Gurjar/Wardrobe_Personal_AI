"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "OrdersModule", {
    enumerable: true,
    get: function() {
        return OrdersModule;
    }
});
const _common = require("@nestjs/common");
const _authmodule = require("../auth/auth.module");
const _orderscontroller = require("./controllers/orders.controller");
const _ordersservice = require("./services/orders.service");
const _ordersrepository = require("./repositories/orders.repository");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let OrdersModule = class OrdersModule {
};
OrdersModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _authmodule.AuthModule
        ],
        controllers: [
            _orderscontroller.OrdersController
        ],
        providers: [
            _ordersservice.OrdersService,
            _ordersrepository.OrdersRepository
        ],
        exports: [
            _ordersservice.OrdersService
        ]
    })
], OrdersModule);

//# sourceMappingURL=orders.module.js.map