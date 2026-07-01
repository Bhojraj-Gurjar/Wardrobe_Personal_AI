import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { USER_ROLE } from '../../common/constants/user-role';

export @Injectable()
class NotificationsRepository {
  constructor(@Inject(PrismaService) prisma) {
    this.prisma = prisma;
  }

  createAppNotification(data) {
    return this.prisma.userNotification.create({ data });
  }

  createManyAppNotifications(data) {
    return this.prisma.userNotification.createMany({ data });
  }

  findAppNotifications(userId, { limit = 50, unreadOnly = false, category = null } = {}) {
    const where = { user_id: userId };

    if (unreadOnly) {
      where.is_read = false;
    }

    if (category && category !== 'ALL') {
      where.category = category;
    }

    return this.prisma.userNotification.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  countUnreadApp(userId) {
    return this.prisma.userNotification.count({
      where: { user_id: userId, is_read: false },
    });
  }

  markAppRead(userId, ids) {
    return this.prisma.userNotification.updateMany({
      where: {
        user_id: userId,
        id: { in: ids },
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });
  }

  markAllAppRead(userId) {
    return this.prisma.userNotification.updateMany({
      where: { user_id: userId, is_read: false },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });
  }

  findOrderNotifications(userId, { limit = 50, unreadOnly = false } = {}) {
    const where = { user_id: userId };

    if (unreadOnly) {
      where.is_read = false;
    }

    return this.prisma.orderNotification.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        order: {
          select: {
            id: true,
            order_number: true,
            status: true,
          },
        },
      },
    });
  }

  countUnreadOrders(userId) {
    return this.prisma.orderNotification.count({
      where: { user_id: userId, is_read: false },
    });
  }

  markOrdersRead(userId, ids) {
    return this.prisma.orderNotification.updateMany({
      where: {
        user_id: userId,
        id: { in: ids },
      },
      data: { is_read: true },
    });
  }

  markAllOrdersRead(userId) {
    return this.prisma.orderNotification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });
  }

  findSupportNotifications(userId, { limit = 50, unreadOnly = false } = {}) {
    const where = { user_id: userId };

    if (unreadOnly) {
      where.is_read = false;
    }

    return this.prisma.supportNotification.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
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
    });
  }

  countUnreadSupport(userId) {
    return this.prisma.supportNotification.count({
      where: { user_id: userId, is_read: false },
    });
  }

  markSupportRead(userId, ids) {
    return this.prisma.supportNotification.updateMany({
      where: {
        user_id: userId,
        id: { in: ids },
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });
  }

  markAllSupportRead(userId) {
    return this.prisma.supportNotification.updateMany({
      where: { user_id: userId, is_read: false },
      data: {
        is_read: true,
        read_at: new Date(),
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
}
