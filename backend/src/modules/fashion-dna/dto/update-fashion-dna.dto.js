import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFashionDnaDto {
  @ApiPropertyOptional({ example: 'casual' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  style_type;

  @ApiPropertyOptional({
    example: { navy: 0.9, white: 0.7 },
    description: 'Weighted color preferences',
  })
  @IsOptional()
  @IsObject()
  color_affinity;

  @ApiPropertyOptional({
    enum: ['ECONOMY', 'MID_RANGE', 'PREMIUM', 'LUXURY'],
    example: 'MID_RANGE',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  budget_range;

  @ApiPropertyOptional({
    example: { zara: 0.8, 'h&m': 0.6 },
    description: 'Weighted brand preferences',
  })
  @IsOptional()
  @IsObject()
  brand_affinity;

  @ApiPropertyOptional({ example: 82, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  fashion_confidence_score;

  @ApiPropertyOptional({
    example: {
      is_face_registered: true,
      registered_at: '2026-06-20T10:00:00.000Z',
      biometric_enabled: true,
    },
  })
  @IsOptional()
  @IsObject()
  face_traits;

  @ApiPropertyOptional({
    example: {
      body_type: 'ATHLETIC',
      skin_tone: 'MEDIUM',
      gender: 'FEMALE',
      age: 28,
    },
  })
  @IsOptional()
  @IsObject()
  body_traits;

  @ApiPropertyOptional({
    example: {
      occupation: 'EMPLOYEE',
      preferred_categories: ['CASUAL', 'FORMAL'],
      favorite_colors: ['Navy', 'White'],
    },
  })
  @IsOptional()
  @IsObject()
  preference_traits;

  @ApiPropertyOptional({
    example: {
      favorite_brands: { zara: 0.8 },
      favorite_categories: { casual: 0.7 },
      average_spending: 89.5,
      price_affinity: { mid_range: 0.6 },
    },
  })
  @IsOptional()
  @IsObject()
  activity_traits;
}
