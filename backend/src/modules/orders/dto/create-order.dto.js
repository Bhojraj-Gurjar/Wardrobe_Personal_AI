import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ example: 149.99 })
  @IsNumber()
  @Min(0)
  total_amount;
}
