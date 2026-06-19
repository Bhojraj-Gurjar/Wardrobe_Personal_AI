"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "QueryProductsDto", {
    enumerable: true,
    get: function() {
        return QueryProductsDto;
    }
});
const _classtransformer = require("class-transformer");
const _classvalidator = require("class-validator");
const _swagger = require("@nestjs/swagger");
const _productconstants = require("../validators/product.constants");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let QueryProductsDto = class QueryProductsDto {
    page = _productconstants.DEFAULT_PAGE;
    limit = _productconstants.DEFAULT_LIMIT;
    search;
    sortBy = 'created_at';
    sortOrder = 'desc';
    category_id;
    brand_id;
    min_price;
    max_price;
};
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        default: _productconstants.DEFAULT_PAGE
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(1)
], QueryProductsDto.prototype, "page", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        default: _productconstants.DEFAULT_LIMIT
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(1),
    (0, _classvalidator.Max)(_productconstants.MAX_LIMIT)
], QueryProductsDto.prototype, "limit", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: 'Search by name, sku, or description'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
], QueryProductsDto.prototype, "search", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        enum: _productconstants.PRODUCT_SORT_FIELDS,
        default: 'created_at'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(_productconstants.PRODUCT_SORT_FIELDS)
], QueryProductsDto.prototype, "sortBy", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        enum: _productconstants.SORT_ORDERS,
        default: 'desc'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(_productconstants.SORT_ORDERS)
], QueryProductsDto.prototype, "sortOrder", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
], QueryProductsDto.prototype, "category_id", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
], QueryProductsDto.prototype, "brand_id", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0)
], QueryProductsDto.prototype, "min_price", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0)
], QueryProductsDto.prototype, "max_price", void 0);

//# sourceMappingURL=query-products.dto.js.map