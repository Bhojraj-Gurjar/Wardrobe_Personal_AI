"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RecommendationsController", {
    enumerable: true,
    get: function() {
        return RecommendationsController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _jwtauthguard = require("../../../guards/jwt-auth.guard");
const _currentuserdecorator = require("../../../common/decorators/current-user.decorator");
const _dtovalidationpipe = require("../../../common/pipes/dto-validation.pipe");
const _recommendationsservice = require("../services/recommendations.service");
const _queryrecommendationsdto = require("../dto/query-recommendations.dto");
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
const queryRecommendationsPipe = (0, _dtovalidationpipe.DtoValidationPipe)(_queryrecommendationsdto.QueryRecommendationsDto);
let RecommendationsController = class RecommendationsController {
    constructor(recommendationsService){
        this.recommendationsService = recommendationsService;
    }
    getRecommendations(user, query) {
        return this.recommendationsService.getRecommendations(user.userId, query);
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: 'Get personalized product recommendations'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Recommendations retrieved successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Unauthorized'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Query)(queryRecommendationsPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], RecommendationsController.prototype, "getRecommendations", null);
RecommendationsController = _ts_decorate([
    (0, _swagger.ApiTags)('recommendations'),
    (0, _swagger.ApiBearerAuth)(),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Controller)('recommendations'),
    _ts_param(0, (0, _common.Inject)(_recommendationsservice.RecommendationsService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], RecommendationsController);

//# sourceMappingURL=recommendations.controller.js.map