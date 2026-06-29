import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
} from '../validators/support.constants';

export class QueryTicketsDto {
  @ApiPropertyOptional({ default: DEFAULT_PAGE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = DEFAULT_PAGE;

  @ApiPropertyOptional({ default: DEFAULT_LIMIT })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_LIMIT)
  limit = DEFAULT_LIMIT;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  priority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateFrom;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateTo;
}
