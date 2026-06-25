import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Query,
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
import { DtoValidationPipe } from '../../common/pipes/dto-validation.pipe';
import { CreateTryOnDto } from './try-on.dto';
import { TryOnService } from './try-on.service';
import { TryOnUploadService } from './try-on-upload.service';
import { TryOnStudioService } from './services/try-on-studio.service';

const createTryOnPipe = DtoValidationPipe(CreateTryOnDto);
const tryOnUploadInterceptor = FileInterceptor('image', {
  storage: memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
});

export @ApiTags('try-on')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('try-on')
class TryOnController {
  constructor(
    @Inject(TryOnService) tryOnService,
    @Inject(TryOnUploadService) tryOnUploadService,
    @Inject(TryOnStudioService) tryOnStudioService,
  ) {
    this.tryOnService = tryOnService;
    this.tryOnUploadService = tryOnUploadService;
    this.tryOnStudioService = tryOnStudioService;
  }

  @Get('setup')
  @ApiOperation({ summary: 'Get Try-On Studio setup (onboarding body photo)' })
  getSetup(@CurrentUser() user) {
    return this.tryOnStudioService.getSetup(user.userId);
  }

  @Get('products')
  @ApiOperation({ summary: 'List catalog products for Try-On Studio' })
  listProducts(@CurrentUser() user, @Query() query) {
    return this.tryOnStudioService.listProducts(user.userId, query);
  }

  @Post('generate/:productId')
  @HttpCode(200)
  @ApiOperation({ summary: 'Generate try-on using onboarding body photo and catalog product' })
  generateWithProduct(@CurrentUser() user, @Param('productId') productId) {
    return this.tryOnStudioService.generateWithProduct(user.userId, productId);
  }

  @Post('upload/person')
  @HttpCode(200)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload person image for CatVTON (isolated storage)' })
  @UseInterceptors(tryOnUploadInterceptor)
  uploadPerson(@CurrentUser() user, @UploadedFile() file) {
    const dto = file?.buffer?.length
      ? { imageBuffer: file.buffer, imageMimeType: file.mimetype || 'image/jpeg' }
      : null;
    return this.tryOnUploadService.uploadPersonImage(user.userId, dto);
  }

  @Post('upload/garment')
  @HttpCode(200)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload garment image for CatVTON (isolated storage)' })
  @UseInterceptors(tryOnUploadInterceptor)
  uploadGarment(@CurrentUser() user, @UploadedFile() file) {
    const dto = file?.buffer?.length
      ? { imageBuffer: file.buffer, imageMimeType: file.mimetype || 'image/jpeg' }
      : null;
    return this.tryOnUploadService.uploadGarmentImage(user.userId, dto);
  }

  @Post('generate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Generate a virtual try-on image via the AI service' })
  @ApiResponse({ status: 200, description: 'Try-on image generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid image URLs' })
  @ApiResponse({ status: 502, description: 'AI service error' })
  @ApiResponse({ status: 504, description: 'Try-on timed out' })
  generate(@CurrentUser() user, @Body(createTryOnPipe) dto) {
    return this.tryOnService.generateTryOn(
      user.userId,
      dto.personImageUrl,
      dto.garmentImageUrl,
    );
  }

  @Get('history')
  @ApiOperation({ summary: 'List CatVTON try-on generation history' })
  getHistory(@CurrentUser() user) {
    return this.tryOnService.getHistory(user.userId);
  }

  @Get('results')
  @ApiOperation({ summary: 'List Try-On Studio results' })
  listResults(@CurrentUser() user) {
    return this.tryOnStudioService.listResults(user.userId);
  }

  @Post('results/:id/save-outfit')
  @HttpCode(200)
  @ApiOperation({ summary: 'Save a Try-On Studio result as an outfit' })
  saveResultOutfit(@CurrentUser() user, @Param('id') resultId, @Body() body) {
    return this.tryOnStudioService.saveResultOutfit(user.userId, resultId, body);
  }

  @Post('results/:id/add-to-closet')
  @HttpCode(200)
  @ApiOperation({ summary: 'Add a Try-On Studio result to personal closet' })
  addResultToCloset(@CurrentUser() user, @Param('id') resultId) {
    return this.tryOnStudioService.addResultToCloset(user.userId, resultId);
  }
}
