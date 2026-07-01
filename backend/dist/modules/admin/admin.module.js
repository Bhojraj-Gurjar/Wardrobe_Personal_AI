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
const _productsmodule = require("../products/products.module");
const _admincontroller = require("./controllers/admin.controller");
const _adminservice = require("./services/admin.service");
const _adminbootstrapservice = require("./services/admin-bootstrap.service");
const _adminproductcmsservice = require("./services/admin-product-cms.service");
const _adminproductbulkservice = require("./services/admin-product-bulk.service");
const _adminrepository = require("./repositories/admin.repository");
const _adminanalyticsrepository = require("./repositories/admin-analytics.repository");
const _adminproductcmsrepository = require("./repositories/admin-product-cms.repository");
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
            _ordersmodule.OrdersModule,
            _productsmodule.ProductsModule
        ],
        controllers: [
            _admincontroller.AdminController
        ],
        providers: [
            _adminservice.AdminService,
            _adminbootstrapservice.AdminBootstrapService,
            _adminproductcmsservice.AdminProductCmsService,
            _adminproductbulkservice.AdminProductBulkService,
            _adminrepository.AdminRepository,
            _adminanalyticsrepository.AdminAnalyticsRepository,
            _adminproductcmsrepository.AdminProductCmsRepository
        ],
        exports: [
            _adminservice.AdminService,
            _adminproductcmsservice.AdminProductCmsService
        ]
    })
], AdminModule);

//# sourceMappingURL=admin.module.js.map