import {
  Inject,
  Body,
  Controller,
  HttpCode,
  Logger,
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
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { FaceService } from '../services/face.service';
import {
  FACE_UPLOAD_FIELD,
  FACE_UPLOAD_MAX_BYTES,
  toFaceAuthDto,
} from '../utils/face-upload.util';

const faceUploadInterceptor = FileInterceptor(FACE_UPLOAD_FIELD, {
  storage: memoryStorage(),
  limits: { fileSize: FACE_UPLOAD_MAX_BYTES },
});

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
  @UseInterceptors(faceUploadInterceptor)
  async register(@CurrentUser() user, @UploadedFile() file, @Body() body) {
    const dto = await toFaceAuthDto(file, body);
    return this.faceService.register(user.userId, dto);
  }

  @Put('photo')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Replace registered face photo and regenerate embedding' })
  @UseInterceptors(faceUploadInterceptor)
  async updatePhoto(@CurrentUser() user, @UploadedFile() file, @Body() body) {
    const dto = await toFaceAuthDto(file, body);
    return this.faceService.updatePhoto(user.userId, dto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Login using face' })
  @UseInterceptors(faceUploadInterceptor)
  async login(@UploadedFile() file, @Body() body) {
    const dto = await toFaceAuthDto(file, body);
    return this.faceService.login(dto);
  }

  @Post('verify')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Verify face matches authenticated user' })
  @UseInterceptors(faceUploadInterceptor)
  async verify(@CurrentUser() user, @UploadedFile() file, @Body() body) {
    const dto = await toFaceAuthDto(file, body);
    return this.faceService.verify(user.userId, dto);
  }
}
