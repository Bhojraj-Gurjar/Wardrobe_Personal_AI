import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Query,
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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { map } from 'rxjs/operators';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { DtoValidationPipe } from '../../../common/pipes/dto-validation.pipe';
import { SupportService } from '../services/support.service';
import { SupportEventService } from '../services/support-event.service';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { QueryTicketsDto } from '../dto/query-tickets.dto';
import { CreateMessageDto } from '../dto/create-message.dto';
import { MAX_ATTACHMENT_BYTES, MAX_ATTACHMENTS_PER_TICKET } from '../validators/support.constants';

const createTicketPipe = DtoValidationPipe(CreateTicketDto);
const queryTicketsPipe = DtoValidationPipe(QueryTicketsDto);
const createMessagePipe = DtoValidationPipe(CreateMessageDto);

const ticketUploadInterceptor = FilesInterceptor('attachments', MAX_ATTACHMENTS_PER_TICKET, {
  storage: memoryStorage(),
  limits: { fileSize: MAX_ATTACHMENT_BYTES },
});

export @ApiTags('support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('support')
class SupportController {
  constructor(
    @Inject(SupportService) supportService,
    @Inject(SupportEventService) supportEventService,
  ) {
    this.supportService = supportService;
    this.supportEventService = supportEventService;
  }

  @Post('tickets')
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a support ticket' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(ticketUploadInterceptor)
  create(
    @CurrentUser() user,
    @Body(createTicketPipe) dto,
    @UploadedFiles() files,
  ) {
    return this.supportService.createTicket(user.userId, dto, files || []);
  }

  @Get('tickets')
  @ApiOperation({ summary: 'List user support tickets' })
  findAll(@CurrentUser() user, @Query(queryTicketsPipe) query) {
    return this.supportService.findUserTickets(user.userId, query);
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get support ticket details' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  findOne(@CurrentUser() user, @Param('id') id) {
    return this.supportService.findUserTicket(user.userId, id);
  }

  @Post('tickets/:id/messages')
  @HttpCode(201)
  @ApiOperation({ summary: 'Reply to a support ticket' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(ticketUploadInterceptor)
  reply(
    @CurrentUser() user,
    @Param('id') id,
    @Body(createMessagePipe) dto,
    @UploadedFiles() files,
  ) {
    return this.supportService.addUserReply(user.userId, id, dto, files || []);
  }

  @Post('tickets/:id/close')
  @HttpCode(200)
  @ApiOperation({ summary: 'Close a support ticket' })
  close(@CurrentUser() user, @Param('id') id) {
    return this.supportService.closeUserTicket(user.userId, id);
  }

  @Post('tickets/:id/reopen')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reopen a support ticket' })
  reopen(@CurrentUser() user, @Param('id') id) {
    return this.supportService.reopenUserTicket(user.userId, id);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'List support notifications' })
  getNotifications(@CurrentUser() user, @Query() query) {
    return this.supportService.getNotifications(user.userId, query);
  }

  @Patch('notifications/read')
  @ApiOperation({ summary: 'Mark support notifications as read' })
  markNotificationsRead(@CurrentUser() user, @Body('ids') ids) {
    return this.supportService.markNotificationsRead(user.userId, ids);
  }

  @Sse('events')
  @ApiOperation({ summary: 'Subscribe to support real-time events (SSE)' })
  streamEvents(@CurrentUser() user) {
    return this.supportEventService.getUserStream(user.userId).pipe(
      map((event) => ({ data: event })),
    );
  }
}
