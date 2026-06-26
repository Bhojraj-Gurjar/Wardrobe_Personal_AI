"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AdminModule", {
    enumerable: true,
    get: function() {
        return AdminModule;
    }
});
const _common = require("@nestjs/common");
const _authmodule = require("../auth/auth.module");
const _facemodule = require("../face/face.module");
const _ordersmodule = require("../orders/orders.module");
const _admincontroller = require("./controllers/admin.controller");
const _adminservice = require("./services/admin.service");
const _adminbootstrapservice = require("./services/admin-bootstrap.service");
const _adminrepository = require("./repositories/admin.repository");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let AdminModule = class AdminModule {
};
AdminModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _authmodule.AuthModule,
            _facemodule.FaceModule,
            _ordersmodule.OrdersModule
        ],
        controllers: [
            _admincontroller.AdminController
        ],
        providers: [
            _adminservice.AdminService,
            _adminbootstrapservice.AdminBootstrapService,
            _adminrepository.AdminRepository
        ],
        exports: [
            _adminservice.AdminService
        ]
    })
], AdminModule);

//# sourceMappingURL=admin.module.js.map