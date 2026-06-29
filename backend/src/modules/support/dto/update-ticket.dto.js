import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  SUPPORT_TICKET_CATEGORY,
  SUPPORT_TICKET_PRIORITY,
  SUPPORT_TICKET_STATUS,
} from '../validators/support.constants';

export class UpdateTicketDto {
  @ApiPropertyOptional({ enum: SUPPORT_TICKET_STATUS })
  @IsOptional()
  @IsEnum(SUPPORT_TICKET_STATUS)
  status;

  @ApiPropertyOptional({ enum: SUPPORT_TICKET_PRIORITY })
  @IsOptional()
  @IsEnum(SUPPORT_TICKET_PRIORITY)
  priority;

  @ApiPropertyOptional({ enum: SUPPORT_TICKET_CATEGORY })
  @IsOptional()
  @IsEnum(SUPPORT_TICKET_CATEGORY)
  category;

  @ApiPropertyOptional({ description: 'Assignee user UUID' })
  @IsOptional()
  @IsString()
  assigned_to_id;
}
