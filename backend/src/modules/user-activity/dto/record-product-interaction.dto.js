import { IsIn, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const INTERACTION_TYPES = [
  'view',
  'wishlist',
  'like',
  'purchase',
  'avatar_try_on',
];

export class RecordProductInteractionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  product_id;

  @ApiProperty({ enum: INTERACTION_TYPES })
  @IsIn(INTERACTION_TYPES)
  type;
}
