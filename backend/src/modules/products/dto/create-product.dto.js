import {
  IsArray,
  IsBoolean,
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

  @ApiProperty({ example: 'category-uuid' })
  @IsString()
  @IsNotEmpty()
  category_id;

  @ApiProperty({ example: 'brand-uuid' })
  @IsString()
  @IsNotEmpty()
  brand_id;

  @ApiProperty({ example: 79.99 })
  @IsNumber()
  @Min(0)
  price;

  @ApiPropertyOptional({ type: [ProductImageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images;
}
