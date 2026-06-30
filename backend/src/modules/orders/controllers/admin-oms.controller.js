import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { map } from 'rxjs/operators';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { AdminRoleGuard } from '../../../guards/admin-role.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { OrderOmsService } from '../services/order-oms.service';
import { OrderEventService } from '../services/order-event.service';
import { OrdersService } from '../services/orders.service';
import { OrdersRepository } from '../repositories/orders.repository';

const adminGuards = [JwtAuthGuard, AdminRoleGuard];

export @ApiTags('admin-oms')
@ApiBearerAuth()
@UseGuards(...adminGuards)
@Controller('admin/orders')
class AdminOmsController {
  constructor(
    @Inject(OrderOmsService) orderOmsService,
    @Inject(OrderEventService) orderEventService,
    @Inject(OrdersService) ordersService,
    @Inject(OrdersRepository) ordersRepository,
  ) {
    this.orderOmsService = orderOmsService;
    this.orderEventService = orderEventService;
    this.ordersService = ordersService;
    this.ordersRepository = ordersRepository;
  }

  @Get('oms/summary')
  @ApiOperation({ summary: 'OMS analytics summary' })
  getOmsSummary() {
    return this.orderOmsService.getOmsSummary();
  }

  @Sse('oms/events')
  @ApiOperation({ summary: 'Subscribe to order real-time events (admin SSE)' })
  streamEvents() {
    return this.orderEventService.getAdminStream().pipe(
      map((event) => ({ data: event })),
    );
  }

  @Post('bulk/accept')
  @ApiOperation({ summary: 'Bulk accept orders with auto invoice and label generation' })
  bulkAccept(@CurrentUser() admin, @Body('orderIds') orderIds) {
    return this.orderOmsService.bulkAcceptOrders(orderIds, admin.userId);
  }

  @Post(':id/accept')
  accept(@CurrentUser() admin, @Param('id') id, @Body('notes') notes) {
    return this.orderOmsService.acceptOrder(id, admin.userId, notes);
  }

  @Post(':id/hold')
  hold(@CurrentUser() admin, @Param('id') id, @Body('notes') notes) {
    return this.orderOmsService.holdOrder(id, admin.userId, notes);
  }

  @Post(':id/generate-invoice')
  generateInvoice(
    @CurrentUser() admin,
    @Param('id') id,
    @Body('regenerate') regenerate,
  ) {
    return this.orderOmsService.generateInvoice(id, admin.userId, Boolean(regenerate));
  }

  @Post(':id/generate-label')
  generateLabel(
    @CurrentUser() admin,
    @Param('id') id,
    @Body('regenerate') regenerate,
  ) {
    return this.orderOmsService.generateLabel(id, admin.userId, Boolean(regenerate));
  }

  @Post(':id/move-to-packing')
  moveToPacking(@CurrentUser() admin, @Param('id') id) {
    return this.orderOmsService.moveToPacking(id, admin.userId);
  }

  @Patch(':id/packing-checklist')
  updatePackingChecklist(@CurrentUser() admin, @Param('id') id, @Body() checklist) {
    return this.orderOmsService.updatePackingChecklist(id, admin.userId, checklist);
  }

  @Post(':id/mark-packed')
  markPacked(@CurrentUser() admin, @Param('id') id, @Body('notes') notes) {
    return this.orderOmsService.markPacked(id, admin.userId, notes);
  }

  @Post(':id/quick-mark-rtd')
  @ApiOperation({ summary: 'Advance accepted order through packing to RTD' })
  quickMarkRtd(@CurrentUser() admin, @Param('id') id) {
    return this.orderOmsService.quickMarkRtd(id, admin.userId);
  }

  @Post(':id/mark-rtd')
  markRtd(@CurrentUser() admin, @Param('id') id, @Body() payload) {
    return this.orderOmsService.markRtd(id, admin.userId, payload);
  }

  @Post(':id/dispatch')
  @ApiOperation({ summary: 'Dispatch order — move directly to in transit' })
  dispatch(@CurrentUser() admin, @Param('id') id, @Body() payload) {
    return this.orderOmsService.dispatchOrder(id, admin.userId, payload);
  }

  @Post(':id/mark-handover')
  markHandover(@CurrentUser() admin, @Param('id') id, @Body() payload) {
    return this.orderOmsService.markHandover(id, admin.userId, payload);
  }

  @Post(':id/mark-shipped')
  markShipped(@CurrentUser() admin, @Param('id') id, @Body() payload) {
    return this.orderOmsService.markShipped(id, admin.userId, payload);
  }

  @Post(':id/mark-delivered')
  markDelivered(@CurrentUser() admin, @Param('id') id, @Body('notes') notes) {
    return this.orderOmsService.markDelivered(id, admin.userId, notes);
  }

  @Post(':id/mark-completed')
  markCompleted(@CurrentUser() admin, @Param('id') id) {
    return this.orderOmsService.markCompleted(id, admin.userId);
  }

  @Post(':id/notes')
  addNote(@CurrentUser() admin, @Param('id') id, @Body('note') note) {
    return this.orderOmsService.addInternalNote(id, admin.userId, note);
  }

  @Get(':id/timeline')
  async getTimeline(@Param('id') id) {
    const order = await this.ordersRepository.findById(id);
    return { items: order?.timeline || [] };
  }
}
