import { Type, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
  PRODUCT_SORT_FIELDS,
  SORT_ORDERS,
  AVATAR_CATEGORIES,
} from '../validators';

export class QueryProductsDto {
  @ApiPropertyOptional({ default: DEFAULT_PAGE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = DEFAULT_PAGE;

  @ApiPropertyOptional({ default: DEFAULT_LIMIT })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_LIMIT)
  limit = DEFAULT_LIMIT;

  @ApiPropertyOptional({ description: 'Search by name, sku, brand, or category' })
  @IsOptional()
  @IsString()
  search;

  @ApiPropertyOptional({ enum: PRODUCT_SORT_FIELDS, default: 'created_at' })
  @IsOptional()
  @IsEnum(PRODUCT_SORT_FIELDS)
  sortBy = 'created_at';

  @ApiPropertyOptional({ enum: SORT_ORDERS, default: 'desc' })
  @IsOptional()
  @IsEnum(SORT_ORDERS)
  sortOrder = 'desc';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subcategory;

  @ApiPropertyOptional({ example: 'T-Shirt', description: 'Filter by product type' })
  @IsOptional()
  @IsString()
  productType;

  @ApiPropertyOptional({ example: 'T-Shirt', description: 'Alias for productType' })
  @IsOptional()
  @IsString()
  product_type;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gender;

  @ApiPropertyOptional({ example: 'Nike' })
  @IsOptional()
  @IsString()
  brand;

  @ApiPropertyOptional({ example: 'Black' })
  @IsOptional()
  @IsString()
  color;

  @ApiPropertyOptional({ enum: AVATAR_CATEGORIES, description: 'Digital avatar wear slot' })
  @IsOptional()
  @IsEnum(AVATAR_CATEGORIES)
  avatarCategory;

  @ApiPropertyOptional({ description: 'Legacy filter alias for category' })
  @IsOptional()
  @IsString()
  category_id;

  @ApiPropertyOptional({ description: 'Legacy filter alias for brand' })
  @IsOptional()
  @IsString()
  brand_id;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  is_active;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_price;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_price;

  @ApiPropertyOptional({ example: 20, description: 'Alias for min_price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice;

  @ApiPropertyOptional({ example: 200, description: 'Alias for max_price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice;
}
