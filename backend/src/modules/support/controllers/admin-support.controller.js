import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Res,
  Sse,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { map } from 'rxjs/operators';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { AdminRoleGuard } from '../../../guards/admin-role.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { DtoValidationPipe } from '../../../common/pipes/dto-validation.pipe';
import { SupportService } from '../services/support.service';
import { SupportEventService } from '../services/support-event.service';
import { QueryTicketsDto } from '../dto/query-tickets.dto';
import { CreateMessageDto } from '../dto/create-message.dto';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { MAX_ATTACHMENT_BYTES, MAX_ATTACHMENTS_PER_TICKET } from '../validators/support.constants';

const adminGuards = [JwtAuthGuard, AdminRoleGuard];
const queryTicketsPipe = DtoValidationPipe(QueryTicketsDto);
const createMessagePipe = DtoValidationPipe(CreateMessageDto);
const updateTicketPipe = DtoValidationPipe(UpdateTicketDto);

const ticketUploadInterceptor = FilesInterceptor('attachments', MAX_ATTACHMENTS_PER_TICKET, {
  storage: memoryStorage(),
  limits: { fileSize: MAX_ATTACHMENT_BYTES },
});

export @ApiTags('admin-support')
@Controller('admin/support')
class AdminSupportController {
  constructor(
    @Inject(SupportService) supportService,
    @Inject(SupportEventService) supportEventService,
  ) {
    this.supportService = supportService;
    this.supportEventService = supportEventService;
  }

  @Get('analytics')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Support ticket analytics' })
  getAnalytics() {
    return this.supportService.getAnalytics();
  }

  @Get('assignees')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List support assignees' })
  getAssignees() {
    return this.supportService.getAssignees();
  }

  @Get('tickets/export')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  @Header('Content-Type', 'text/csv')
  @ApiOperation({ summary: 'Export support tickets as CSV' })
  async exportTickets(@Query(queryTicketsPipe) query, @Res() res) {
    const csv = await this.supportService.exportTicketsCsv(query);
    res.setHeader('Content-Disposition', 'attachment; filename="support-tickets-export.csv"');
    res.send(csv);
  }

  @Get('tickets')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all support tickets' })
  findAll(@Query(queryTicketsPipe) query) {
    return this.supportService.findAdminTickets(query);
  }

  @Get('tickets/:id')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get support ticket details' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  findOne(@Param('id') id) {
    return this.supportService.findAdminTicket(id);
  }

  @Patch('tickets/:id')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update support ticket' })
  update(
    @CurrentUser() user,
    @Param('id') id,
    @Body(updateTicketPipe) dto,
  ) {
    return this.supportService.updateAdminTicket(user.userId, id, dto);
  }

  @Post('tickets/:id/messages')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: 'Reply to a support ticket (admin)' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(ticketUploadInterceptor)
  reply(
    @CurrentUser() user,
    @Param('id') id,
    @Body(createMessagePipe) dto,
    @UploadedFiles() files,
  ) {
    return this.supportService.addAdminReply(user.userId, id, dto, files || []);
  }

  @Delete('tickets/:id')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a support ticket' })
  delete(@CurrentUser() user, @Param('id') id) {
    return this.supportService.deleteAdminTicket(user.userId, id);
  }

  @Sse('events')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subscribe to admin support events (SSE)' })
  streamEvents() {
    return this.supportEventService.getAdminStream().pipe(
      map((event) => ({ data: event })),
    );
  }
}
