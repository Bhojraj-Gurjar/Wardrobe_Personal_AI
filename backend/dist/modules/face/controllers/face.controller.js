"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "FaceController", {
    enumerable: true,
    get: function() {
        return FaceController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _platformexpress = require("@nestjs/platform-express");
const _multer = require("multer");
const _jwtauthguard = require("../../../guards/jwt-auth.guard");
const _currentuserdecorator = require("../../../common/decorators/current-user.decorator");
const _faceservice = require("../services/face.service");
const _faceuploadutil = require("../utils/face-upload.util");
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
const faceUploadInterceptor = (0, _platformexpress.FileInterceptor)(_faceuploadutil.FACE_UPLOAD_FIELD, {
    storage: (0, _multer.memoryStorage)(),
    limits: {
        fileSize: _faceuploadutil.FACE_UPLOAD_MAX_BYTES
    }
});
let FaceController = class FaceController {
    constructor(faceService){
        this.faceService = faceService;
        this.logger = new _common.Logger(FaceController.name);
    }
    async register(user, file, body) {
        const dto = await (0, _faceuploadutil.toFaceAuthDto)(file, body);
        return this.faceService.register(user.userId, dto);
    }
    async updatePhoto(user, file, body) {
        const dto = await (0, _faceuploadutil.toFaceAuthDto)(file, body);
        return this.faceService.updatePhoto(user.userId, dto);
    }
    async login(file, body) {
        const dto = await (0, _faceuploadutil.toFaceAuthDto)(file, body);
        return this.faceService.login(dto);
    }
    async verify(user, file, body) {
        const dto = await (0, _faceuploadutil.toFaceAuthDto)(file, body);
        return this.faceService.verify(user.userId, dto);
    }
};
_ts_decorate([
    (0, _common.Post)('register'),
    (0, _common.HttpCode)(201),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _swagger.ApiBearerAuth)(),
    (0, _swagger.ApiConsumes)('multipart/form-data'),
    (0, _swagger.ApiOperation)({
        summary: 'Register face for authenticated user'
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
], FaceController.prototype, "register", null);
_ts_decorate([
    (0, _common.Put)('photo'),
    (0, _common.HttpCode)(200),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _swagger.ApiBearerAuth)(),
    (0, _swagger.ApiConsumes)('multipart/form-data'),
    (0, _swagger.ApiOperation)({
        summary: 'Replace registered face photo and regenerate embedding'
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
], FaceController.prototype, "updatePhoto", null);
_ts_decorate([
    (0, _common.Post)('login'),
    (0, _common.HttpCode)(200),
    (0, _swagger.ApiConsumes)('multipart/form-data'),
    (0, _swagger.ApiOperation)({
        summary: 'Login using face'
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
], FaceController.prototype, "login", null);
_ts_decorate([
    (0, _common.Post)('verify'),
    (0, _common.HttpCode)(200),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _swagger.ApiBearerAuth)(),
    (0, _swagger.ApiConsumes)('multipart/form-data'),
    (0, _swagger.ApiOperation)({
        summary: 'Verify face matches authenticated user'
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
], FaceController.prototype, "verify", null);
FaceController = _ts_decorate([
    (0, _swagger.ApiTags)('face'),
    (0, _common.Controller)('face'),
    _ts_param(0, (0, _common.Inject)(_faceservice.FaceService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], FaceController);

//# sourceMappingURL=face.controller.js.map