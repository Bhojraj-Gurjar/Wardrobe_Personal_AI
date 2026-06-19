import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

export @Injectable()
class AuthRepository {
  constructor(@Inject(PrismaService) prismaService) {
    this.prisma = prismaService;
  }

  findByEmail(email) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByMobile(mobile) {
    return this.prisma.user.findUnique({ where: { mobile } });
  }

  findById(id) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  createUserWithProfile({ email, mobile, passwordHash }) {
    return this.prisma.user.create({
      data: {
        email,
        mobile: mobile || null,
        password_hash: passwordHash,
        profile: {
          create: {},
        },
      },
      include: {
        profile: true,
      },
    });
  }
}
