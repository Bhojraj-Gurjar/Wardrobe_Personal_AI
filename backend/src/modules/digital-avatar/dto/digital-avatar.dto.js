import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AVATAR_TYPES, AvatarRenderMode } from '../constants/digital-avatar.constants';

export class GenerateDigitalAvatarDto {
  @ApiPropertyOptional({
    example: AvatarRenderMode.BASIC_2D,
    enum: AVATAR_TYPES,
    description: 'Canonical: BASIC_2D, PREMIUM_PHOTOREALISTIC, DIGITAL_TWIN_3D. Legacy BASIC/PREMIUM accepted.',
  })
  @IsOptional()
  @IsString()
  @IsIn(AVATAR_TYPES)
  avatarType;
}

export class UpdateDigitalAvatarDto {
  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  avatarId;

  @ApiPropertyOptional({
    example: AvatarRenderMode.PREMIUM_PHOTOREALISTIC,
    enum: AVATAR_TYPES,
  })
  @IsOptional()
  @IsString()
  @IsIn(AVATAR_TYPES)
  avatarType;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive;

  @ApiPropertyOptional({
    description: 'Stored avatar image path (e.g. /uploads/avatars/{userId}/avatar-v1.png)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  avatarImage;
}
