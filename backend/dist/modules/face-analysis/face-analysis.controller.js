"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "FaceAnalysisController", {
    enumerable: true,
    get: function() {
        return FaceAnalysisController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _platformexpress = require("@nestjs/platform-express");
const _multer = require("multer");
const _jwtauthguard = require("../../guards/jwt-auth.guard");
const _currentuserdecorator = require("../../common/decorators/current-user.decorator");
const _faceuploadutil = require("../face/utils/face-upload.util");
const _updatefaceanalysisdto = require("./dto/update-face-analysis.dto");
const _faceanalysisservice = require("./face-analysis.service");
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
let FaceAnalysisController = class FaceAnalysisController {
    constructor(faceAnalysisService){
        this.faceAnalysisService = faceAnalysisService;
    }
    getMyFaceAnalysis(user) {
        return this.faceAnalysisService.getMyFaceAnalysis(user.userId);
    }
    async analyzeFace(user, file, body) {
        const dto = await (0, _faceuploadutil.toFaceAuthDto)(file, body);
        return this.faceAnalysisService.analyzeFace(user.userId, dto);
    }
    analyzeStoredFace(user) {
        return this.faceAnalysisService.analyzeStoredFace(user.userId);
    }
    updateFaceAnalysis(user, dto) {
        return this.faceAnalysisService.updateFaceAnalysis(user.userId, dto);
    }
};
_ts_decorate([
    (0, _common.Get)('me'),
    (0, _swagger.ApiOperation)({
        summary: 'Get authenticated user face analysis profile'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Face analysis retrieved successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Unauthorized'
    }),
    (0, _swagger.ApiResponse)({
        status: 404,
        description: 'Face analysis not found'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], FaceAnalysisController.prototype, "getMyFaceAnalysis", null);
_ts_decorate([
    (0, _common.Post)('analyze'),
    (0, _common.HttpCode)(200),
    (0, _swagger.ApiConsumes)('multipart/form-data'),
    (0, _swagger.ApiOperation)({
        summary: 'Analyze face traits from an uploaded selfie'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Face analysis completed successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 400,
        description: 'Invalid image or no face detected'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Unauthorized'
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
], FaceAnalysisController.prototype, "analyzeFace", null);
_ts_decorate([
    (0, _common.Post)('analyze-current'),
    (0, _common.HttpCode)(200),
    (0, _swagger.ApiOperation)({
        summary: 'Analyze face traits from the registered face photo'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Face analysis completed successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 400,
        description: 'No registered face photo'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Unauthorized'
    }),
    (0, _swagger.ApiResponse)({
        status: 404,
        description: 'Stored face photo not found'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], FaceAnalysisController.prototype, "analyzeStoredFace", null);
_ts_decorate([
    (0, _common.Put)('update'),
    (0, _swagger.ApiOperation)({
        summary: 'Update authenticated user face analysis traits'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Face analysis updated successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 400,
        description: 'Invalid update payload'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Unauthorized'
    }),
    (0, _swagger.ApiResponse)({
        status: 404,
        description: 'Face analysis not found'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], FaceAnalysisController.prototype, "updateFaceAnalysis", null);
FaceAnalysisController = _ts_decorate([
    (0, _swagger.ApiTags)('face-analysis'),
    (0, _swagger.ApiBearerAuth)(),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Controller)('face-analysis'),
    _ts_param(0, (0, _common.Inject)(_faceanalysisservice.FaceAnalysisService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], FaceAnalysisController);

//# sourceMappingURL=face-analysis.controller.js.map