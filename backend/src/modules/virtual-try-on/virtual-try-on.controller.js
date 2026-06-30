import {

  Body,

  Controller,

  Delete,

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

import { VirtualTryOnService } from './virtual-try-on.service';

import { TryOnUploadService } from '../try-on/try-on-upload.service';



const tryOnUploadInterceptor = FileInterceptor('image', {

  storage: memoryStorage(),

  limits: { fileSize: 12 * 1024 * 1024 },

});



export @ApiTags('virtual-try-on')

@ApiBearerAuth()

@UseGuards(JwtAuthGuard)

@Controller('virtual-try-on')

class VirtualTryOnController {

  constructor(
    @Inject(VirtualTryOnService) virtualTryOnService,
    @Inject(TryOnUploadService) tryOnUploadService,
  ) {

    this.virtualTryOnService = virtualTryOnService;

    this.tryOnUploadService = tryOnUploadService;

  }



  @Get('setup')

  @ApiOperation({ summary: 'Get virtual try-on setup for the authenticated user' })

  getSetup(@CurrentUser() user) {

    return this.virtualTryOnService.getSetup(user.userId);

  }



  @Post('upload/person')

  @HttpCode(200)

  @ApiConsumes('multipart/form-data')

  @ApiOperation({ summary: 'Upload a temporary person image for virtual try-on' })

  @UseInterceptors(tryOnUploadInterceptor)

  uploadPerson(@CurrentUser() user, @UploadedFile() file) {

    const dto = file?.buffer?.length

      ? { imageBuffer: file.buffer, imageMimeType: file.mimetype || 'image/jpeg' }

      : null;

    return this.tryOnUploadService.uploadPersonImage(user.userId, dto).then(async (uploadResult) => {
      if (uploadResult?.storagePath) {
        await this.virtualTryOnService.saveSessionPersonPhoto(
          user.userId,
          uploadResult.storagePath,
        );
      }

      return uploadResult;
    });

  }



  @Post('session/person/clear')

  @HttpCode(200)

  @ApiOperation({ summary: 'Clear uploaded virtual try-on session photo' })

  clearSessionPersonPhoto(@CurrentUser() user) {

    return this.virtualTryOnService.clearSessionPersonPhoto(user.userId);

  }



  @Get('products')

  @ApiOperation({ summary: 'List catalog products for virtual try-on' })

  listProducts(@CurrentUser() user, @Query() query) {

    return this.virtualTryOnService.listProducts(user.userId, query);

  }



  @Get('products/:categoryId')

  @ApiOperation({ summary: 'List try-on products for a category (legacy)' })

  getProducts(@CurrentUser() user, @Param('categoryId') categoryId) {

    return this.virtualTryOnService.getProductsByCategory(user.userId, categoryId);

  }



  @Post('generate/:productId')

  @HttpCode(200)

  @ApiOperation({ summary: 'Generate CatVTON try-on for a product' })

  generateTryOn(@CurrentUser() user, @Param('productId') productId, @Body() body) {
    return this.virtualTryOnService.generateTryOn(user.userId, productId, body || {});
  }



  @Post('generate-outfit')

  @HttpCode(200)

  @ApiOperation({ summary: 'Generate CatVTON try-on for a multi-product outfit' })

  generateOutfitTryOn(@CurrentUser() user, @Body() body) {
    return this.virtualTryOnService.generateOutfitTryOn(
      user.userId,
      body?.productIds || [],
      body || {},
    );
  }



  @Get('results')

  @ApiOperation({ summary: 'List virtual try-on result history' })

  listResults(@CurrentUser() user) {

    return this.virtualTryOnService.listTryOnResults(user.userId);

  }



  @Delete('results/:id')

  @ApiOperation({ summary: 'Delete a try-on result' })

  deleteResult(@CurrentUser() user, @Param('id') resultId) {

    return this.virtualTryOnService.deleteTryOnResult(user.userId, resultId);

  }



  @Post('results/:id/save-outfit')

  @HttpCode(201)

  @ApiOperation({ summary: 'Save a try-on result as an outfit' })

  saveResultOutfit(@CurrentUser() user, @Param('id') resultId, @Body() body) {

    return this.virtualTryOnService.saveTryOnResultOutfit(user.userId, resultId, body);

  }



  @Post('results/:id/add-to-closet')

  @HttpCode(201)

  @ApiOperation({ summary: 'Add a try-on result outfit to personal closet' })

  addResultToCloset(@CurrentUser() user, @Param('id') resultId) {

    return this.virtualTryOnService.addTryOnResultToCloset(user.userId, resultId);

  }



  @Post('apply')

  @HttpCode(200)

  @ApiOperation({ summary: 'Apply or remove a product layer (legacy)' })

  applyProduct(@CurrentUser() user, @Body() body) {

    return this.virtualTryOnService.applyProduct(user.userId, body);

  }



  @Post('reset')

  @HttpCode(200)

  @ApiOperation({ summary: 'Reset the current outfit selection (legacy)' })

  resetOutfit(@CurrentUser() user) {

    return this.virtualTryOnService.resetOutfit(user.userId);

  }



  @Get('saved-outfits')

  @ApiOperation({ summary: 'List saved outfits' })

  listSavedOutfits(@CurrentUser() user) {

    return this.virtualTryOnService.listSavedOutfits(user.userId);

  }



  @Post('saved-outfits')

  @HttpCode(201)

  @ApiOperation({ summary: 'Save the current outfit' })

  saveOutfit(@CurrentUser() user, @Body() body) {

    return this.virtualTryOnService.saveOutfit(user.userId, body);

  }



  @Delete('saved-outfits/:id')

  @ApiOperation({ summary: 'Delete a saved outfit' })

  @ApiResponse({ status: 200, description: 'Outfit deleted' })

  deleteSavedOutfit(@CurrentUser() user, @Param('id') outfitId) {

    return this.virtualTryOnService.deleteSavedOutfit(user.userId, outfitId);

  }

}

