import {
  Inject,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Sse,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { map } from 'rxjs/operators';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { DtoValidationPipe } from '../../../common/pipes/dto-validation.pipe';
import { OrdersService } from '../services/orders.service';
import { OrderEventService } from '../services/order-event.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { QueryOrdersDto } from '../dto/query-orders.dto';

const createOrderPipe = DtoValidationPipe(CreateOrderDto);
const queryOrdersPipe = DtoValidationPipe(QueryOrdersDto);

export @ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
class OrdersController {
  constructor(
    @Inject(OrdersService) ordersService,
    @Inject(OrderEventService) orderEventService,
  ) {
    this.ordersService = ordersService;
    this.orderEventService = orderEventService;
  }

  @Sse('events')
  @ApiOperation({ summary: 'Subscribe to order real-time events (SSE)' })
  streamEvents(@CurrentUser() user) {
    return this.orderEventService.getUserStream(user.userId).pipe(
      map((event) => ({ data: event })),
    );
  }

  @Get('notifications')
  @ApiOperation({ summary: 'List order notifications' })
  getNotifications(@CurrentUser() user, @Query('unreadOnly') unreadOnly) {
    return this.ordersService.getNotifications(user.userId, {
      unreadOnly: unreadOnly === 'true',
    });
  }

  @Patch('notifications/read')
  @ApiOperation({ summary: 'Mark order notifications as read' })
  markNotificationsRead(@CurrentUser() user, @Body('ids') ids) {
    return this.ordersService.markNotificationsRead(user.userId, ids);
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
