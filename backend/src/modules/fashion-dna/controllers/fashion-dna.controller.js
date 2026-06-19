import { Inject, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { FashionDnaService } from '../services/fashion-dna.service';

export @ApiTags('fashion-dna')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('fashion-dna')
class FashionDnaController {
  constructor(@Inject(FashionDnaService) fashionDnaService) {
    this.fashionDnaService = fashionDnaService;
  }

  @Get()
  @ApiOperation({ summary: 'Get authenticated user Fashion DNA' })
  @ApiResponse({
    status: 200,
    description: 'Fashion DNA retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Fashion DNA not found' })
  getFashionDna(@CurrentUser() user) {
    return this.fashionDnaService.getFashionDna(user.userId);
  }

  @Post('generate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Generate or refresh Fashion DNA' })
  @ApiResponse({
    status: 200,
    description: 'Fashion DNA generated successfully',
  })
  @ApiResponse({ status: 400, description: 'Profile incomplete' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  generateFashionDna(@CurrentUser() user) {
    return this.fashionDnaService.generateFashionDna(user.userId);
  }
}
