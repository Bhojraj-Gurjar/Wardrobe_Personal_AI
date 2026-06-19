import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductImageDto } from './create-product.dto';

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  category_id;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  brand_id;

  @ApiPropertyOptional({ example: 79.99 })
  @IsOptional()
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
