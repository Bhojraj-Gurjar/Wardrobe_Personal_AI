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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { DtoValidationPipe } from '../../../common/pipes/dto-validation.pipe';
import { CartService } from '../services/cart.service';
import { AddCartItemDto } from '../dto/add-cart-item.dto';
import { UpdateCartItemDto } from '../dto/update-cart-item.dto';
import { CheckoutCartDto } from '../dto/checkout-cart.dto';

const addCartItemPipe = DtoValidationPipe(AddCartItemDto);
const updateCartItemPipe = DtoValidationPipe(UpdateCartItemDto);
const checkoutCartPipe = DtoValidationPipe(CheckoutCartDto);

export @ApiTags('cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
class CartController {
  constructor(@Inject(CartService) cartService) {
    this.cartService = cartService;
  }

  @Get()
  @ApiOperation({ summary: 'Get authenticated user cart' })
  getCart(@CurrentUser() user, @Query('coupon') coupon) {
    return this.cartService.getCart(user.userId, coupon || null);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add product to cart' })
  addItem(@CurrentUser() user, @Body(addCartItemPipe) dto) {
    return this.cartService.addItem(user.userId, dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  updateItem(
    @CurrentUser() user,
    @Param('id') id,
    @Body(updateCartItemPipe) dto,
  ) {
    return this.cartService.updateQuantity(user.userId, id, dto.quantity);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove cart item' })
  removeItem(@CurrentUser() user, @Param('id') id) {
    return this.cartService.removeItem(user.userId, id);
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Checkout cart and create orders' })
  checkout(@CurrentUser() user, @Body(checkoutCartPipe) dto) {
    return this.cartService.checkout(user.userId, dto);
  }
}
