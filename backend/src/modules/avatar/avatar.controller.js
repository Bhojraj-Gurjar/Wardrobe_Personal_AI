import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
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
import { AvatarService } from './avatar.service';
import { AvatarOutfitService } from './avatar-outfit.service';

export @ApiTags('avatar')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('avatar')
class AvatarController {
  constructor(
    @Inject(AvatarService) avatarService,
    @Inject(AvatarOutfitService) avatarOutfitService,
  ) {
    this.avatarService = avatarService;
    this.avatarOutfitService = avatarOutfitService;
  }

  @Get('me')
  @ApiOperation({ summary: 'Get wardrobe avatar and saved outfit for current user' })
  getAvatar(@CurrentUser() user) {
    return this.avatarService.getAvatar(user.userId);
  }

  @Post('generate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Generate or refresh avatar from face/body traits' })
  generateAvatar(@CurrentUser() user, @Body() body) {
    return this.avatarService.generateAvatar(user.userId, body || {});
  }

  @Put()
  @ApiOperation({ summary: 'Update avatar appearance metadata' })
  updateAvatar(@CurrentUser() user, @Body() body) {
    return this.avatarService.updateAvatar(user.userId, body || {});
  }

  @Get('outfit')
  @ApiOperation({ summary: 'Load saved outfit selections' })
  async loadOutfit(@CurrentUser() user) {
    const avatar = await this.avatarService.ensureAvatar(user.userId);
    return this.avatarOutfitService.loadOutfit(avatar.id);
  }

  @Put('outfit')
  @ApiOperation({ summary: 'Save outfit product selections' })
  async saveOutfit(@CurrentUser() user, @Body() body) {
    const avatar = await this.avatarService.ensureAvatar(user.userId);
    return this.avatarOutfitService.saveOutfit(avatar.id, body || {});
  }

  @Get('generation-profile')
  @ApiOperation({ summary: 'Get avatar generation parameters from face/body/Fashion DNA' })
  getGenerationProfile(@CurrentUser() user) {
    return this.avatarService.getGenerationProfile(user.userId);
  }

  @Post('outfit/save-look')
  @HttpCode(200)
  @ApiOperation({ summary: 'Save avatar outfit to personal closet saved looks' })
  saveLookToCloset(@CurrentUser() user, @Body() body) {
    return this.avatarService.saveLookToCloset(user.userId, body || {});
  }
}
