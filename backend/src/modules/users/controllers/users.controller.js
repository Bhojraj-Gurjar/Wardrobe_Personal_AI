import { Inject, Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { DtoValidationPipe } from '../../../common/pipes/dto-validation.pipe';
import { UsersService } from '../services/users.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';

const updateProfilePipe = DtoValidationPipe(UpdateProfileDto);

export @ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
class UsersController {
  constructor(@Inject(UsersService) usersService) {
    this.usersService = usersService;
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  getProfile(@CurrentUser() user) {
    return this.usersService.getProfile(user.userId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  updateProfile(@CurrentUser() user, @Body(updateProfilePipe) dto) {
    return this.usersService.updateProfile(user.userId, dto);
  }
}
