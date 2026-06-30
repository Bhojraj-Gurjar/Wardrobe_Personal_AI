import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { QueryProductsDto } from './query-products.dto';

export class SearchProductsDto extends QueryProductsDto {
  @ApiPropertyOptional({
    example: 'nike jacket',
    description: 'Search term matched against name, sku, brand, category, and description',
  })
  @IsOptional()
  @IsString()
  q;

  @ApiPropertyOptional({
    description: 'Alias for q',
  })
  @IsOptional()
  @IsString()
  search;
}
