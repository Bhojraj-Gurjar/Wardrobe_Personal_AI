import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecordSearchDto {
  @ApiProperty({ example: 'linen blazer' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  query;
}
