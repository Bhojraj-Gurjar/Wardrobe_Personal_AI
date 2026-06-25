import { IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const PUBLIC_IMAGE_URL_OPTIONS = {
  require_tld: false,
  protocols: ['http', 'https'],
};

export class CreateTryOnDto {
  @ApiProperty({
    example: 'https://example.com/person.jpg',
    description: 'Public URL of the person / model photo',
  })
  @IsNotEmpty()
  @IsUrl(PUBLIC_IMAGE_URL_OPTIONS)
  personImageUrl;

  @ApiProperty({
    example: 'https://example.com/garment.jpg',
    description: 'Public URL of the garment product image',
  })
  @IsNotEmpty()
  @IsUrl(PUBLIC_IMAGE_URL_OPTIONS)
  garmentImageUrl;
}
