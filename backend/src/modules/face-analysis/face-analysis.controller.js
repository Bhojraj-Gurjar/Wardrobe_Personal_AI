import {
  Inject,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Put,
  UploadedFile,
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
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  FACE_UPLOAD_FIELD,
  FACE_UPLOAD_MAX_BYTES,
  toFaceAuthDto,
} from '../face/utils/face-upload.util';
import { UpdateFaceAnalysisDto } from './dto/update-face-analysis.dto';
import { FaceAnalysisService } from './face-analysis.service';

const faceUploadInterceptor = FileInterceptor(FACE_UPLOAD_FIELD, {
  storage: memoryStorage(),
  limits: { fileSize: FACE_UPLOAD_MAX_BYTES },
});

export @ApiTags('face-analysis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('face-analysis')
class FaceAnalysisController {
  constructor(@Inject(FaceAnalysisService) faceAnalysisService) {
    this.faceAnalysisService = faceAnalysisService;
  }

  @Get('me')
  @ApiOperation({ summary: 'Get authenticated user face analysis profile' })
  @ApiResponse({ status: 200, description: 'Face analysis retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Face analysis not found' })
  getMyFaceAnalysis(@CurrentUser() user) {
    return this.faceAnalysisService.getMyFaceAnalysis(user.userId);
  }

  @Post('analyze')
  @HttpCode(200)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Analyze face traits from an uploaded selfie' })
  @ApiResponse({ status: 200, description: 'Face analysis completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid image or no face detected' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(faceUploadInterceptor)
  async analyzeFace(@CurrentUser() user, @UploadedFile() file, @Body() body) {
    const dto = await toFaceAuthDto(file, body);
    return this.faceAnalysisService.analyzeFace(user.userId, dto);
  }

  @Put('update')
  @ApiOperation({ summary: 'Update authenticated user face analysis traits' })
  @ApiResponse({ status: 200, description: 'Face analysis updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid update payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Face analysis not found' })
  updateFaceAnalysis(@CurrentUser() user, @Body() dto) {
    return this.faceAnalysisService.updateFaceAnalysis(user.userId, dto);
  }
}
