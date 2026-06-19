import { Type } from 'class-transformer';
import {
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
} from '../validators/product.constants';

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

  @ApiPropertyOptional({ description: 'Search by name, sku, or description' })
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
  category_id;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand_id;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_price;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_price;
}
