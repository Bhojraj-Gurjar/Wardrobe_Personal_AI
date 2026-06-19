import { IsEnum, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  BODY_TYPE_VALUES,
  GENDER_VALUES,
  SKIN_TONE_VALUES,
} from '../validators/profile.constants';

export class UpdateProfileDto {
  @ApiPropertyOptional({ enum: GENDER_VALUES, example: 'FEMALE' })
  @IsOptional()
  @IsEnum(GENDER_VALUES, { message: 'gender must be a valid value' })
  gender;

  @ApiPropertyOptional({ example: 28, minimum: 13, maximum: 120 })
  @IsOptional()
  @IsInt()
  @Min(13)
  @Max(120)
  age;

  @ApiPropertyOptional({ example: 165, description: 'Height in cm' })
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(300)
  height;

  @ApiPropertyOptional({ example: 62, description: 'Weight in kg' })
  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(500)
  weight;

  @ApiPropertyOptional({ enum: BODY_TYPE_VALUES, example: 'AVERAGE' })
  @IsOptional()
  @IsEnum(BODY_TYPE_VALUES, { message: 'body_type must be a valid value' })
  body_type;

  @ApiPropertyOptional({ enum: SKIN_TONE_VALUES, example: 'MEDIUM' })
  @IsOptional()
  @IsEnum(SKIN_TONE_VALUES, { message: 'skin_tone must be a valid value' })
  skin_tone;
}
