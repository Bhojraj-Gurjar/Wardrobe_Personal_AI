import {
  Inject,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
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
import { OrdersService } from '../services/orders.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { QueryOrdersDto } from '../dto/query-orders.dto';

const createOrderPipe = DtoValidationPipe(CreateOrderDto);
const queryOrdersPipe = DtoValidationPipe(QueryOrdersDto);

export @ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
class OrdersController {
  constructor(@Inject(OrdersService) ordersService) {
    this.ordersService = ordersService;
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@CurrentUser() user, @Body(createOrderPipe) dto) {
    return this.ordersService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List authenticated user orders' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@CurrentUser() user, @Query(queryOrdersPipe) query) {
    return this.ordersService.findAll(user.userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by id' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(@CurrentUser() user, @Param('id') id) {
    return this.ordersService.findOne(user.userId, id);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Order cannot be cancelled' })
  cancel(@CurrentUser() user, @Param('id') id) {
    return this.ordersService.cancel(user.userId, id);
  }
}
