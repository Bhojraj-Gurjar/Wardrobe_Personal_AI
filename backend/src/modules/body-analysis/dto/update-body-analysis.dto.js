import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBodyAnalysisDto {
  @ApiPropertyOptional({ example: 'Athletic' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  bodyType;

  @ApiPropertyOptional({ example: 'Rectangle' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  bodyShape;

  @ApiPropertyOptional({ example: 170 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  height;

  @ApiPropertyOptional({ example: 42 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  shoulderWidth;

  @ApiPropertyOptional({ example: 90 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  chest;

  @ApiPropertyOptional({ example: 72 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  waist;

  @ApiPropertyOptional({ example: 95 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hip;

  @ApiPropertyOptional({ example: 58 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  armLength;

  @ApiPropertyOptional({ example: 82 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  legLength;

  @ApiPropertyOptional({
    example: {
      schemaVersion: 1,
      summary: 'Fit recommendations based on your body type and shape.',
      sections: [
        {
          id: 'tops',
          title: 'Tops',
          fit: 'Regular fit with light waist definition',
          recommendations: ['Peplum and wrap tops'],
          tips: ['Semi-tuck tops to create waist shape'],
          avoid: ['Boxy oversized tops without structure'],
        },
      ],
    },
  })
  @IsOptional()
  @IsObject()
  fitProfile;
}
