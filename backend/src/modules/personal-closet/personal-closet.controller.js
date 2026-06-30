import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PersonalClosetService } from './personal-closet.service';

export @ApiTags('personal-closet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('personal-closet')
class PersonalClosetController {
  constructor(@Inject(PersonalClosetService) personalClosetService) {
    this.personalClosetService = personalClosetService;
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get personal closet summary counts' })
  getOverview(@CurrentUser() user) {
    return this.personalClosetService.getOverview(user.userId);
  }

  @Get('purchased-items')
  @ApiOperation({ summary: 'List purchased items from delivered orders' })
  getPurchasedItems(@CurrentUser() user, @Query() query) {
    return this.personalClosetService.getPurchasedItems(user.userId, query);
  }

  @Delete('purchased-items/:orderId/:productId')
  @ApiOperation({ summary: 'Remove a purchased item from closet view' })
  removePurchasedItem(
    @CurrentUser() user,
    @Param('orderId') orderId,
    @Param('productId') productId,
  ) {
    return this.personalClosetService.removePurchasedItem(
      user.userId,
      orderId,
      productId,
    );
  }

  @Get('outfits')
  @ApiOperation({ summary: 'List saved outfits' })
  getSavedOutfits(@CurrentUser() user) {
    return this.personalClosetService.getSavedOutfits(user.userId);
  }

  @Get('outfits/:id')
  @ApiOperation({ summary: 'Get saved outfit details' })
  getSavedOutfit(@CurrentUser() user, @Param('id') id) {
    return this.personalClosetService.getSavedOutfit(user.userId, id);
  }

  @Patch('outfits/:id')
  @ApiOperation({ summary: 'Update saved outfit' })
  updateSavedOutfit(
    @CurrentUser() user,
    @Param('id') id,
    @Body() body,
  ) {
    return this.personalClosetService.updateSavedOutfit(user.userId, id, body);
  }

  @Delete('outfits/:id')
  @ApiOperation({ summary: 'Delete saved outfit' })
  deleteOutfit(@CurrentUser() user, @Param('id') id) {
    return this.personalClosetService.deleteOutfit(user.userId, id);
  }

  @Post('outfits/:id/add-to-cart')
  @ApiOperation({ summary: 'Add all outfit items to cart' })
  addOutfitToCart(@CurrentUser() user, @Param('id') id) {
    return this.personalClosetService.addOutfitToCart(user.userId, id);
  }

  @Get('favorite-brands')
  @ApiOperation({ summary: 'Get favorite brands' })
  getFavoriteBrands(@CurrentUser() user) {
    return this.personalClosetService.getFavoriteBrands(user.userId);
  }

  @Delete('favorite-brands/:brandName')
  @ApiOperation({ summary: 'Remove brand from favorites' })
  removeFavoriteBrand(
    @CurrentUser() user,
    @Param('brandName') brandName,
  ) {
    return this.personalClosetService.removeFavoriteBrand(
      user.userId,
      decodeURIComponent(brandName),
    );
  }

  @Get('favorite-colors')
  @ApiOperation({ summary: 'Get favorite colors' })
  getFavoriteColors(@CurrentUser() user) {
    return this.personalClosetService.getFavoriteColors(user.userId);
  }

  @Delete('favorite-colors/:colorName')
  @ApiOperation({ summary: 'Remove color from favorites' })
  removeFavoriteColor(
    @CurrentUser() user,
    @Param('colorName') colorName,
  ) {
    return this.personalClosetService.removeFavoriteColor(
      user.userId,
      decodeURIComponent(colorName),
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Search closet products, outfits, and brands' })
  search(@CurrentUser() user, @Query() query) {
    return this.personalClosetService.search(user.userId, query);
  }
}
