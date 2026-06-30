import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecordProductViewDto {
  @ApiProperty({ example: 'uuid-product-id' })
  @IsUUID()
  product_id;
}
