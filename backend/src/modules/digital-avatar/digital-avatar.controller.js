import {
  Inject,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  GenerateDigitalAvatarDto,
  UpdateDigitalAvatarDto,
} from './dto/digital-avatar.dto';
import { DigitalAvatarService } from './digital-avatar.service';

export @ApiTags('digital-avatar')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('digital-avatar')
class DigitalAvatarController {
  constructor(@Inject(DigitalAvatarService) digitalAvatarService) {
    this.digitalAvatarService = digitalAvatarService;
  }

  @Get('me')
  @ApiOperation({ summary: 'Get active digital avatar for authenticated user' })
  @ApiResponse({ status: 200, description: 'Active avatar retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'No active avatar found' })
  getMyAvatar(@CurrentUser() user) {
    return this.digitalAvatarService.getMyAvatar(user.userId);
  }

  @Get('history')
  @ApiOperation({ summary: 'List versioned digital avatar history' })
  @ApiResponse({
    status: 200,
    description: 'Avatar version history retrieved successfully',
    schema: {
      example: [
        {
          version: 1,
          type: 'BASIC_2D',
          avatarType: 'BASIC_2D',
          avatarImagePath: '/uploads/avatars/user-id/avatar-v1.png',
          avatarImage: 'http://localhost:3000/uploads/avatars/user-id/avatar-v1.png',
          createdAt: '2026-06-22T08:00:00.000Z',
        },
        {
          version: 2,
          type: 'PREMIUM_PHOTOREALISTIC',
          avatarType: 'PREMIUM_PHOTOREALISTIC',
          avatarImagePath: '/uploads/avatars/user-id/avatar-v1.png',
          avatarImage: 'http://localhost:3000/uploads/avatars/user-id/avatar-v1.png',
          createdAt: '2026-06-22T09:00:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getAvatarHistory(@CurrentUser() user) {
    return this.digitalAvatarService.getAvatarHistory(user.userId);
  }

  @Post('generate/premium')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Generate a PREMIUM_PHOTOREALISTIC avatar from face and body analysis traits',
  })
  @ApiResponse({ status: 200, description: 'Premium avatar generated and activated successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient trait data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  generatePremiumAvatar(@CurrentUser() user) {
    return this.digitalAvatarService.generatePremiumAvatar(user.userId);
  }

  @Post('generate/digital-twin')
  @ApiOperation({
    summary: 'Generate a DIGITAL_TWIN_3D avatar (reserved — not implemented yet)',
  })
  @ApiResponse({ status: 501, description: '3D Digital Twin generation not available yet' })
  @ApiResponse({ status: 400, description: 'Insufficient trait data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  generateDigitalTwinAvatar(@CurrentUser() user) {
    return this.digitalAvatarService.generateDigitalTwinAvatar(user.userId);
  }

  @Post('generate/basic')
  @HttpCode(200)
  @ApiOperation({ summary: 'Generate a new BASIC_2D avatar version from profile and analysis traits' })
  @ApiResponse({ status: 200, description: 'Basic avatar generated and activated successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient trait data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  generateBasicAvatar(@CurrentUser() user) {
    return this.digitalAvatarService.generateBasicAvatar(user.userId);
  }

  @Post('generate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Generate a new digital avatar version from user traits' })
  @ApiResponse({ status: 200, description: 'Avatar generated and activated successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient trait data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  generateAvatar(@CurrentUser() user, @Body() dto) {
    return this.digitalAvatarService.generateAvatar(user.userId, dto);
  }

  @Put('activate/:id')
  @ApiOperation({ summary: 'Activate a specific avatar version (only one active per user)' })
  @ApiResponse({ status: 200, description: 'Avatar activated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Cannot activate another user\'s avatar' })
  @ApiResponse({ status: 404, description: 'Avatar not found' })
  activateAvatar(@CurrentUser() user, @Param('id') avatarId) {
    return this.digitalAvatarService.activateAvatarById(user.userId, avatarId);
  }

  @Put('update')
  @ApiOperation({
    summary: 'Create a new avatar version from an update (version +1) or activate a historical version',
  })
  @ApiResponse({ status: 200, description: 'Avatar updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid update payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Avatar not found' })
  updateAvatar(@CurrentUser() user, @Body() dto) {
    return this.digitalAvatarService.updateAvatar(user.userId, dto);
  }
}
