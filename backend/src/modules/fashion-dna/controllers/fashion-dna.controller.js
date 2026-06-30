import {
  Inject,
  Body,
  Controller,
  Get,
  HttpCode,
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
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UpdateFashionDnaDto } from '../dto/update-fashion-dna.dto';
import { FashionDnaService } from '../services/fashion-dna.service';

export @ApiTags('fashion-dna')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('fashion-dna')
class FashionDnaController {
  constructor(@Inject(FashionDnaService) fashionDnaService) {
    this.fashionDnaService = fashionDnaService;
  }

  @Get('me')
  @ApiOperation({ summary: 'Get authenticated user Fashion DNA profile' })
  @ApiResponse({
    status: 200,
    description: 'Fashion DNA retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Fashion DNA not found' })
  getMyFashionDna(@CurrentUser() user) {
    return this.fashionDnaService.getFashionDna(user.userId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get Fashion DNA change history for authenticated user' })
  @ApiResponse({ status: 200, description: 'History retrieved successfully' })
  getFashionDnaHistory(@CurrentUser() user) {
    return this.fashionDnaService.getFashionDnaHistory(user.userId);
  }

  @Post('generate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Generate or refresh Fashion DNA profile' })
  @ApiResponse({
    status: 200,
    description: 'Fashion DNA generated successfully',
  })
  @ApiResponse({ status: 400, description: 'Profile incomplete' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  generateFashionDna(@CurrentUser() user) {
    return this.fashionDnaService.generateFashionDna(user.userId);
  }

  @Put('update')
  @ApiOperation({ summary: 'Update authenticated user Fashion DNA profile' })
  @ApiResponse({
    status: 200,
    description: 'Fashion DNA updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid update payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Fashion DNA not found' })
  updateFashionDna(@CurrentUser() user, @Body() dto) {
    return this.fashionDnaService.updateFashionDna(user.userId, dto);
  }
}
