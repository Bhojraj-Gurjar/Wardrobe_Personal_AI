import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { USER_ROLE } from '../../../common/constants/user-role';
import { StoragePathResolver } from '../../../storage/services/storage-path-resolver.service';
import { StorageService } from '../../../storage/services/storage.service';
import { SupportRepository } from '../repositories/support.repository';
import { SupportEventService } from './support-event.service';
import { canUserCloseTicket, canUserReopenTicket } from '../utils/support-status.util';
import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  MAX_ATTACHMENTS_PER_TICKET,
  MAX_ATTACHMENT_BYTES,
  SUPPORT_ATTACHMENT_TYPE,
  SUPPORT_EVENTS,
  SUPPORT_MESSAGE_AUTHOR_TYPE,
  SUPPORT_NOTIFICATION_TYPE,
  SUPPORT_TICKET_STATUS,
} from '../validators/support.constants';

export @Injectable()
class SupportService {
  constructor(
    @Inject(SupportRepository) supportRepository,
    @Inject(StorageService) storageService,
    @Inject(StoragePathResolver) storagePathResolver,
    @Inject(SupportEventService) supportEventService,
  ) {
    this.supportRepository = supportRepository;
    this.storageService = storageService;
    this.storagePathResolver = storagePathResolver;
    this.supportEventService = supportEventService;
  }

  async createTicket(userId, dto, files = []) {
    const normalizedDto = this.normalizeCreateDto(dto);
    const duplicate = await this.supportRepository.findDuplicateSubmission(
      userId,
      normalizedDto.subject,
      normalizedDto.description,
    );

    if (duplicate) {
      throw new BadRequestException(
        `A similar ticket (${duplicate.ticket_number}) was recently submitted. Please wait before submitting again.`,
      );
    }

    this.validateFiles(files);

    const ticket = await this.supportRepository.createTicket(userId, normalizedDto);

    if (files.length) {
      await this.processAttachments({
        ticketId: ticket.id,
        messageId: null,
        uploadedById: userId,
        files,
      });
    }

    const fullTicket = await this.supportRepository.findUserTicketById(userId, ticket.id);

    this.supportEventService.emit(SUPPORT_EVENTS.TICKET_CREATED, {
      ticketId: ticket.id,
      ticketNumber: ticket.ticket_number,
      userId,
    });

    await this.notifyAdminsNewTicket(fullTicket);

    return this.formatTicket(fullTicket);
  }

  async findUserTickets(userId, query) {
    const [tickets, total] = await this.supportRepository.findUserTickets(userId, query);

    return {
      items: tickets.map((ticket) => this.formatTicketSummary(ticket)),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }

  async findUserTicket(userId, ticketId) {
    const ticket = await this.supportRepository.findUserTicketById(userId, ticketId);

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    await this.supportRepository.markMessagesRead(ticketId, USER_ROLE.USER);

    return this.formatTicket(ticket);
  }

  async addUserReply(userId, ticketId, dto, files = []) {
    const ticket = await this.supportRepository.findUserTicketById(userId, ticketId);

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    if ([SUPPORT_TICKET_STATUS.CLOSED, SUPPORT_TICKET_STATUS.CANCELLED].includes(ticket.status)) {
      throw new BadRequestException('Cannot reply to a closed or cancelled ticket');
    }

    await this.validateTicketAttachmentLimit(ticketId, files);

    const message = await this.supportRepository.addMessage({
      ticketId,
      authorId: userId,
      authorType: SUPPORT_MESSAGE_AUTHOR_TYPE.USER,
      body: dto.body,
    });

    if (files.length) {
      await this.processAttachments({
        ticketId,
        messageId: message.id,
        uploadedById: userId,
        files,
      });
    }

    if (ticket.status === SUPPORT_TICKET_STATUS.WAITING_FOR_CUSTOMER) {
      await this.supportRepository.updateTicket(
        ticketId,
        { status: SUPPORT_TICKET_STATUS.IN_PROGRESS },
        userId,
      );
    }

    await this.notifyAdminsUserReplied(ticket);

    const updated = await this.supportRepository.findUserTicketById(userId, ticketId);

    this.supportEventService.emit(SUPPORT_EVENTS.MESSAGE_CREATED, {
      ticketId,
      userId: ticket.user_id,
      messageId: message.id,
      authorType: SUPPORT_MESSAGE_AUTHOR_TYPE.USER,
    });

    return this.formatTicket(updated);
  }

  async closeUserTicket(userId, ticketId) {
    const ticket = await this.supportRepository.findUserTicketById(userId, ticketId);

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    if (!canUserCloseTicket(ticket.status)) {
      throw new BadRequestException('Ticket cannot be closed in its current status');
    }

    const updated = await this.supportRepository.updateTicket(
      ticketId,
      { status: SUPPORT_TICKET_STATUS.CLOSED },
      userId,
    );

    await this.supportRepository.createNotification({
      userId,
      ticketId,
      type: SUPPORT_NOTIFICATION_TYPE.CLOSED,
      title: 'Ticket closed',
      body: `Ticket ${ticket.ticket_number} has been closed.`,
    });

    this.supportEventService.emit(SUPPORT_EVENTS.TICKET_UPDATED, {
      ticketId,
      userId,
      status: SUPPORT_TICKET_STATUS.CLOSED,
    });

    return this.formatTicket(updated);
  }

  async reopenUserTicket(userId, ticketId) {
    const ticket = await this.supportRepository.findUserTicketById(userId, ticketId);

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    if (!canUserReopenTicket(ticket.status)) {
      throw new BadRequestException('Ticket cannot be reopened in its current status');
    }

    const updated = await this.supportRepository.updateTicket(
      ticketId,
      { status: SUPPORT_TICKET_STATUS.REOPENED },
      userId,
    );

    await this.supportRepository.createNotification({
      userId,
      ticketId,
      type: SUPPORT_NOTIFICATION_TYPE.REOPENED,
      title: 'Ticket reopened',
      body: `Ticket ${ticket.ticket_number} has been reopened.`,
    });

    this.supportEventService.emit(SUPPORT_EVENTS.TICKET_UPDATED, {
      ticketId,
      userId,
      status: SUPPORT_TICKET_STATUS.REOPENED,
    });

    return this.formatTicket(updated);
  }

  async findAdminTickets(query) {
    const [tickets, total] = await this.supportRepository.findAllTickets(query);

    return {
      items: tickets.map((ticket) => this.formatTicketSummary(ticket, { isAdmin: true })),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }

  async findAdminTicket(ticketId) {
    const ticket = await this.supportRepository.findTicketById(ticketId);

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    await this.supportRepository.markMessagesRead(ticketId, USER_ROLE.ADMIN);

    return this.formatTicket(ticket, { isAdmin: true });
  }

  async updateAdminTicket(adminId, ticketId, dto) {
    const ticket = await this.supportRepository.findTicketById(ticketId);

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    if (dto.assigned_to_id) {
      const admins = await this.supportRepository.findAdminUsers();
      const isValidAssignee = admins.some((admin) => admin.id === dto.assigned_to_id);

      if (!isValidAssignee) {
        throw new BadRequestException('Assignee must be an active admin user');
      }
    }

    const updated = await this.supportRepository.updateTicket(ticketId, dto, adminId);

    if (dto.status) {
      const notificationType = this.resolveStatusNotificationType(dto.status);

      await this.supportRepository.createNotification({
        userId: ticket.user_id,
        ticketId,
        type: notificationType,
        title: 'Ticket status updated',
        body: `Ticket ${ticket.ticket_number} is now ${dto.status.replace(/_/g, ' ').toLowerCase()}.`,
      });
    }

    if (dto.assigned_to_id) {
      await this.supportRepository.createNotification({
        userId: dto.assigned_to_id,
        ticketId,
        type: SUPPORT_NOTIFICATION_TYPE.ASSIGNED,
        title: 'Ticket assigned',
        body: `Ticket ${ticket.ticket_number} has been assigned to you.`,
      });
    }

    this.supportEventService.emit(SUPPORT_EVENTS.TICKET_UPDATED, {
      ticketId,
      userId: ticket.user_id,
      status: dto.status,
    });

    return this.formatTicket(updated, { isAdmin: true });
  }

  async addAdminReply(adminId, ticketId, dto, files = []) {
    const ticket = await this.supportRepository.findTicketById(ticketId);

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    if (dto.is_internal && this.parseBoolean(dto.is_internal) === true && !dto.body?.trim()) {
      throw new BadRequestException('Internal note body is required');
    }

    await this.validateTicketAttachmentLimit(ticketId, files);

    const message = await this.supportRepository.addMessage({
      ticketId,
      authorId: adminId,
      authorType: SUPPORT_MESSAGE_AUTHOR_TYPE.ADMIN,
      body: dto.body,
      isInternal: this.parseBoolean(dto.is_internal) === true,
    });

    if (files.length) {
      await this.processAttachments({
        ticketId,
        messageId: message.id,
        uploadedById: adminId,
        files,
      });
    }

    if (!this.parseBoolean(dto.is_internal)) {
      await this.supportRepository.createNotification({
        userId: ticket.user_id,
        ticketId,
        type: SUPPORT_NOTIFICATION_TYPE.ADMIN_REPLIED,
        title: 'Support replied',
        body: `New reply on ticket ${ticket.ticket_number}`,
      });

      if (ticket.status === SUPPORT_TICKET_STATUS.OPEN || ticket.status === SUPPORT_TICKET_STATUS.REOPENED) {
        await this.supportRepository.updateTicket(
          ticketId,
          { status: SUPPORT_TICKET_STATUS.WAITING_FOR_CUSTOMER },
          adminId,
        );
      }
    }

    const updated = await this.supportRepository.findTicketById(ticketId);

    this.supportEventService.emit(SUPPORT_EVENTS.MESSAGE_CREATED, {
      ticketId,
      userId: ticket.user_id,
      messageId: message.id,
      authorType: SUPPORT_MESSAGE_AUTHOR_TYPE.ADMIN,
      isInternal: this.parseBoolean(dto.is_internal) === true,
    });

    return this.formatTicket(updated, { isAdmin: true });
  }

  async deleteAdminTicket(adminId, ticketId) {
    const ticket = await this.supportRepository.findTicketById(ticketId);

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    await this.supportRepository.softDeleteTicket(ticketId, adminId);

    this.supportEventService.emit(SUPPORT_EVENTS.TICKET_UPDATED, {
      ticketId,
      userId: ticket.user_id,
      deleted: true,
    });

    return { success: true };
  }

  getAnalytics() {
    return this.supportRepository.getAnalytics();
  }

  async getNotifications(userId, query) {
    const [items, total, unreadCount] = await this.supportRepository.findUserNotifications(
      userId,
      query,
    );

    return {
      items: items.map((item) => this.formatNotification(item)),
      unreadCount,
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 20,
        totalPages: Math.ceil(total / (query.limit || 20)) || 1,
      },
    };
  }

  markNotificationsRead(userId, notificationIds) {
    if (!Array.isArray(notificationIds) || !notificationIds.length) {
      throw new BadRequestException('Notification ids are required');
    }

    return this.supportRepository.markNotificationsRead(userId, notificationIds);
  }

  async exportTicketsCsv(query) {
    const tickets = await this.supportRepository.exportTickets(query);

    const header = [
      'Ticket Number',
      'Subject',
      'Category',
      'Priority',
      'Status',
      'Customer Email',
      'Customer Name',
      'Assigned To',
      'Created At',
      'Updated At',
    ].join(',');

    const rows = tickets.map((ticket) => {
      const values = [
        this.escapeCsv(ticket.ticket_number),
        this.escapeCsv(ticket.subject),
        this.escapeCsv(ticket.category),
        this.escapeCsv(ticket.priority),
        this.escapeCsv(ticket.status),
        this.escapeCsv(ticket.user?.email || ''),
        this.escapeCsv(ticket.user?.profile?.name || ''),
        this.escapeCsv(ticket.assigned_to?.email || ''),
        this.escapeCsv(ticket.created_at.toISOString()),
        this.escapeCsv(ticket.updated_at.toISOString()),
      ];

      return values.join(',');
    });

    return `${header}\n${rows.join('\n')}`;
  }

  getAssignees() {
    return this.supportRepository.findAdminUsers();
  }

  normalizeCreateDto(dto) {
    return {
      ...dto,
      ai_feature_related: this.parseBoolean(dto.ai_feature_related),
    };
  }

  parseBoolean(value) {
    if (typeof value === 'boolean') {
      return value;
    }

    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    return value ?? null;
  }

  validateFiles(files) {
    if (!files?.length) {
      return;
    }

    if (files.length > MAX_ATTACHMENTS_PER_TICKET) {
      throw new BadRequestException(`Maximum ${MAX_ATTACHMENTS_PER_TICKET} attachments allowed`);
    }

    for (const file of files) {
      if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(file.mimetype)) {
        throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
      }

      if (file.size > MAX_ATTACHMENT_BYTES) {
        throw new BadRequestException('Attachment exceeds maximum size of 10MB');
      }
    }
  }

  async validateTicketAttachmentLimit(ticketId, files = []) {
    if (!files?.length) {
      return;
    }

    this.validateFiles(files);

    const existingCount = await this.supportRepository.countAttachments(ticketId);

    if (existingCount + files.length > MAX_ATTACHMENTS_PER_TICKET) {
      throw new BadRequestException(
        `This ticket already has ${existingCount} attachment(s). Maximum ${MAX_ATTACHMENTS_PER_TICKET} per ticket.`,
      );
    }
  }

  async processAttachments({ ticketId, messageId, uploadedById, files }) {
    const attachments = [];

    for (const file of files) {
      const fileId = randomUUID();
      const attachmentType = file.mimetype.startsWith('image/')
        ? SUPPORT_ATTACHMENT_TYPE.SCREENSHOT
        : SUPPORT_ATTACHMENT_TYPE.FILE;

      const result = await this.storageService.uploadSupportAttachment({
        ticketId,
        fileId,
        buffer: file.buffer,
        mimeType: file.mimetype,
      });

      attachments.push({
        fileName: file.originalname || `${fileId}`,
        mimeType: file.mimetype,
        fileSize: file.size,
        storagePath: result.storagePath,
        publicUrl: this.storagePathResolver.toPublicUrl(result.storagePath),
        attachmentType,
      });
    }

    await this.supportRepository.createAttachments(
      ticketId,
      messageId,
      uploadedById,
      attachments,
    );
  }

  async notifyAdminsNewTicket(ticket) {
    const admins = await this.supportRepository.findAdminUsers();

    await Promise.all(
      admins.map((admin) => this.supportRepository.createNotification({
        userId: admin.id,
        ticketId: ticket.id,
        type: SUPPORT_NOTIFICATION_TYPE.TICKET_CREATED,
        title: 'New support ticket',
        body: `${ticket.ticket_number}: ${ticket.subject}`,
      })),
    );
  }

  async notifyAdminsUserReplied(ticket) {
    const admins = await this.supportRepository.findAdminUsers();
    const recipients = ticket.assigned_to_id
      ? admins.filter((admin) => admin.id === ticket.assigned_to_id)
      : admins;

    await Promise.all(
      recipients.map((admin) => this.supportRepository.createNotification({
        userId: admin.id,
        ticketId: ticket.id,
        type: SUPPORT_NOTIFICATION_TYPE.USER_REPLIED,
        title: 'Customer replied',
        body: `New reply on ticket ${ticket.ticket_number}`,
      })),
    );
  }

  resolveStatusNotificationType(status) {
    const map = {
      [SUPPORT_TICKET_STATUS.RESOLVED]: SUPPORT_NOTIFICATION_TYPE.RESOLVED,
      [SUPPORT_TICKET_STATUS.CLOSED]: SUPPORT_NOTIFICATION_TYPE.CLOSED,
      [SUPPORT_TICKET_STATUS.REOPENED]: SUPPORT_NOTIFICATION_TYPE.REOPENED,
      [SUPPORT_TICKET_STATUS.ESCALATED]: SUPPORT_NOTIFICATION_TYPE.ESCALATED,
    };

    return map[status] || SUPPORT_NOTIFICATION_TYPE.STATUS_CHANGED;
  }

  formatUser(user) {
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.profile?.name || null,
      role: user.role || null,
    };
  }

  formatAttachment(attachment) {
    return {
      id: attachment.id,
      fileName: attachment.file_name,
      mimeType: attachment.mime_type,
      fileSize: attachment.file_size,
      publicUrl: attachment.public_url,
      attachmentType: attachment.attachment_type,
      createdAt: attachment.created_at,
    };
  }

  formatMessage(message, { isAdmin = false } = {}) {
    if (!isAdmin && message.is_internal) {
      return null;
    }

    return {
      id: message.id,
      body: message.body,
      authorType: message.author_type,
      isInternal: message.is_internal,
      isRead: message.is_read,
      readAt: message.read_at,
      createdAt: message.created_at,
      author: this.formatUser(message.author),
      attachments: (message.attachments || []).map((item) => this.formatAttachment(item)),
    };
  }

  formatActivity(activity) {
    return {
      id: activity.id,
      activityType: activity.activity_type,
      oldValue: activity.old_value,
      newValue: activity.new_value,
      metadata: activity.metadata,
      createdAt: activity.created_at,
      actor: this.formatUser(activity.actor),
    };
  }

  formatTicketSummary(ticket, { isAdmin = false } = {}) {
    const lastMessage = ticket.messages?.[0];
    const unreadCount = ticket._count?.messages || 0;

    return {
      id: ticket.id,
      ticketNumber: ticket.ticket_number,
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      dueDate: ticket.due_date,
      firstResponseAt: ticket.first_response_at,
      resolvedAt: ticket.resolved_at,
      assignedTo: this.formatUser(ticket.assigned_to),
      unreadCount,
      lastReply: lastMessage
        ? {
          body: lastMessage.body,
          authorType: lastMessage.author_type,
          createdAt: lastMessage.created_at,
        }
        : null,
      ...(isAdmin ? { customer: this.formatUser(ticket.user) } : {}),
    };
  }

  formatTicket(ticket, { isAdmin = false } = {}) {
    const messages = (ticket.messages || [])
      .map((message) => this.formatMessage(message, { isAdmin }))
      .filter(Boolean);

    return {
      ...this.formatTicketSummary(ticket, { isAdmin }),
      description: ticket.description,
      contactMethod: ticket.contact_method,
      callbackNumber: ticket.callback_number,
      orderReference: ticket.order_reference,
      productReference: ticket.product_reference,
      aiFeatureRelated: ticket.ai_feature_related,
      diagnostics: {
        browser: ticket.browser_info,
        device: ticket.device_info,
        os: ticket.os_info,
        appVersion: ticket.app_version,
        timezone: ticket.timezone,
        pageUrl: ticket.page_url,
      },
      messages,
      attachments: (ticket.attachments || []).map((item) => this.formatAttachment(item)),
      activities: (ticket.activities || []).map((item) => this.formatActivity(item)),
      ...(isAdmin ? { customer: this.formatUser(ticket.user) } : {}),
    };
  }

  formatNotification(notification) {
    return {
      id: notification.id,
      type: notification.notification_type,
      title: notification.title,
      body: notification.body,
      isRead: notification.is_read,
      readAt: notification.read_at,
      createdAt: notification.created_at,
      ticket: notification.ticket
        ? {
          id: notification.ticket.id,
          ticketNumber: notification.ticket.ticket_number,
          subject: notification.ticket.subject,
          status: notification.ticket.status,
        }
        : null,
    };
  }

  escapeCsv(value) {
    const stringValue = String(value ?? '');

    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  assertTicketOwnership(ticket, userId) {
    if (ticket.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }
  }
}
