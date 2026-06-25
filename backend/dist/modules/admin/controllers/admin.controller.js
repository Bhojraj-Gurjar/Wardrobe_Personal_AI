"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AdminController", {
    enumerable: true,
    get: function() {
        return AdminController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _platformexpress = require("@nestjs/platform-express");
const _multer = require("multer");
const _jwtauthguard = require("../../../guards/jwt-auth.guard");
const _adminroleguard = require("../../../guards/admin-role.guard");
const _currentuserdecorator = require("../../../common/decorators/current-user.decorator");
const _dtovalidationpipe = require("../../../common/pipes/dto-validation.pipe");
const _adminservice = require("../services/admin.service");
const _adminlogindto = require("../dto/admin-login.dto");
const _faceuploadutil = require("../../face/utils/face-upload.util");
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
const loginPipe = (0, _dtovalidationpipe.DtoValidationPipe)(_adminlogindto.AdminLoginDto);
const faceUploadInterceptor = (0, _platformexpress.FileInterceptor)(_faceuploadutil.FACE_UPLOAD_FIELD, {
    storage: (0, _multer.memoryStorage)(),
    limits: {
        fileSize: _faceuploadutil.FACE_UPLOAD_MAX_BYTES
    }
});
const adminGuards = [
    _jwtauthguard.JwtAuthGuard,
    _adminroleguard.AdminRoleGuard
];
let AdminController = class AdminController {
    constructor(adminService){
        this.adminService = adminService;
    }
    login(dto) {
        return this.adminService.login(dto);
    }
    async faceLogin(file, body) {
        const dto = await (0, _faceuploadutil.toFaceAuthDto)(file, body);
        return this.adminService.faceLogin(dto);
    }
    async registerFace(user, file, body) {
        const dto = await (0, _faceuploadutil.toFaceAuthDto)(file, body);
        return this.adminService.registerFace(user.userId, dto);
    }
    getDashboard() {
        return this.adminService.getDashboard();
    }
    getAnalytics() {
        return this.adminService.getAnalytics();
    }
    getUsers(query) {
        return this.adminService.getUsers(query);
    }
    getUser(id) {
        return this.adminService.getUser(id);
    }
    updateUser(id, payload) {
        return this.adminService.updateUser(id, payload);
    }
    deactivateUser(id) {
        return this.adminService.deactivateUser(id);
    }
    deleteUser(id) {
        return this.adminService.deleteUser(id);
    }
    getProducts(query) {
        return this.adminService.getProducts(query);
    }
    createProduct(payload) {
        return this.adminService.createProduct(payload);
    }
    updateProduct(id, payload) {
        return this.adminService.updateProduct(id, payload);
    }
    deleteProduct(id) {
        return this.adminService.deleteProduct(id);
    }
    toggleProduct(id) {
        return this.adminService.toggleProductStatus(id);
    }
    getProfile(user) {
        return this.adminService.getProfile(user.userId);
    }
    updateProfile(user, payload) {
        return this.adminService.updateProfile(user.userId, payload);
    }
    changePassword(user, payload) {
        return this.adminService.changePassword(user.userId, payload);
    }
    getOrdersSummary() {
        return this.adminService.getOrdersSummary();
    }
    async exportOrders(query, res) {
        const csv = await this.adminService.exportOrdersCsv(query);
        res.setHeader('Content-Disposition', 'attachment; filename="orders-export.csv"');
        res.send(csv);
    }
    getOrdersByUser(query) {
        return this.adminService.getOrdersByUser(query);
    }
    getOrdersAnalytics() {
        return this.adminService.getOrdersAnalytics();
    }
    getOrders(query) {
        return this.adminService.getOrders(query);
    }
    getOrderById(id) {
        return this.adminService.getOrderById(id);
    }
    updateOrderStatus(id, status) {
        return this.adminService.updateOrderStatus(id, status);
    }
    cancelOrder(id) {
        return this.adminService.cancelOrder(id);
    }
};
_ts_decorate([
    (0, _common.Post)('login'),
    (0, _common.HttpCode)(200),
    (0, _swagger.ApiOperation)({
        summary: 'Admin login with email and password'
    }),
    _ts_param(0, (0, _common.Body)(loginPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "login", null);
_ts_decorate([
    (0, _common.Post)('face-login'),
    (0, _common.HttpCode)(200),
    (0, _swagger.ApiConsumes)('multipart/form-data'),
    (0, _swagger.ApiOperation)({
        summary: 'Admin login with face recognition'
    }),
    (0, _common.UseInterceptors)(faceUploadInterceptor),
    _ts_param(0, (0, _common.UploadedFile)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "faceLogin", null);
_ts_decorate([
    (0, _common.Post)('register-face'),
    (0, _common.HttpCode)(201),
    (0, _common.UseGuards)(...adminGuards),
    (0, _swagger.ApiBearerAuth)(),
    (0, _swagger.ApiConsumes)('multipart/form-data'),
    (0, _swagger.ApiOperation)({
        summary: 'Register admin face for face login'
    }),
    (0, _common.UseInterceptors)(faceUploadInterceptor),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.UploadedFile)()),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "registerFace", null);
_ts_decorate([
    (0, _common.Get)('dashboard'),
    (0, _common.UseGuards)(...adminGuards),
    (0, _swagger.ApiBearerAuth)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getDashboard", null);
_ts_decorate([
    (0, _common.Get)('analytics'),
    (0, _common.UseGuards)(...adminGuards),
    (0, _swagger.ApiBearerAuth)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getAnalytics", null);
_ts_decorate([
    (0, _common.Get)('users'),
    (0, _common.UseGuards)(...adminGuards),
    (0, _swagger.ApiBearerAuth)(),
    _ts_param(0, (0, _common.Query)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getUsers", null);
_ts_decorate([
    (0, _common.Get)('users/:id'),
    (0, _common.UseGuards)(...adminGuards),
    (0, _swagger.ApiBearerAuth)(),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getUser", null);
_ts_decorate([
    (0, _common.Patch)('users/:id'),
    (0, _common.UseGuards)(...adminGuards),
    (0, _swagger.ApiBearerAuth)(),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "updateUser", null);
_ts_decorate([
    (0, _common.Post)('users/:id/deactivate'),
    (0, _common.UseGuards)(...adminGuards),
    (0, _swagger.ApiBearerAuth)(),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "deactivateUser", null);
_ts_decorate([
    (0, _common.Delete)('users/:id'),
    (0, _common.UseGuards)(...adminGuards),
    (0, _swagger.ApiBearerAuth)(),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "deleteUser", null);
_ts_decorate([
    (0, _common.Get)('products'),
    (0, _common.UseGuards)(...adminGuards),
    (0, _swagger.ApiBearerAuth)(),
    _ts_param(0, (0, _common.Query)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getProducts", null);
_ts_decorate([
    (0, _common.Post)('products'),
    (0, _common.HttpCode)(201),
    (0, _common.UseGuards)(...adminGuards),
    (0, _swagger.ApiBearerAuth)(),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "createProduct", null);
_ts_decorate([
    (0, _common.Put)('products/:id'),
    (0, _common.UseGuards)(...adminGuards),
    (0, _swagger.ApiBearerAuth)(),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "updateProduct", null);
_ts_decorate([
    (0, _common.Delete)('products/:id'),
    (0, _common.UseGuards)(...adminGuards),
    (0, _swagger.ApiBearerAuth)(),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "deleteProduct", null);
_ts_decorate([
    (0, _common.Patch)('products/:id/toggle-status'),
    (0, _common.UseGuards)(...adminGuards),
    (0, _swagger.ApiBearerAuth)(),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "toggleProduct", null);
_ts_decorate([
    (0, _common.Get)('profile'),
    (0, _common.UseGuards)(...adminGuards),
    (0, _swagger.ApiBearerAuth)(),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getProfile", null);
_ts_decorate([
    (0, _common.Put)('profile'),
    (0, _common.UseGuards)(...adminGuards),
    (0, _swagger.ApiBearerAuth)(),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "updateProfile", null);
_ts_decorate([
    (0, _common.Post)('change-password'),
    (0, _common.UseGuards)(...adminGuards),
    (0, _swagger.ApiBearerAuth)(),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "changePassword", null);
_ts_decorate([
    (0, _common.Get)('orders/summary'),
    (0, _common.UseGuards)(...adminGuards),
    (0, _swagger.ApiBearerAuth)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getOrdersSummary", null);
_ts_decorate([
    (0, _common.Get)('orders/export'),
    (0, _common.UseGuards)(...adminGuards),
    (0, _swagger.ApiBearerAuth)(),
    (0, _common.Header)('Content-Type', 'text/csv'),
    _ts_param(0, (0, _common.Query)()),
    _ts_param(1, (0, _common.Res)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", Promise)
], AdminController.prototype, "exportOrders", null);
_ts_decorate([
    (0, _common.Get)('orders/users'),
    (0, _common.UseGuards)(...adminGuards),
    (0, _swagger.ApiBearerAuth)(),
    _ts_param(0, (0, _common.Query)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getOrdersByUser", null);
_ts_decorate([
    (0, _common.Get)('orders/analytics'),
    (0, _common.UseGuards)(...adminGuards),
    (0, _swagger.ApiBearerAuth)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getOrdersAnalytics", null);
_ts_decorate([
    (0, _common.Get)('orders'),
    (0, _common.UseGuards)(...adminGuards),
    (0, _swagger.ApiBearerAuth)(),
    _ts_param(0, (0, _common.Query)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getOrders", null);
_ts_decorate([
    (0, _common.Get)('orders/:id'),
    (0, _common.UseGuards)(...adminGuards),
    (0, _swagger.ApiBearerAuth)(),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "getOrderById", null);
_ts_decorate([
    (0, _common.Patch)('orders/:id/status'),
    (0, _common.UseGuards)(...adminGuards),
    (0, _swagger.ApiBearerAuth)(),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)('status')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "updateOrderStatus", null);
_ts_decorate([
    (0, _common.Post)('orders/:id/cancel'),
    (0, _common.UseGuards)(...adminGuards),
    (0, _swagger.ApiBearerAuth)(),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], AdminController.prototype, "cancelOrder", null);
AdminController = _ts_decorate([
    (0, _swagger.ApiTags)('admin'),
    (0, _common.Controller)('admin'),
    _ts_param(0, (0, _common.Inject)(_adminservice.AdminService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], AdminController);

//# sourceMappingURL=admin.controller.js.map