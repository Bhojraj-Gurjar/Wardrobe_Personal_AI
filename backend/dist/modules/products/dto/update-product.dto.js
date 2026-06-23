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
const _avatarconstants = require("../constants/avatar.constants");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
const PRODUCT_GENDERS = [
    'MALE',
    'FEMALE',
    'UNISEX',
    'OTHER'
];
let UpdateProductDto = class UpdateProductDto {
    sku;
    name;
    description;
    category;
    subcategory;
    gender;
    brand;
    category_id;
    brand_id;
    price;
    currency;
    color;
    sizeOptions;
    fabric;
    fitType;
    styleTags;
    occasionTags;
    imageUrl;
    productUrl;
    avatarCategory;
    overlayOrder;
    avatarOverlayUrl;
    isActive;
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
    (0, _swagger.ApiPropertyOptional)({
        example: 'outerwear'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)()
], UpdateProductDto.prototype, "category", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'jackets'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
], UpdateProductDto.prototype, "subcategory", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'UNISEX',
        enum: PRODUCT_GENDERS
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsIn)(PRODUCT_GENDERS)
], UpdateProductDto.prototype, "gender", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'Levi\'s'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)()
], UpdateProductDto.prototype, "brand", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
], UpdateProductDto.prototype, "category_id", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
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
        example: 'USD'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
], UpdateProductDto.prototype, "currency", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'Navy'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
], UpdateProductDto.prototype, "color", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: [
            'S',
            'M',
            'L'
        ]
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.IsString)({
        each: true
    })
], UpdateProductDto.prototype, "sizeOptions", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'Denim'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
], UpdateProductDto.prototype, "fabric", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'regular'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
], UpdateProductDto.prototype, "fitType", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: [
            'casual'
        ]
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.IsString)({
        each: true
    })
], UpdateProductDto.prototype, "styleTags", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: [
            'weekend'
        ]
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.IsString)({
        each: true
    })
], UpdateProductDto.prototype, "occasionTags", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'https://cdn.example.com/product.jpg'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsUrl)()
], UpdateProductDto.prototype, "imageUrl", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'https://shop.example.com/products/sku-001'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsUrl)()
], UpdateProductDto.prototype, "productUrl", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'JACKET',
        enum: _avatarconstants.AVATAR_CATEGORIES
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsIn)(_avatarconstants.AVATAR_CATEGORIES)
], UpdateProductDto.prototype, "avatarCategory", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 40,
        description: 'Compositor z-order; lower values render behind higher values'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(0)
], UpdateProductDto.prototype, "overlayOrder", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'https://cdn.example.com/avatar-overlay.png'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsUrl)()
], UpdateProductDto.prototype, "avatarOverlayUrl", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: true
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsBoolean)()
], UpdateProductDto.prototype, "isActive", void 0);
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