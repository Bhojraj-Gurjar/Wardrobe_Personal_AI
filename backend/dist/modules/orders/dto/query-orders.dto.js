"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "QueryOrdersDto", {
    enumerable: true,
    get: function() {
        return QueryOrdersDto;
    }
});
const _classtransformer = require("class-transformer");
const _classvalidator = require("class-validator");
const _swagger = require("@nestjs/swagger");
const _orderconstants = require("../validators/order.constants");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let QueryOrdersDto = class QueryOrdersDto {
    page = _orderconstants.DEFAULT_PAGE;
    limit = _orderconstants.DEFAULT_LIMIT;
    status;
};
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        default: _orderconstants.DEFAULT_PAGE
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(1)
], QueryOrdersDto.prototype, "page", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        default: _orderconstants.DEFAULT_LIMIT
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(1),
    (0, _classvalidator.Max)(_orderconstants.MAX_LIMIT)
], QueryOrdersDto.prototype, "limit", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        enum: _orderconstants.ORDER_STATUS_VALUES
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(_orderconstants.ORDER_STATUS_VALUES)
], QueryOrdersDto.prototype, "status", void 0);

//# sourceMappingURL=query-orders.dto.js.map