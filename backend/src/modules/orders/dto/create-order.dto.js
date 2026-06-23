import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ example: 149.99 })
  @IsNumber()
  @Min(0)
  total_amount;

  @ApiPropertyOptional({ example: 'product-uuid', description: 'Purchased product for brand affinity tracking' })
  @IsOptional()
  @IsString()
  product_id;
}
