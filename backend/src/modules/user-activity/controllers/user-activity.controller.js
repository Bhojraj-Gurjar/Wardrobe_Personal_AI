import {
  Inject,
  Body,
  Controller,
  HttpCode,
  Post,
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
import { DtoValidationPipe } from '../../../common/pipes/dto-validation.pipe';
import { RecordProductViewDto } from '../dto/record-product-view.dto';
import { RecordSearchDto } from '../dto/record-search.dto';
import { UserActivityService } from '../services/user-activity.service';

const recordProductViewPipe = DtoValidationPipe(RecordProductViewDto);
const recordSearchPipe = DtoValidationPipe(RecordSearchDto);

export @ApiTags('user-activity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user-activity')
class UserActivityController {
  constructor(@Inject(UserActivityService) userActivityService) {
    this.userActivityService = userActivityService;
  }

  @Post('product-views')
  @HttpCode(201)
  @ApiOperation({ summary: 'Record a product view for Fashion DNA learning' })
  @ApiResponse({ status: 201, description: 'Product view recorded' })
  recordProductView(@CurrentUser() user, @Body(recordProductViewPipe) dto) {
    return this.userActivityService.recordProductView(user.userId, dto.product_id);
  }

  @Post('searches')
  @HttpCode(201)
  @ApiOperation({ summary: 'Record a product search for Fashion DNA learning' })
  @ApiResponse({ status: 201, description: 'Search recorded' })
  recordSearch(@CurrentUser() user, @Body(recordSearchPipe) dto) {
    return this.userActivityService.recordSearch(user.userId, dto.query);
  }
}
