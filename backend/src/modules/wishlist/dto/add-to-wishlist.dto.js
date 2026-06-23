import { IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AddToWishlistDto {
  @ApiPropertyOptional({
    example: 'product-uuid',
    description: 'Stable product UUID used by wishlist and recommendations',
  })
  @ValidateIf((dto) => !dto.sku)
  @IsString()
  @IsNotEmpty()
  product_id;

  @ApiPropertyOptional({
    example: 'WA-MENTSHIR-NIKE-01',
    description: 'Immutable catalog SKU alternative to product_id',
  })
  @ValidateIf((dto) => !dto.product_id)
  @IsString()
  @IsNotEmpty()
  sku;
}
