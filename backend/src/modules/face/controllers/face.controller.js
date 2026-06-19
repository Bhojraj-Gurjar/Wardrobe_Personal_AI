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
import { FaceService } from '../services/face.service';
import { FaceEmbeddingDto } from '../dto/face-embedding.dto';

const faceEmbeddingPipe = DtoValidationPipe(FaceEmbeddingDto);

export @ApiTags('face')
@Controller('face')
class FaceController {
  constructor(@Inject(FaceService) faceService) {
    this.faceService = faceService;
  }

  @Post('register')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register face embedding for authenticated user' })
  @ApiResponse({ status: 201, description: 'Face registered successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  register(@CurrentUser() user, @Body(faceEmbeddingPipe) dto) {
    return this.faceService.register(user.userId, dto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login using face embedding' })
  @ApiResponse({ status: 200, description: 'Face login successful' })
  @ApiResponse({ status: 401, description: 'Face not recognized' })
  login(@Body(faceEmbeddingPipe) dto) {
    return this.faceService.login(dto);
  }
}
