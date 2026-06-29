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
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductImageDto } from './create-product.dto';
import { AVATAR_CATEGORIES } from '../constants/avatar.constants';
import { PRODUCT_TYPES } from '../constants/product-type.constants';

const PRODUCT_GENDERS = ['MALE', 'FEMALE', 'UNISEX', 'OTHER'];

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'SKU-001' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sku;

  @ApiPropertyOptional({ example: 'Classic Denim Jacket' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description;

  @ApiPropertyOptional({ example: 'outerwear' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  category;

  @ApiPropertyOptional({ example: 'T-Shirt', enum: PRODUCT_TYPES })
  @IsOptional()
  @IsString()
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

  @ApiPropertyOptional({ example: 'Levi\'s' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  brand;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category_id;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand_id;

  @ApiPropertyOptional({ example: 79.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price;

  @ApiPropertyOptional({ example: 'INR' })
  @IsOptional()
  @IsString()
  currency;

  @ApiPropertyOptional({ example: 'Navy' })
  @IsOptional()
  @IsString()
  color;

  @ApiPropertyOptional({ example: ['S', 'M', 'L'] })
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

  @ApiPropertyOptional({ example: ['casual'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  styleTags;

  @ApiPropertyOptional({ example: ['weekend'] })
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

  @ApiPropertyOptional({ example: true })
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
