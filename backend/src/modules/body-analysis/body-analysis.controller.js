import {
  Inject,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Put,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateBodyAnalysisDto } from './dto/update-body-analysis.dto';
import { BodyAnalysisService } from './body-analysis.service';
import {
  BODY_IMAGE_ALIAS_FIELD,
  BODY_IMAGE_FIELD,
  BODY_UPLOAD_MAX_BYTES,
  BODY_VIDEO_FIELD,
  BODY_VIDEO_MAX_BYTES,
  toBodyAnalysisDto,
} from './utils/body-upload.util';

const bodyUploadInterceptor = FileFieldsInterceptor(
  [
    { name: BODY_IMAGE_FIELD, maxCount: 1 },
    { name: BODY_IMAGE_ALIAS_FIELD, maxCount: 1 },
    { name: BODY_VIDEO_FIELD, maxCount: 1 },
  ],
  {
    storage: memoryStorage(),
    limits: { fileSize: BODY_VIDEO_MAX_BYTES },
  },
);

export @ApiTags('body-analysis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('body-analysis')
class BodyAnalysisController {
  constructor(@Inject(BodyAnalysisService) bodyAnalysisService) {
    this.bodyAnalysisService = bodyAnalysisService;
  }

  @Get('me')
  @ApiOperation({ summary: 'Get authenticated user body analysis profile' })
  @ApiResponse({ status: 200, description: 'Body analysis retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Body analysis not found' })
  getMyBodyAnalysis(@CurrentUser() user) {
    return this.bodyAnalysisService.getMyBodyAnalysis(user.userId);
  }

  @Post('analyze')
  @HttpCode(200)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Analyze body traits from image and optional video' })
  @ApiResponse({ status: 200, description: 'Body analysis completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid media or pose not detected' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(bodyUploadInterceptor)
  analyzeBody(@CurrentUser() user, @UploadedFiles() files, @Body() body) {
    const dto = toBodyAnalysisDto(files, body);
    return this.bodyAnalysisService.analyzeBody(user.userId, dto);
  }

  @Post('analyze-current')
  @HttpCode(200)
  @ApiOperation({ summary: 'Analyze body traits from the stored body photo' })
  @ApiResponse({ status: 200, description: 'Body analysis completed successfully' })
  @ApiResponse({ status: 400, description: 'No stored body photo' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Stored body photo not found' })
  analyzeStoredBody(@CurrentUser() user) {
    return this.bodyAnalysisService.analyzeStoredBody(user.userId);
  }

  @Put('update')
  @ApiOperation({ summary: 'Update authenticated user body analysis traits' })
  @ApiResponse({ status: 200, description: 'Body analysis updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid update payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  updateBodyAnalysis(@CurrentUser() user, @Body() dto) {
    return this.bodyAnalysisService.updateBodyAnalysis(user.userId, dto);
  }
}
