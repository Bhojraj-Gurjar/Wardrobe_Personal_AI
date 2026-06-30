import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

export @ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
class DashboardController {
  constructor(@Inject(DashboardService) dashboardService) {
    this.dashboardService = dashboardService;
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get aggregated dashboard summary for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Dashboard summary retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getSummary(@CurrentUser() user) {
    return this.dashboardService.getSummary(user.userId);
  }
}
