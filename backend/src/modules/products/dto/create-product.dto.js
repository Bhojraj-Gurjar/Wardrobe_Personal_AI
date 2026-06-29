import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AVATAR_CATEGORIES } from '../constants/avatar.constants';
import { PRODUCT_TYPES } from '../constants/product-type.constants';

const PRODUCT_GENDERS = ['MALE', 'FEMALE', 'UNISEX', 'OTHER'];

export class ProductImageDto {
  @ApiProperty({ example: 'https://cdn.example.com/product.jpg' })
  @IsUrl()
  url;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sort_order;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_primary;
}

export class CreateProductDto {
  @ApiProperty({ example: 'SKU-001' })
  @IsString()
  @IsNotEmpty()
  sku;

  @ApiProperty({ example: 'Classic Denim Jacket' })
  @IsString()
  @IsNotEmpty()
  name;

  @ApiPropertyOptional({ example: 'Premium denim jacket for all seasons' })
  @IsOptional()
  @IsString()
  description;

  @ApiProperty({ example: 'outerwear' })
  @IsString()
  @IsNotEmpty()
  category;

  @ApiProperty({ example: 'T-Shirt', enum: PRODUCT_TYPES })
  @IsString()
  @IsNotEmpty()
  @IsIn(PRODUCT_TYPES)
  productType;

  @ApiPropertyOptional({ example: 'jackets' })
  @IsOptional()
  @IsString()
  subcategory;

  @ApiPropertyOptional({ example: 'UNISEX', enum: PRODUCT_GENDERS })
  @IsOptional()
  @IsString()
  @IsIn(PRODUCT_GENDERS)
  gender;

  @ApiProperty({ example: 'Levi\'s' })
  @IsString()
  @IsNotEmpty()
  brand;

  @ApiPropertyOptional({ example: 'category-uuid', description: 'Legacy alias for category' })
  @IsOptional()
  @IsString()
  category_id;

  @ApiPropertyOptional({ example: 'brand-uuid', description: 'Legacy alias for brand' })
  @IsOptional()
  @IsString()
  brand_id;

  @ApiProperty({ example: 79.99 })
  @IsNumber()
  @Min(0)
  price;

  @ApiPropertyOptional({ example: 'INR', default: 'INR' })
  @IsOptional()
  @IsString()
  currency;

  @ApiPropertyOptional({ example: 'Navy' })
  @IsOptional()
  @IsString()
  color;

  @ApiPropertyOptional({ example: ['S', 'M', 'L', 'XL'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sizeOptions;

  @ApiPropertyOptional({ example: 'Denim' })
  @IsOptional()
  @IsString()
  fabric;

  @ApiPropertyOptional({ example: 'regular' })
  @IsOptional()
  @IsString()
  fitType;

  @ApiPropertyOptional({ example: ['casual', 'streetwear'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  styleTags;

  @ApiPropertyOptional({ example: ['weekend', 'travel'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  occasionTags;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/product.jpg' })
  @IsOptional()
  @IsUrl()
  imageUrl;

  @ApiPropertyOptional({ example: 'https://shop.example.com/products/sku-001' })
  @IsOptional()
  @IsUrl()
  productUrl;

  @ApiPropertyOptional({ example: 'JACKET', enum: AVATAR_CATEGORIES })
  @IsOptional()
  @IsString()
  @IsIn(AVATAR_CATEGORIES)
  avatarCategory;

  @ApiPropertyOptional({
    example: 40,
    description: 'Compositor z-order; lower values render behind higher values',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  overlayOrder;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar-overlay.png' })
  @IsOptional()
  @IsUrl()
  avatarOverlayUrl;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive;

  @ApiPropertyOptional({ type: [ProductImageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images;
}
