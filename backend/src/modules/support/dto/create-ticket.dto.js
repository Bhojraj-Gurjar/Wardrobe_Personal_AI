import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  MIN_DESCRIPTION_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_SUBJECT_LENGTH,
  SUPPORT_CONTACT_METHOD,
  SUPPORT_TICKET_CATEGORY,
  SUPPORT_TICKET_PRIORITY,
} from '../validators/support.constants';

export class CreateTicketDto {
  @ApiProperty({ example: 'Virtual try-on not loading' })
  @IsString()
  @MinLength(3)
  @MaxLength(MAX_SUBJECT_LENGTH)
  subject;

  @ApiProperty({ enum: SUPPORT_TICKET_CATEGORY })
  @IsEnum(SUPPORT_TICKET_CATEGORY)
  category;

  @ApiPropertyOptional({ enum: SUPPORT_TICKET_PRIORITY, default: 'MEDIUM' })
  @IsOptional()
  @IsEnum(SUPPORT_TICKET_PRIORITY)
  priority;

  @ApiProperty({ example: 'When I try to generate a try-on result, the page freezes...' })
  @IsString()
  @MinLength(MIN_DESCRIPTION_LENGTH)
  @MaxLength(MAX_DESCRIPTION_LENGTH)
  description;

  @ApiPropertyOptional({ enum: SUPPORT_CONTACT_METHOD })
  @IsOptional()
  @IsEnum(SUPPORT_CONTACT_METHOD)
  contact_method;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  callback_number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  order_reference;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  product_reference;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  ai_feature_related;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  browser_info;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  device_info;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  os_info;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  app_version;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timezone;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  page_url;
}
