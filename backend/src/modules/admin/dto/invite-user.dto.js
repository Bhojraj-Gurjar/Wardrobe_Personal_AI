import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InviteUserDto {
  @ApiProperty({ example: 'raj@example.com' })
  @IsEmail()
  email;

  @ApiProperty({ example: 'Raj Kumar' })
  @IsString()
  @IsNotEmpty()
  name;

  @ApiPropertyOptional({ example: 'Free', enum: ['Free', 'Pro', 'Premium'] })
  @IsOptional()
  @IsString()
  @IsIn(['Free', 'Pro', 'Premium'])
  plan;

  @ApiPropertyOptional({ description: 'Optional temporary password (min 8 chars)' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password;
}
