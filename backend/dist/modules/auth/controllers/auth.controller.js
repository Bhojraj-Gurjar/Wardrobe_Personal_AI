"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuthController", {
    enumerable: true,
    get: function() {
        return AuthController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _dtovalidationpipe = require("../../../common/pipes/dto-validation.pipe");
const _authservice = require("../services/auth.service");
const _registerdto = require("../dto/register.dto");
const _logindto = require("../dto/login.dto");
const _refreshtokendto = require("../dto/refresh-token.dto");
const _logoutdto = require("../dto/logout.dto");
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
const registerPipe = (0, _dtovalidationpipe.DtoValidationPipe)(_registerdto.RegisterDto);
const loginPipe = (0, _dtovalidationpipe.DtoValidationPipe)(_logindto.LoginDto);
const refreshPipe = (0, _dtovalidationpipe.DtoValidationPipe)(_refreshtokendto.RefreshTokenDto);
const logoutPipe = (0, _dtovalidationpipe.DtoValidationPipe)(_logoutdto.LogoutDto);
let AuthController = class AuthController {
    constructor(authService){
        this.authService = authService;
    }
    register(dto) {
        return this.authService.register(dto);
    }
    login(dto) {
        return this.authService.login(dto);
    }
    refresh(dto) {
        return this.authService.refresh(dto);
    }
    logout(dto) {
        return this.authService.logout(dto);
    }
};
_ts_decorate([
    (0, _common.Post)('register'),
    (0, _common.HttpCode)(201),
    (0, _swagger.ApiOperation)({
        summary: 'Register a new user'
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: 'User registered successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 409,
        description: 'Email or mobile already exists'
    }),
    _ts_param(0, (0, _common.Body)(registerPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], AuthController.prototype, "register", null);
_ts_decorate([
    (0, _common.Post)('login'),
    (0, _common.HttpCode)(200),
    (0, _swagger.ApiOperation)({
        summary: 'Login with email or mobile'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Login successful'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Invalid credentials'
    }),
    _ts_param(0, (0, _common.Body)(loginPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
_ts_decorate([
    (0, _common.Post)('refresh'),
    (0, _common.HttpCode)(200),
    (0, _swagger.ApiOperation)({
        summary: 'Refresh access token'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Tokens refreshed successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Invalid refresh token'
    }),
    _ts_param(0, (0, _common.Body)(refreshPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], AuthController.prototype, "refresh", null);
_ts_decorate([
    (0, _common.Post)('logout'),
    (0, _common.HttpCode)(200),
    (0, _swagger.ApiOperation)({
        summary: 'Logout and invalidate refresh token'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Logout successful'
    }),
    _ts_param(0, (0, _common.Body)(logoutPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
AuthController = _ts_decorate([
    (0, _swagger.ApiTags)('auth'),
    (0, _common.Controller)('auth'),
    _ts_param(0, (0, _common.Inject)(_authservice.AuthService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], AuthController);

//# sourceMappingURL=auth.controller.js.map