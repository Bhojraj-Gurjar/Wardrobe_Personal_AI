"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UsersController", {
    enumerable: true,
    get: function() {
        return UsersController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _jwtauthguard = require("../../../guards/jwt-auth.guard");
const _currentuserdecorator = require("../../../common/decorators/current-user.decorator");
const _dtovalidationpipe = require("../../../common/pipes/dto-validation.pipe");
const _usersservice = require("../services/users.service");
const _updateprofiledto = require("../dto/update-profile.dto");
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
const updateProfilePipe = (0, _dtovalidationpipe.DtoValidationPipe)(_updateprofiledto.UpdateProfileDto);
let UsersController = class UsersController {
    constructor(usersService){
        this.usersService = usersService;
    }
    getProfile(user) {
        return this.usersService.getProfile(user.userId);
    }
    updateProfile(user, dto) {
        return this.usersService.updateProfile(user.userId, dto);
    }
};
_ts_decorate([
    (0, _common.Get)('profile'),
    (0, _swagger.ApiOperation)({
        summary: 'Get authenticated user profile'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Profile retrieved successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Unauthorized'
    }),
    (0, _swagger.ApiResponse)({
        status: 404,
        description: 'Profile not found'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], UsersController.prototype, "getProfile", null);
_ts_decorate([
    (0, _common.Put)('profile'),
    (0, _swagger.ApiOperation)({
        summary: 'Update authenticated user profile'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Profile updated successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Unauthorized'
    }),
    (0, _swagger.ApiResponse)({
        status: 404,
        description: 'Profile not found'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Body)(updateProfilePipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], UsersController.prototype, "updateProfile", null);
UsersController = _ts_decorate([
    (0, _swagger.ApiTags)('users'),
    (0, _swagger.ApiBearerAuth)(),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Controller)('users'),
    _ts_param(0, (0, _common.Inject)(_usersservice.UsersService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], UsersController);

//# sourceMappingURL=users.controller.js.map