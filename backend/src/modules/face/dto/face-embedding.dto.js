import { ArrayMinSize, IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FaceEmbeddingDto {
  @ApiProperty({
    type: [Number],
    description: 'Face embedding vector captured on the client',
    example: [0.12, -0.05, 0.88],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  embedding;
}
