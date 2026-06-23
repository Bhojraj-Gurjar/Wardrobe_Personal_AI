import {
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFaceAnalysisDto {
  @ApiPropertyOptional({ example: 'Oval' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  faceShape;

  @ApiPropertyOptional({ example: 'Medium' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  skinTone;

  @ApiPropertyOptional({ example: 'Medium' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  hairLength;

  @ApiPropertyOptional({ example: 'Brown' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  hairColor;

  @ApiPropertyOptional({ example: 'Wavy' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  hairStyle;

  @ApiPropertyOptional({ example: 'Clean Shave' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  beardType;
}
