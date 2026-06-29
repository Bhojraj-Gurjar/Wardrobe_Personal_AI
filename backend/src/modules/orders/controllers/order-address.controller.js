import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { DtoValidationPipe } from '../../../common/pipes/dto-validation.pipe';
import { OrderAddressService } from '../services/order-address.service';
import { CreateAddressDto, UpdateAddressDto } from '../dto/address.dto';

const createAddressPipe = DtoValidationPipe(CreateAddressDto);
const updateAddressPipe = DtoValidationPipe(UpdateAddressDto);

export @ApiTags('addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('addresses')
class OrderAddressController {
  constructor(@Inject(OrderAddressService) orderAddressService) {
    this.orderAddressService = orderAddressService;
  }

  @Get()
  @ApiOperation({ summary: 'List saved shipping addresses' })
  list(@CurrentUser() user) {
    return this.orderAddressService.list(user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create shipping address' })
  create(@CurrentUser() user, @Body(createAddressPipe) dto) {
    return this.orderAddressService.create(user.userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update shipping address' })
  update(@CurrentUser() user, @Param('id') id, @Body(updateAddressPipe) dto) {
    return this.orderAddressService.update(user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete shipping address' })
  remove(@CurrentUser() user, @Param('id') id) {
    return this.orderAddressService.remove(user.userId, id);
  }
}
