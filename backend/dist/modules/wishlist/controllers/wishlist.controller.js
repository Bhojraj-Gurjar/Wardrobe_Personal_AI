"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "WishlistController", {
    enumerable: true,
    get: function() {
        return WishlistController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _jwtauthguard = require("../../../guards/jwt-auth.guard");
const _currentuserdecorator = require("../../../common/decorators/current-user.decorator");
const _dtovalidationpipe = require("../../../common/pipes/dto-validation.pipe");
const _wishlistservice = require("../services/wishlist.service");
const _addtowishlistdto = require("../dto/add-to-wishlist.dto");
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
const addToWishlistPipe = (0, _dtovalidationpipe.DtoValidationPipe)(_addtowishlistdto.AddToWishlistDto);
let WishlistController = class WishlistController {
    constructor(wishlistService){
        this.wishlistService = wishlistService;
    }
    getWishlist(user) {
        return this.wishlistService.getWishlist(user.userId);
    }
    addToWishlist(user, dto) {
        return this.wishlistService.addToWishlist(user.userId, dto);
    }
    removeFromWishlist(user, id) {
        return this.wishlistService.removeFromWishlist(user.userId, id);
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: 'Get authenticated user wishlist'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Wishlist retrieved successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Unauthorized'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], WishlistController.prototype, "getWishlist", null);
_ts_decorate([
    (0, _common.Post)(),
    (0, _common.HttpCode)(201),
    (0, _swagger.ApiOperation)({
        summary: 'Add product to wishlist'
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: 'Product added to wishlist'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Unauthorized'
    }),
    (0, _swagger.ApiResponse)({
        status: 404,
        description: 'Product not found'
    }),
    (0, _swagger.ApiResponse)({
        status: 409,
        description: 'Product already in wishlist'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Body)(addToWishlistPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], WishlistController.prototype, "addToWishlist", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    (0, _swagger.ApiOperation)({
        summary: 'Remove item from wishlist'
    }),
    (0, _swagger.ApiParam)({
        name: 'id',
        description: 'Wishlist item UUID'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Item removed from wishlist'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Unauthorized'
    }),
    (0, _swagger.ApiResponse)({
        status: 404,
        description: 'Wishlist item not found'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], WishlistController.prototype, "removeFromWishlist", null);
WishlistController = _ts_decorate([
    (0, _swagger.ApiTags)('wishlist'),
    (0, _swagger.ApiBearerAuth)(),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Controller)('wishlist'),
    _ts_param(0, (0, _common.Inject)(_wishlistservice.WishlistService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], WishlistController);

//# sourceMappingURL=wishlist.controller.js.map