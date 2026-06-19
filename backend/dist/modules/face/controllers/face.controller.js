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
const _jwtauthguard = require("../../../guards/jwt-auth.guard");
const _currentuserdecorator = require("../../../common/decorators/current-user.decorator");
const _dtovalidationpipe = require("../../../common/pipes/dto-validation.pipe");
const _faceservice = require("../services/face.service");
const _faceembeddingdto = require("../dto/face-embedding.dto");
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
const faceEmbeddingPipe = (0, _dtovalidationpipe.DtoValidationPipe)(_faceembeddingdto.FaceEmbeddingDto);
let FaceController = class FaceController {
    constructor(faceService){
        this.faceService = faceService;
    }
    register(user, dto) {
        return this.faceService.register(user.userId, dto);
    }
    login(dto) {
        return this.faceService.login(dto);
    }
};
_ts_decorate([
    (0, _common.Post)('register'),
    (0, _common.HttpCode)(201),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _swagger.ApiBearerAuth)(),
    (0, _swagger.ApiOperation)({
        summary: 'Register face embedding for authenticated user'
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: 'Face registered successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Unauthorized'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Body)(faceEmbeddingPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], FaceController.prototype, "register", null);
_ts_decorate([
    (0, _common.Post)('login'),
    (0, _common.HttpCode)(200),
    (0, _swagger.ApiOperation)({
        summary: 'Login using face embedding'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Face login successful'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Face not recognized'
    }),
    _ts_param(0, (0, _common.Body)(faceEmbeddingPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], FaceController.prototype, "login", null);
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