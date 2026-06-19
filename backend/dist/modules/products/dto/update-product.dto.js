"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UpdateProductDto", {
    enumerable: true,
    get: function() {
        return UpdateProductDto;
    }
});
const _classvalidator = require("class-validator");
const _classtransformer = require("class-transformer");
const _swagger = require("@nestjs/swagger");
const _createproductdto = require("./create-product.dto");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let UpdateProductDto = class UpdateProductDto {
    sku;
    name;
    description;
    category_id;
    brand_id;
    price;
    images;
};
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'SKU-001'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)()
], UpdateProductDto.prototype, "sku", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'Classic Denim Jacket'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)()
], UpdateProductDto.prototype, "name", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
], UpdateProductDto.prototype, "description", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)()
], UpdateProductDto.prototype, "category_id", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)()
], UpdateProductDto.prototype, "brand_id", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 79.99
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0)
], UpdateProductDto.prototype, "price", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        type: [
            _createproductdto.ProductImageDto
        ]
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.ValidateNested)({
        each: true
    }),
    (0, _classtransformer.Type)(()=>_createproductdto.ProductImageDto)
], UpdateProductDto.prototype, "images", void 0);

//# sourceMappingURL=update-product.dto.js.map