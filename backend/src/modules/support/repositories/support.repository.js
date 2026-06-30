import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { USER_ROLE } from '../../../common/constants/user-role';
import { generateNextTicketNumber } from '../utils/support-ticket-number.util';
import { resolveSortOrder, resolveStatusFilterValues } from '../utils/support-status.util';
import {
  DUPLICATE_SUBMISSION_WINDOW_MS,
  SLA_RESPONSE_HOURS,
  SUPPORT_ACTIVITY_TYPE,
  SUPPORT_MESSAGE_AUTHOR_TYPE,
  SUPPORT_NOTIFICATION_TYPE,
  SUPPORT_TICKET_STATUS,
} from '../validators/support.constants';

const TICKET_INCLUDE = {
  user: {
    select: {
      id: true,
      email: true,
      profile: { select: { name: true } },
    },
  },
  assigned_to: {
    select: {
      id: true,
      email: true,
      profile: { select: { name: true } },
    },
  },
  messages: {
    where: { is_internal: false },
    orderBy: { created_at: 'asc' },
    include: {
      author: {
        select: {
          id: true,
          email: true,
          role: true,
          profile: { select: { name: true } },
        },
      },
      attachments: true,
    },
  },
  attachments: {
    where: { message_id: null },
  },
  activities: {
    orderBy: { created_at: 'desc' },
    take: 50,
    include: {
      actor: {
        select: {
          id: true,
          email: true,
          profile: { select: { name: true } },
        },
      },
    },
  },
};

const TICKET_LIST_INCLUDE = {
  user: {
    select: {
      id: true,
      email: true,
      profile: { select: { name: true } },
    },
  },
  assigned_to: {
    select: {
      id: true,
      email: true,
      profile: { select: { name: true } },
    },
  },
  messages: {
    where: { is_internal: false },
    orderBy: { created_at: 'desc' },
    take: 1,
    select: {
      id: true,
      body: true,
      author_type: true,
      is_read: true,
      created_at: true,
    },
  },
  _count: {
    select: {
      messages: {
        where: {
          is_read: false,
          author_type: { not: SUPPORT_MESSAGE_AUTHOR_TYPE.USER },
          is_internal: false,
        },
      },
    },
  },
};

const ADMIN_TICKET_LIST_INCLUDE = {
  ...TICKET_LIST_INCLUDE,
  _count: {
    select: {
      messages: {
        where: {
          is_read: false,
          author_type: SUPPORT_MESSAGE_AUTHOR_TYPE.USER,
          is_internal: false,
        },
      },
    },
  },
};

const ADMIN_TICKET_INCLUDE = {
  ...TICKET_INCLUDE,
  messages: {
    orderBy: { created_at: 'asc' },
    include: {
      author: {
        select: {
          id: true,
          email: true,
          role: true,
          profile: { select: { name: true } },
        },
      },
      attachments: true,
    },
  },
};

function buildDateFilter(dateFrom, dateTo) {
  if (!dateFrom && !dateTo) {
    return undefined;
  }

  const filter = {};

  if (dateFrom) {
    filter.gte = new Date(dateFrom);
  }

  if (dateTo) {
    filter.lte = new Date(dateTo);
  }

  return filter;
}

function computeDueDate(priority) {
  const hours = SLA_RESPONSE_HOURS[priority] || SLA_RESPONSE_HOURS.MEDIUM;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export @Injectable()
class SupportRepository {
  constructor(@Inject(PrismaService) prisma) {
    this.prisma = prisma;
  }

  buildUserWhere(userId, query = {}) {
    const where = {
      user_id: userId,
      deleted_at: null,
    };

    const status = resolveStatusFilterValues(query.status);

    if (status) {
      where.status = status;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    const createdAt = buildDateFilter(query.dateFrom, query.dateTo);

    if (createdAt) {
      where.created_at = createdAt;
    }

    if (query.search) {
      const term = query.search.trim();

      where.OR = [
        { subject: { contains: term, mode: 'insensitive' } },
        { ticket_number: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  buildAdminWhere(query = {}) {
    const where = { deleted_at: null };
    const status = resolveStatusFilterValues(query.status);

    if (status) {
      where.status = status;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    const createdAt = buildDateFilter(query.dateFrom, query.dateTo);

    if (createdAt) {
      where.created_at = createdAt;
    }

    if (query.search) {
      const term = query.search.trim();

      where.OR = [
        { subject: { contains: term, mode: 'insensitive' } },
        { ticket_number: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { user: { email: { contains: term, mode: 'insensitive' } } },
        { user: { profile: { name: { contains: term, mode: 'insensitive' } } } },
      ];
    }

    return where;
  }

  findDuplicateSubmission(userId, subject, description) {
    const since = new Date(Date.now() - DUPLICATE_SUBMISSION_WINDOW_MS);

    return this.prisma.supportTicket.findFirst({
      where: {
        user_id: userId,
        subject: { equals: subject, mode: 'insensitive' },
        description,
        created_at: { gte: since },
        deleted_at: null,
      },
      select: { id: true, ticket_number: true },
    });
  }

  async findUserTickets(userId, query) {
    const where = this.buildUserWhere(userId, query);
    const skip = (query.page - 1) * query.limit;
    const orderBy = resolveSortOrder(query.sortBy, query.sortOrder);

    return this.prisma.$transaction([
      this.prisma.supportTicket.findMany({
        where,
        include: TICKET_LIST_INCLUDE,
        orderBy,
        skip,
        take: query.limit,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);
  }

  async findAllTickets(query) {
    const where = this.buildAdminWhere(query);
    const skip = (query.page - 1) * query.limit;
    const orderBy = resolveSortOrder(query.sortBy, query.sortOrder);

    return this.prisma.$transaction([
      this.prisma.supportTicket.findMany({
        where,
        include: ADMIN_TICKET_LIST_INCLUDE,
        orderBy,
        skip,
        take: query.limit,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);
  }

  findUserTicketById(userId, ticketId) {
    return this.prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        user_id: userId,
        deleted_at: null,
      },
      include: TICKET_INCLUDE,
    });
  }

  findTicketById(ticketId) {
    return this.prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        deleted_at: null,
      },
      include: ADMIN_TICKET_INCLUDE,
    });
  }

  async createTicket(userId, dto) {
    const priority = dto.priority || 'MEDIUM';

    return this.prisma.$transaction(async (tx) => {
      const ticketNumber = await generateNextTicketNumber(tx);

      const ticket = await tx.supportTicket.create({
        data: {
          ticket_number: ticketNumber,
          user_id: userId,
          subject: dto.subject.trim(),
          description: dto.description.trim(),
          category: dto.category,
          priority,
          status: SUPPORT_TICKET_STATUS.OPEN,
          contact_method: dto.contact_method || null,
          callback_number: dto.callback_number || null,
          order_reference: dto.order_reference || null,
          product_reference: dto.product_reference || null,
          ai_feature_related: dto.ai_feature_related ?? null,
          browser_info: dto.browser_info || null,
          device_info: dto.device_info || null,
          os_info: dto.os_info || null,
          app_version: dto.app_version || null,
          timezone: dto.timezone || null,
          page_url: dto.page_url || null,
          due_date: computeDueDate(priority),
        },
        include: TICKET_INCLUDE,
      });

      await tx.supportActivity.create({
        data: {
          ticket_id: ticket.id,
          actor_id: userId,
          activity_type: SUPPORT_ACTIVITY_TYPE.CREATED,
          new_value: SUPPORT_TICKET_STATUS.OPEN,
        },
      });

      await tx.supportNotification.create({
        data: {
          user_id: userId,
          ticket_id: ticket.id,
          notification_type: SUPPORT_NOTIFICATION_TYPE.TICKET_CREATED,
          title: 'Ticket created',
          body: `Your support ticket ${ticketNumber} has been submitted.`,
        },
      });

      return ticket;
    });
  }

  countAttachments(ticketId) {
    return this.prisma.supportAttachment.count({
      where: { ticket_id: ticketId },
    });
  }

  createAttachments(ticketId, messageId, uploadedById, attachments) {
    if (!attachments.length) {
      return [];
    }

    return this.prisma.supportAttachment.createMany({
      data: attachments.map((attachment) => ({
        ticket_id: ticketId,
        message_id: messageId || null,
        file_name: attachment.fileName,
        mime_type: attachment.mimeType,
        file_size: attachment.fileSize,
        storage_path: attachment.storagePath,
        public_url: attachment.publicUrl,
        attachment_type: attachment.attachmentType,
        uploaded_by_id: uploadedById,
      })),
    });
  }

  async addMessage({
    ticketId,
    authorId,
    authorType,
    body,
    isInternal = false,
  }) {
    return this.prisma.$transaction(async (tx) => {
      const message = await tx.supportMessage.create({
        data: {
          ticket_id: ticketId,
          author_id: authorId,
          author_type: authorType,
          body: body.trim(),
          is_internal: isInternal,
        },
        include: {
          author: {
            select: {
              id: true,
              email: true,
              role: true,
              profile: { select: { name: true } },
            },
          },
          attachments: true,
        },
      });

      const activityType = isInternal
        ? SUPPORT_ACTIVITY_TYPE.INTERNAL_NOTE
        : SUPPORT_ACTIVITY_TYPE.REPLIED;

      await tx.supportActivity.create({
        data: {
          ticket_id: ticketId,
          actor_id: authorId,
          activity_type: activityType,
        },
      });

      if (
        authorType === SUPPORT_MESSAGE_AUTHOR_TYPE.ADMIN
        && !isInternal
      ) {
        const ticket = await tx.supportTicket.findUnique({
          where: { id: ticketId },
          select: { first_response_at: true },
        });

        if (!ticket?.first_response_at) {
          await tx.supportTicket.update({
            where: { id: ticketId },
            data: { first_response_at: new Date() },
          });
        }
      }

      return message;
    });
  }

  async updateTicket(ticketId, data, actorId) {
    const existing = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!existing) {
      return null;
    }

    const activities = [];

    if (data.status && data.status !== existing.status) {
      activities.push({
        ticket_id: ticketId,
        actor_id: actorId,
        activity_type: SUPPORT_ACTIVITY_TYPE.STATUS_CHANGED,
        old_value: existing.status,
        new_value: data.status,
      });
    }

    if (data.priority && data.priority !== existing.priority) {
      activities.push({
        ticket_id: ticketId,
        actor_id: actorId,
        activity_type: SUPPORT_ACTIVITY_TYPE.PRIORITY_CHANGED,
        old_value: existing.priority,
        new_value: data.priority,
      });
    }

    if (data.category && data.category !== existing.category) {
      activities.push({
        ticket_id: ticketId,
        actor_id: actorId,
        activity_type: SUPPORT_ACTIVITY_TYPE.CATEGORY_CHANGED,
        old_value: existing.category,
        new_value: data.category,
      });
    }

    const updateData = { ...data };

    if (data.status === SUPPORT_TICKET_STATUS.RESOLVED) {
      updateData.resolved_at = new Date();
    }

    if (data.priority) {
      updateData.due_date = computeDueDate(data.priority);
    }

    return this.prisma.$transaction(async (tx) => {
      if (data.assigned_to_id && data.assigned_to_id !== existing.assigned_to_id) {
        await tx.supportAssignment.updateMany({
          where: { ticket_id: ticketId, is_active: true },
          data: { is_active: false },
        });

        await tx.supportAssignment.create({
          data: {
            ticket_id: ticketId,
            assignee_id: data.assigned_to_id,
            assigned_by: actorId,
          },
        });

        activities.push({
          ticket_id: ticketId,
          actor_id: actorId,
          activity_type: SUPPORT_ACTIVITY_TYPE.ASSIGNED,
          new_value: data.assigned_to_id,
        });
      }

      const ticket = await tx.supportTicket.update({
        where: { id: ticketId },
        data: updateData,
        include: ADMIN_TICKET_INCLUDE,
      });

      if (activities.length) {
        await tx.supportActivity.createMany({ data: activities });
      }

      return ticket;
    });
  }

  softDeleteTicket(ticketId, actorId) {
    return this.prisma.$transaction(async (tx) => {
      await tx.supportActivity.create({
        data: {
          ticket_id: ticketId,
          actor_id: actorId,
          activity_type: SUPPORT_ACTIVITY_TYPE.DELETED,
        },
      });

      return tx.supportTicket.update({
        where: { id: ticketId },
        data: { deleted_at: new Date() },
        include: ADMIN_TICKET_INCLUDE,
      });
    });
  }

  markMessagesRead(ticketId, readerType) {
    const authorTypeToMark = readerType === USER_ROLE.ADMIN
      ? SUPPORT_MESSAGE_AUTHOR_TYPE.USER
      : SUPPORT_MESSAGE_AUTHOR_TYPE.ADMIN;

    return this.prisma.supportMessage.updateMany({
      where: {
        ticket_id: ticketId,
        author_type: authorTypeToMark,
        is_read: false,
        is_internal: false,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });
  }

  createNotification({ userId, ticketId, type, title, body, metadata }) {
    return this.prisma.supportNotification.create({
      data: {
        user_id: userId,
        ticket_id: ticketId,
        notification_type: type,
        title,
        body,
        metadata: metadata || null,
      },
    });
  }

  findAdminUsers() {
    return this.prisma.user.findMany({
      where: { role: USER_ROLE.ADMIN, status: 'ACTIVE' },
      select: {
        id: true,
        email: true,
        profile: { select: { name: true } },
      },
    });
  }

  async getAnalytics() {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const startOfMonth = new Date(now);
    startOfMonth.setMonth(now.getMonth() - 1);

    const baseWhere = { deleted_at: null };

    const [
      total,
      open,
      resolved,
      pending,
      critical,
      today,
      weekly,
      monthly,
      responseTimes,
    ] = await this.prisma.$transaction([
      this.prisma.supportTicket.count({ where: baseWhere }),
      this.prisma.supportTicket.count({
        where: {
          ...baseWhere,
          status: { in: [SUPPORT_TICKET_STATUS.OPEN, SUPPORT_TICKET_STATUS.REOPENED] },
        },
      }),
      this.prisma.supportTicket.count({
        where: { ...baseWhere, status: SUPPORT_TICKET_STATUS.RESOLVED },
      }),
      this.prisma.supportTicket.count({
        where: {
          ...baseWhere,
          status: {
            in: [
              SUPPORT_TICKET_STATUS.IN_PROGRESS,
              SUPPORT_TICKET_STATUS.WAITING_FOR_CUSTOMER,
            ],
          },
        },
      }),
      this.prisma.supportTicket.count({
        where: { ...baseWhere, priority: 'CRITICAL', status: { not: SUPPORT_TICKET_STATUS.CLOSED } },
      }),
      this.prisma.supportTicket.count({
        where: { ...baseWhere, created_at: { gte: startOfDay } },
      }),
      this.prisma.supportTicket.count({
        where: { ...baseWhere, created_at: { gte: startOfWeek } },
      }),
      this.prisma.supportTicket.count({
        where: { ...baseWhere, created_at: { gte: startOfMonth } },
      }),
      this.prisma.supportTicket.findMany({
        where: {
          ...baseWhere,
          first_response_at: { not: null },
        },
        select: {
          created_at: true,
          first_response_at: true,
        },
        take: 200,
        orderBy: { created_at: 'desc' },
      }),
    ]);

    let averageResponseTimeMs = null;

    if (responseTimes.length) {
      const totalMs = responseTimes.reduce((sum, ticket) => {
        return sum + (ticket.first_response_at.getTime() - ticket.created_at.getTime());
      }, 0);

      averageResponseTimeMs = Math.round(totalMs / responseTimes.length);
    }

    return {
      total,
      open,
      resolved,
      pending,
      critical,
      today,
      weekly,
      monthly,
      averageResponseTimeMs,
    };
  }

  findUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    const safePage = Math.max(Number.parseInt(String(page), 10) || 1, 1);
    const safeLimit = Math.min(Math.max(Number.parseInt(String(limit), 10) || 20, 1), 50);
    const where = { user_id: userId };

    if (unreadOnly) {
      where.is_read = false;
    }

    const skip = (safePage - 1) * safeLimit;

    return this.prisma.$transaction([
      this.prisma.supportNotification.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: safeLimit,
        include: {
          ticket: {
            select: {
              id: true,
              ticket_number: true,
              subject: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.supportNotification.count({ where }),
      this.prisma.supportNotification.count({
        where: { user_id: userId, is_read: false },
      }),
    ]);
  }

  markNotificationsRead(userId, notificationIds) {
    return this.prisma.supportNotification.updateMany({
      where: {
        user_id: userId,
        id: { in: notificationIds },
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });
  }

  exportTickets(query) {
    const where = this.buildAdminWhere(query);

    return this.prisma.supportTicket.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            profile: { select: { name: true } },
          },
        },
        assigned_to: {
          select: {
            email: true,
            profile: { select: { name: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 5000,
    });
  }
}
