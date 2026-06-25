import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../types';

const EVENT_TYPES = ['office', 'wedding', 'party', 'travel', 'casual', 'gym'];

export class QueryEventRecommendationsDto {
  @ApiPropertyOptional({ default: DEFAULT_LIMIT })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_LIMIT)
  limit = DEFAULT_LIMIT;

  @ApiPropertyOptional({
    enum: EVENT_TYPES,
    default: 'casual',
  })
  @IsOptional()
  @IsString()
  @IsIn(EVENT_TYPES)
  event = 'casual';
}
