"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "QueryRecommendationsDto", {
    enumerable: true,
    get: function() {
        return QueryRecommendationsDto;
    }
});
const _classtransformer = require("class-transformer");
const _classvalidator = require("class-validator");
const _swagger = require("@nestjs/swagger");
const _recommendationconstants = require("../validators/recommendation.constants");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let QueryRecommendationsDto = class QueryRecommendationsDto {
    limit = _recommendationconstants.DEFAULT_LIMIT;
    type;
    event;
};
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        default: _recommendationconstants.DEFAULT_LIMIT
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(1),
    (0, _classvalidator.Max)(_recommendationconstants.MAX_LIMIT)
], QueryRecommendationsDto.prototype, "limit", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: 'Recommendation mode: daily, seasonal, event, trending'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
], QueryRecommendationsDto.prototype, "type", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: 'Event type for event recommendations'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
], QueryRecommendationsDto.prototype, "event", void 0);

//# sourceMappingURL=query-recommendations.dto.js.map