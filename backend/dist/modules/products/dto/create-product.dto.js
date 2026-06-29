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
const _avatarconstants = require("../constants/avatar.constants");
const _producttypeconstants = require("../constants/product-type.constants");
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
    category;
    productType;
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
        example: 'outerwear'
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)()
], CreateProductDto.prototype, "category", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        example: 'T-Shirt',
        enum: _producttypeconstants.PRODUCT_TYPES
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)(),
    (0, _classvalidator.IsIn)(_producttypeconstants.PRODUCT_TYPES)
], CreateProductDto.prototype, "productType", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'jackets'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
], CreateProductDto.prototype, "subcategory", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'UNISEX',
        enum: PRODUCT_GENDERS
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsIn)(PRODUCT_GENDERS)
], CreateProductDto.prototype, "gender", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        example: 'Levi\'s'
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)()
], CreateProductDto.prototype, "brand", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'category-uuid',
        description: 'Legacy alias for category'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
], CreateProductDto.prototype, "category_id", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'brand-uuid',
        description: 'Legacy alias for brand'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
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
        example: 'INR',
        default: 'INR'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
], CreateProductDto.prototype, "currency", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'Navy'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
], CreateProductDto.prototype, "color", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: [
            'S',
            'M',
            'L',
            'XL'
        ]
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.IsString)({
        each: true
    })
], CreateProductDto.prototype, "sizeOptions", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'Denim'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
], CreateProductDto.prototype, "fabric", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'regular'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
], CreateProductDto.prototype, "fitType", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: [
            'casual',
            'streetwear'
        ]
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.IsString)({
        each: true
    })
], CreateProductDto.prototype, "styleTags", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: [
            'weekend',
            'travel'
        ]
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.IsString)({
        each: true
    })
], CreateProductDto.prototype, "occasionTags", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'https://cdn.example.com/product.jpg'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsUrl)()
], CreateProductDto.prototype, "imageUrl", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'https://shop.example.com/products/sku-001'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsUrl)()
], CreateProductDto.prototype, "productUrl", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'JACKET',
        enum: _avatarconstants.AVATAR_CATEGORIES
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsIn)(_avatarconstants.AVATAR_CATEGORIES)
], CreateProductDto.prototype, "avatarCategory", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 40,
        description: 'Compositor z-order; lower values render behind higher values'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(0)
], CreateProductDto.prototype, "overlayOrder", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'https://cdn.example.com/avatar-overlay.png'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsUrl)()
], CreateProductDto.prototype, "avatarOverlayUrl", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: true,
        default: true
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsBoolean)()
], CreateProductDto.prototype, "isActive", void 0);
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