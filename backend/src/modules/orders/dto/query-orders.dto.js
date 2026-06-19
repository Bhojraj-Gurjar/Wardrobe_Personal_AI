import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
  ORDER_STATUS_VALUES,
} from '../validators/order.constants';

export class QueryOrdersDto {
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

  @ApiPropertyOptional({ enum: ORDER_STATUS_VALUES })
  @IsOptional()
  @IsEnum(ORDER_STATUS_VALUES)
  status;
}
