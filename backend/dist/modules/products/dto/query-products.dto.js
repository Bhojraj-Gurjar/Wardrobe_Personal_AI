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
const _validators = require("../validators");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let QueryProductsDto = class QueryProductsDto {
    page = _validators.DEFAULT_PAGE;
    limit = _validators.DEFAULT_LIMIT;
    search;
    sortBy = 'created_at';
    sortOrder = 'desc';
    category;
    subcategory;
    gender;
    brand;
    color;
    avatarCategory;
    category_id;
    brand_id;
    is_active;
    min_price;
    max_price;
    minPrice;
    maxPrice;
};
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        default: _validators.DEFAULT_PAGE
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(1)
], QueryProductsDto.prototype, "page", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        default: _validators.DEFAULT_LIMIT
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(1),
    (0, _classvalidator.Max)(_validators.MAX_LIMIT)
], QueryProductsDto.prototype, "limit", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: 'Search by name, sku, brand, or category'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
], QueryProductsDto.prototype, "search", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        enum: _validators.PRODUCT_SORT_FIELDS,
        default: 'created_at'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(_validators.PRODUCT_SORT_FIELDS)
], QueryProductsDto.prototype, "sortBy", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        enum: _validators.SORT_ORDERS,
        default: 'desc'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(_validators.SORT_ORDERS)
], QueryProductsDto.prototype, "sortOrder", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
], QueryProductsDto.prototype, "category", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
], QueryProductsDto.prototype, "subcategory", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
], QueryProductsDto.prototype, "gender", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'Nike'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
], QueryProductsDto.prototype, "brand", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'Black'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
], QueryProductsDto.prototype, "color", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        enum: _validators.AVATAR_CATEGORIES,
        description: 'Digital avatar wear slot'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(_validators.AVATAR_CATEGORIES)
], QueryProductsDto.prototype, "avatarCategory", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: 'Legacy filter alias for category'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
], QueryProductsDto.prototype, "category_id", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: 'Legacy filter alias for brand'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
], QueryProductsDto.prototype, "brand_id", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(({ value })=>{
        if (value === true || value === 'true') return true;
        if (value === false || value === 'false') return false;
        return undefined;
    }),
    (0, _classvalidator.IsBoolean)()
], QueryProductsDto.prototype, "is_active", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 20
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0)
], QueryProductsDto.prototype, "min_price", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 200
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0)
], QueryProductsDto.prototype, "max_price", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 20,
        description: 'Alias for min_price'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0)
], QueryProductsDto.prototype, "minPrice", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 200,
        description: 'Alias for max_price'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0)
], QueryProductsDto.prototype, "maxPrice", void 0);

//# sourceMappingURL=query-products.dto.js.map