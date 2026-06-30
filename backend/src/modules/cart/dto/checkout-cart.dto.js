import { IsEnum, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PAYMENT_METHOD_VALUES } from '../../orders/validators/order.constants';

export class CheckoutCartDto {
  @ApiPropertyOptional({ example: 'WELCOME10' })
  @IsOptional()
  @IsString()
  coupon_code;

  @ApiPropertyOptional({ enum: PAYMENT_METHOD_VALUES, example: 'COD' })
  @IsOptional()
  @IsEnum(PAYMENT_METHOD_VALUES)
  payment_method;

  @ApiPropertyOptional({ description: 'Saved address id' })
  @IsOptional()
  @IsUUID()
  address_id;

  @ApiPropertyOptional({ description: 'Inline shipping address when not using saved address' })
  @IsOptional()
  @IsObject()
  shipping_address;

  @ApiPropertyOptional({ description: 'Billing address (defaults to shipping)' })
  @IsOptional()
  @IsObject()
  billing_address;

  @ApiPropertyOptional({ description: 'Payment gateway reference — future Razorpay/Stripe' })
  @IsOptional()
  @IsString()
  payment_reference;
}
