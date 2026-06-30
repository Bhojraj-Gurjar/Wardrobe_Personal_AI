"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UserActivityController", {
    enumerable: true,
    get: function() {
        return UserActivityController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _jwtauthguard = require("../../../guards/jwt-auth.guard");
const _currentuserdecorator = require("../../../common/decorators/current-user.decorator");
const _dtovalidationpipe = require("../../../common/pipes/dto-validation.pipe");
const _recordproductviewdto = require("../dto/record-product-view.dto");
const _recordsearchdto = require("../dto/record-search.dto");
const _useractivityservice = require("../services/user-activity.service");
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
const recordProductViewPipe = (0, _dtovalidationpipe.DtoValidationPipe)(_recordproductviewdto.RecordProductViewDto);
const recordSearchPipe = (0, _dtovalidationpipe.DtoValidationPipe)(_recordsearchdto.RecordSearchDto);
let UserActivityController = class UserActivityController {
    constructor(userActivityService){
        this.userActivityService = userActivityService;
    }
    recordProductView(user, dto) {
        return this.userActivityService.recordProductView(user.userId, dto.product_id);
    }
    recordSearch(user, dto) {
        return this.userActivityService.recordSearch(user.userId, dto.query);
    }
    getRecentSearches(user) {
        return this.userActivityService.getRecentSearches(user.userId);
    }
    clearSearchHistory(user) {
        return this.userActivityService.clearSearchHistory(user.userId);
    }
};
_ts_decorate([
    (0, _common.Post)('product-views'),
    (0, _common.HttpCode)(201),
    (0, _swagger.ApiOperation)({
        summary: 'Record a product view for Fashion DNA learning'
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: 'Product view recorded'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Body)(recordProductViewPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], UserActivityController.prototype, "recordProductView", null);
_ts_decorate([
    (0, _common.Post)('searches'),
    (0, _common.HttpCode)(201),
    (0, _swagger.ApiOperation)({
        summary: 'Record a product search for Fashion DNA learning'
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: 'Search recorded'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Body)(recordSearchPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], UserActivityController.prototype, "recordSearch", null);
_ts_decorate([
    (0, _common.Get)('searches'),
    (0, _swagger.ApiOperation)({
        summary: 'Get recent search history'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], UserActivityController.prototype, "getRecentSearches", null);
_ts_decorate([
    (0, _common.Delete)('searches'),
    (0, _common.HttpCode)(200),
    (0, _swagger.ApiOperation)({
        summary: 'Clear search history'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], UserActivityController.prototype, "clearSearchHistory", null);
UserActivityController = _ts_decorate([
    (0, _swagger.ApiTags)('user-activity'),
    (0, _swagger.ApiBearerAuth)(),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Controller)('user-activity'),
    _ts_param(0, (0, _common.Inject)(_useractivityservice.UserActivityService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], UserActivityController);

//# sourceMappingURL=user-activity.controller.js.map