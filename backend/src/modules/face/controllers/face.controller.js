import {
  Inject,
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
  Put,
  Req,
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
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { FaceService } from '../services/face.service';
import {
  FACE_LIVENESS_FRAMES_FIELD,
  FACE_UPLOAD_FIELD,
  FACE_UPLOAD_MAX_BYTES,
  toFaceAuthDto,
} from '../utils/face-upload.util';

const faceAuthUploadInterceptor = FileFieldsInterceptor(
  [
    { name: FACE_UPLOAD_FIELD, maxCount: 1 },
    { name: FACE_LIVENESS_FRAMES_FIELD, maxCount: 16 },
  ],
  {
    storage: memoryStorage(),
    limits: { fileSize: FACE_UPLOAD_MAX_BYTES },
  },
);

const faceSingleUploadInterceptor = FileFieldsInterceptor(
  [{ name: FACE_UPLOAD_FIELD, maxCount: 1 }],
  {
    storage: memoryStorage(),
    limits: { fileSize: FACE_UPLOAD_MAX_BYTES },
  },
);

export @ApiTags('face')
@Controller('face')
class FaceController {
  constructor(@Inject(FaceService) faceService) {
    this.faceService = faceService;
    this.logger = new Logger(FaceController.name);
  }

  @Post('register')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Register face for authenticated user' })
  @UseInterceptors(faceAuthUploadInterceptor)
  async register(@CurrentUser() user, @UploadedFiles() files, @Body() body) {
    const dto = await toFaceAuthDto(files, body, { requireLiveness: true });
    return this.faceService.register(user.userId, dto);
  }

  @Put('photo')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Replace registered face photo and regenerate embedding' })
  @UseInterceptors(faceAuthUploadInterceptor)
  async updatePhoto(@CurrentUser() user, @UploadedFiles() files, @Body() body) {
    const dto = await toFaceAuthDto(files, body, { requireLiveness: true });
    return this.faceService.updatePhoto(user.userId, dto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Login using face' })
  @UseInterceptors(faceAuthUploadInterceptor)
  async login(@UploadedFiles() files, @Body() body, @Req() req) {
    const dto = await toFaceAuthDto(files, body, { requireLiveness: true });
    return this.faceService.login(dto, {
      clientIp: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post('verify')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Verify face matches authenticated user' })
  @UseInterceptors(faceSingleUploadInterceptor)
  async verify(@CurrentUser() user, @UploadedFiles() files, @Body() body) {
    const dto = await toFaceAuthDto(files, body, {
      requireLiveness: false,
      allowLegacyJson: true,
    });
    return this.faceService.verify(user.userId, dto);
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Verify face before logout and issue logout nonce' })
  @UseInterceptors(faceSingleUploadInterceptor)
  async logout(@CurrentUser() user, @UploadedFiles() files, @Body() body) {
    const dto = await toFaceAuthDto(files, body, {
      requireLiveness: false,
      allowLegacyJson: true,
    });
    return this.faceService.logout(user.userId, dto);
  }
}
