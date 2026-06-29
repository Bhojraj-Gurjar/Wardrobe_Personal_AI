import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({ example: 'Thank you for the update. I tried clearing cache...' })
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  body;

  @ApiPropertyOptional({ description: 'Admin-only internal note' })
  @IsOptional()
  @IsBoolean()
  is_internal;
}
