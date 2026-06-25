"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BodyAnalysisController", {
    enumerable: true,
    get: function() {
        return BodyAnalysisController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _platformexpress = require("@nestjs/platform-express");
const _multer = require("multer");
const _jwtauthguard = require("../../guards/jwt-auth.guard");
const _currentuserdecorator = require("../../common/decorators/current-user.decorator");
const _updatebodyanalysisdto = require("./dto/update-body-analysis.dto");
const _bodyanalysisservice = require("./body-analysis.service");
const _bodyuploadutil = require("./utils/body-upload.util");
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
const bodyUploadInterceptor = (0, _platformexpress.FileFieldsInterceptor)([
    {
        name: _bodyuploadutil.BODY_IMAGE_FIELD,
        maxCount: 1
    },
    {
        name: _bodyuploadutil.BODY_IMAGE_ALIAS_FIELD,
        maxCount: 1
    },
    {
        name: _bodyuploadutil.BODY_VIDEO_FIELD,
        maxCount: 1
    }
], {
    storage: (0, _multer.memoryStorage)(),
    limits: {
        fileSize: _bodyuploadutil.BODY_VIDEO_MAX_BYTES
    }
});
let BodyAnalysisController = class BodyAnalysisController {
    constructor(bodyAnalysisService){
        this.bodyAnalysisService = bodyAnalysisService;
    }
    getMyBodyAnalysis(user) {
        return this.bodyAnalysisService.getMyBodyAnalysis(user.userId);
    }
    analyzeBody(user, files, body) {
        const dto = (0, _bodyuploadutil.toBodyAnalysisDto)(files, body);
        return this.bodyAnalysisService.analyzeBody(user.userId, dto);
    }
    analyzeStoredBody(user) {
        return this.bodyAnalysisService.analyzeStoredBody(user.userId);
    }
    updateBodyAnalysis(user, dto) {
        return this.bodyAnalysisService.updateBodyAnalysis(user.userId, dto);
    }
};
_ts_decorate([
    (0, _common.Get)('me'),
    (0, _swagger.ApiOperation)({
        summary: 'Get authenticated user body analysis profile'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Body analysis retrieved successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Unauthorized'
    }),
    (0, _swagger.ApiResponse)({
        status: 404,
        description: 'Body analysis not found'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], BodyAnalysisController.prototype, "getMyBodyAnalysis", null);
_ts_decorate([
    (0, _common.Post)('analyze'),
    (0, _common.HttpCode)(200),
    (0, _swagger.ApiConsumes)('multipart/form-data'),
    (0, _swagger.ApiOperation)({
        summary: 'Analyze body traits from image and optional video'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Body analysis completed successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 400,
        description: 'Invalid media or pose not detected'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Unauthorized'
    }),
    (0, _common.UseInterceptors)(bodyUploadInterceptor),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.UploadedFiles)()),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], BodyAnalysisController.prototype, "analyzeBody", null);
_ts_decorate([
    (0, _common.Post)('analyze-current'),
    (0, _common.HttpCode)(200),
    (0, _swagger.ApiOperation)({
        summary: 'Analyze body traits from the stored body photo'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Body analysis completed successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 400,
        description: 'No stored body photo'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Unauthorized'
    }),
    (0, _swagger.ApiResponse)({
        status: 404,
        description: 'Stored body photo not found'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], BodyAnalysisController.prototype, "analyzeStoredBody", null);
_ts_decorate([
    (0, _common.Put)('update'),
    (0, _swagger.ApiOperation)({
        summary: 'Update authenticated user body analysis traits'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Body analysis updated successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 400,
        description: 'Invalid update payload'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Unauthorized'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], BodyAnalysisController.prototype, "updateBodyAnalysis", null);
BodyAnalysisController = _ts_decorate([
    (0, _swagger.ApiTags)('body-analysis'),
    (0, _swagger.ApiBearerAuth)(),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Controller)('body-analysis'),
    _ts_param(0, (0, _common.Inject)(_bodyanalysisservice.BodyAnalysisService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], BodyAnalysisController);

//# sourceMappingURL=body-analysis.controller.js.map