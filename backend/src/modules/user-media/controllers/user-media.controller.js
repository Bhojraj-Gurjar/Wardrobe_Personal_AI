import { Inject, Body, Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserMediaService } from '../services/user-media.service';

export @ApiTags('user-media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users/media')
class UserMediaController {
  constructor(@Inject(UserMediaService) userMediaService) {
    this.userMediaService = userMediaService;
  }

  @Get()
  @ApiOperation({ summary: 'List active user media assets' })
  @ApiResponse({ status: 200, description: 'Media bundle retrieved' })
  getUserMedia(@CurrentUser() user) {
    return this.userMediaService.getUserMediaBundle(user.userId);
  }

  @Get('items/:mediaId')
  @ApiOperation({ summary: 'Get a single media record owned by the user' })
  @ApiResponse({ status: 200, description: 'Media record retrieved' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  getMediaById(@CurrentUser() user, @Param('mediaId') mediaId) {
    return this.userMediaService.getMediaById(user.userId, mediaId);
  }

  @Get(':module/latest')
  @ApiOperation({ summary: 'Get latest media for a module' })
  @ApiResponse({ status: 200, description: 'Latest media retrieved' })
  getLatestByModule(@CurrentUser() user, @Param('module') module) {
    return this.userMediaService.getLatestMedia(
      user.userId,
      String(module || '').toUpperCase(),
    );
  }

  @Get(':module/history')
  @ApiOperation({ summary: 'Get media history for a module' })
  @ApiResponse({ status: 200, description: 'Media history retrieved' })
  getModuleHistory(@CurrentUser() user, @Param('module') module) {
    return this.userMediaService.getModuleHistory(
      user.userId,
      String(module || '').toUpperCase(),
    );
  }
}

export { UserMediaController };
