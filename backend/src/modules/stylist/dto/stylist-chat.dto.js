import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StylistChatDto {
  @ApiProperty({ example: 'What should I wear for an interview?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message;

  @ApiPropertyOptional({ description: 'Existing chat session UUID' })
  @IsOptional()
  @IsString()
  session_id;
}

export class CreateStylistSessionDto {
  @ApiPropertyOptional({ example: 'Interview outfit help' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title;
}
