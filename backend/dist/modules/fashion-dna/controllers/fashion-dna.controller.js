"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "FashionDnaController", {
    enumerable: true,
    get: function() {
        return FashionDnaController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _jwtauthguard = require("../../../guards/jwt-auth.guard");
const _currentuserdecorator = require("../../../common/decorators/current-user.decorator");
const _fashiondnaservice = require("../services/fashion-dna.service");
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
let FashionDnaController = class FashionDnaController {
    constructor(fashionDnaService){
        this.fashionDnaService = fashionDnaService;
    }
    getFashionDna(user) {
        return this.fashionDnaService.getFashionDna(user.userId);
    }
    generateFashionDna(user) {
        return this.fashionDnaService.generateFashionDna(user.userId);
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: 'Get authenticated user Fashion DNA'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Fashion DNA retrieved successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Unauthorized'
    }),
    (0, _swagger.ApiResponse)({
        status: 404,
        description: 'Fashion DNA not found'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], FashionDnaController.prototype, "getFashionDna", null);
_ts_decorate([
    (0, _common.Post)('generate'),
    (0, _common.HttpCode)(200),
    (0, _swagger.ApiOperation)({
        summary: 'Generate or refresh Fashion DNA'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Fashion DNA generated successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 400,
        description: 'Profile incomplete'
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
], FashionDnaController.prototype, "generateFashionDna", null);
FashionDnaController = _ts_decorate([
    (0, _swagger.ApiTags)('fashion-dna'),
    (0, _swagger.ApiBearerAuth)(),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Controller)('fashion-dna'),
    _ts_param(0, (0, _common.Inject)(_fashiondnaservice.FashionDnaService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], FashionDnaController);

//# sourceMappingURL=fashion-dna.controller.js.map