import { Inject, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { USER_ROLE } from '../common/constants/user-role';
import { USER_STATUS } from '../common/constants/user-status';

export @Injectable()
class AdminRoleGuard {
  constructor(@Inject(PrismaService) prismaService) {
    this.prisma = prismaService;
  }

  async canActivate(context) {
    const request = context.switchToHttp().getRequest();
    const authUser = request.user;

    if (!authUser?.userId) {
      throw new UnauthorizedException('Authentication required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { role: true, status: true },
    });

    if (!user || user.status !== USER_STATUS.ACTIVE) {
      throw new ForbiddenException('Account is not active');
    }

    if (user.role !== USER_ROLE.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
