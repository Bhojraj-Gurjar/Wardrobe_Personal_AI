import {
  Inject,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { DtoValidationPipe } from '../../../common/pipes/dto-validation.pipe';
import { WishlistService } from '../services/wishlist.service';
import { AddToWishlistDto } from '../dto/add-to-wishlist.dto';

const addToWishlistPipe = DtoValidationPipe(AddToWishlistDto);

export @ApiTags('wishlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wishlist')
class WishlistController {
  constructor(@Inject(WishlistService) wishlistService) {
    this.wishlistService = wishlistService;
  }

  @Get()
  @ApiOperation({ summary: 'Get authenticated user wishlist' })
  @ApiResponse({ status: 200, description: 'Wishlist retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getWishlist(@CurrentUser() user) {
    return this.wishlistService.getWishlist(user.userId);
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Add product to wishlist' })
  @ApiResponse({ status: 201, description: 'Product added to wishlist' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Product already in wishlist' })
  addToWishlist(@CurrentUser() user, @Body(addToWishlistPipe) dto) {
    return this.wishlistService.addToWishlist(user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove item from wishlist' })
  @ApiParam({ name: 'id', description: 'Wishlist item UUID' })
  @ApiResponse({ status: 200, description: 'Item removed from wishlist' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Wishlist item not found' })
  removeFromWishlist(@CurrentUser() user, @Param('id') id) {
    return this.wishlistService.removeFromWishlist(user.userId, id);
  }
}
