"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get CreateProductDto () {
        return CreateProductDto;
    },
    get ProductImageDto () {
        return ProductImageDto;
    }
});
const _classvalidator = require("class-validator");
const _classtransformer = require("class-transformer");
const _swagger = require("@nestjs/swagger");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let ProductImageDto = class ProductImageDto {
    url;
    sort_order;
    is_primary;
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        example: 'https://cdn.example.com/product.jpg'
    }),
    (0, _classvalidator.IsUrl)()
], ProductImageDto.prototype, "url", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 0
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0)
], ProductImageDto.prototype, "sort_order", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: true
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsBoolean)()
], ProductImageDto.prototype, "is_primary", void 0);
let CreateProductDto = class CreateProductDto {
    sku;
    name;
    description;
    category_id;
    brand_id;
    price;
    images;
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        example: 'SKU-001'
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)()
], CreateProductDto.prototype, "sku", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        example: 'Classic Denim Jacket'
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)()
], CreateProductDto.prototype, "name", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'Premium denim jacket for all seasons'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
], CreateProductDto.prototype, "description", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        example: 'category-uuid'
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)()
], CreateProductDto.prototype, "category_id", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        example: 'brand-uuid'
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)()
], CreateProductDto.prototype, "brand_id", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        example: 79.99
    }),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0)
], CreateProductDto.prototype, "price", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        type: [
            ProductImageDto
        ]
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.ValidateNested)({
        each: true
    }),
    (0, _classtransformer.Type)(()=>ProductImageDto)
], CreateProductDto.prototype, "images", void 0);

//# sourceMappingURL=create-product.dto.js.map