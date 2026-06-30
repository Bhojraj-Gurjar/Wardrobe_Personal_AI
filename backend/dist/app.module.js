"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AppModule", {
    enumerable: true,
    get: function() {
        return AppModule;
    }
});
const _common = require("@nestjs/common");
const _configmodule = require("./config/config.module");
const _databasemodule = require("./database/database.module");
const _storagemodule = require("./storage/storage.module");
const _winstonconfig = require("./common/logger/winston.config");
const _appcontroller = require("./app.controller");
const _appservice = require("./app.service");
const _authmodule = require("./modules/auth/auth.module");
const _usersmodule = require("./modules/users/users.module");
const _productsmodule = require("./modules/products/products.module");
const _recommendationsmodule = require("./modules/recommendations/recommendations.module");
const _fashiondnamodule = require("./modules/fashion-dna/fashion-dna.module");
const _wishlistmodule = require("./modules/wishlist/wishlist.module");
const _ordersmodule = require("./modules/orders/orders.module");
const _useractivitymodule = require("./modules/user-activity/user-activity.module");
const _adminmodule = require("./modules/admin/admin.module");
const _facemodule = require("./modules/face/face.module");
const _faceanalysismodule = require("./modules/face-analysis/face-analysis.module");
const _bodyanalysismodule = require("./modules/body-analysis/body-analysis.module");
const _digitalavatarmodule = require("./modules/digital-avatar/digital-avatar.module");
const _userpipelinemodule = require("./modules/user-pipeline/user-pipeline.module");
const _pipelineeventmodule = require("./modules/user-pipeline/pipeline-event.module");
const _userartifactsmodule = require("./modules/user-artifacts/user-artifacts.module");
const _usermediamodule = require("./modules/user-media/user-media.module");
const _cartmodule = require("./modules/cart/cart.module");
const _stylistmodule = require("./modules/stylist/stylist.module");
const _avatarmodule = require("./modules/avatar/avatar.module");
const _tryonmodule = require("./modules/try-on/try-on.module");
const _virtualtryonmodule = require("./modules/virtual-try-on/virtual-try-on.module");
const _personalclosetmodule = require("./modules/personal-closet/personal-closet.module");
const _dashboardmodule = require("./modules/dashboard/dashboard.module");
const _supportmodule = require("./modules/support/support.module");
const _notificationsmodule = require("./modules/notifications/notifications.module");
const _aimodule = require("./modules/ai/ai.module");
const _requestidmiddleware = require("./middleware/request-id.middleware");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(_requestidmiddleware.RequestIdMiddleware).forRoutes('*');
    }
};
AppModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _configmodule.ConfigModule,
            _winstonconfig.LoggerModule,
            _databasemodule.DatabaseModule,
            _storagemodule.StorageModule,
            _authmodule.AuthModule,
            _usersmodule.UsersModule,
            _productsmodule.ProductsModule,
            _recommendationsmodule.RecommendationsModule,
            _fashiondnamodule.FashionDnaModule,
            _wishlistmodule.WishlistModule,
            _cartmodule.CartModule,
            _ordersmodule.OrdersModule,
            _useractivitymodule.UserActivityModule,
            _adminmodule.AdminModule,
            _aimodule.AiModule,
            _stylistmodule.StylistModule,
            _facemodule.FaceModule,
            _faceanalysismodule.FaceAnalysisModule,
            _bodyanalysismodule.BodyAnalysisModule,
            _digitalavatarmodule.DigitalAvatarModule,
            _avatarmodule.AvatarModule,
            _pipelineeventmodule.PipelineEventModule,
            _userpipelinemodule.UserPipelineModule,
            _userartifactsmodule.UserArtifactsModule,
            _usermediamodule.UserMediaModule,
            _tryonmodule.TryOnModule,
            _virtualtryonmodule.VirtualTryOnModule,
            _personalclosetmodule.PersonalClosetModule,
            _dashboardmodule.DashboardModule,
            _supportmodule.SupportModule,
            _notificationsmodule.NotificationsModule
        ],
        controllers: [
            _appcontroller.AppController
        ],
        providers: [
            _appservice.AppService
        ]
    })
], AppModule);

//# sourceMappingURL=app.module.js.map