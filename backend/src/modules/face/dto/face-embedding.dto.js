import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FaceEmbeddingDto {
  @ApiPropertyOptional({
    description: 'Base64 or data-URL face image for AI embedding',
  })
  @IsOptional()
  @IsString()
  image;

  @ApiPropertyOptional({
    type: [Number],
    description: 'Legacy client embedding vector (fallback when AI unavailable)',
    example: [0.12, -0.05, 0.88],
  })
  @ValidateIf((dto) => !dto.image)
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  embedding;
}
