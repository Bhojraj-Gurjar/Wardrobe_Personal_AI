import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const ADDRESS_TYPES = ['HOME', 'OFFICE', 'OTHER'];

export class CreateAddressDto {
  @ApiProperty()
  @IsString()
  full_name;

  @ApiProperty()
  @IsString()
  phone;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  alternate_phone;

  @ApiPropertyOptional({ default: 'India' })
  @IsOptional()
  @IsString()
  country;

  @ApiProperty()
  @IsString()
  state;

  @ApiProperty()
  @IsString()
  city;

  @ApiProperty()
  @IsString()
  pincode;

  @ApiProperty()
  @IsString()
  house_no;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  landmark;

  @ApiPropertyOptional({ enum: ADDRESS_TYPES })
  @IsOptional()
  @IsEnum(ADDRESS_TYPES)
  address_type;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_default;
}

export class UpdateAddressDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  full_name;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  alternate_phone;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pincode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  house_no;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  landmark;

  @ApiPropertyOptional({ enum: ADDRESS_TYPES })
  @IsOptional()
  @IsEnum(ADDRESS_TYPES)
  address_type;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_default;
}
