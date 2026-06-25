import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  DEFAULT_LIMIT,
  MAX_LIMIT,
} from '../validators/recommendation.constants';

export class QueryRecommendationsDto {
  @ApiPropertyOptional({ default: DEFAULT_LIMIT })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_LIMIT)
  limit = DEFAULT_LIMIT;

  @ApiPropertyOptional({ description: 'Recommendation mode: daily, seasonal, event, trending' })
  @IsOptional()
  @IsString()
  type;

  @ApiPropertyOptional({ description: 'Event type for event recommendations' })
  @IsOptional()
  @IsString()
  event;
}
