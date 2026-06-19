import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

export @Injectable()
class AdminRepository {
  constructor(@Inject(PrismaService) prismaService) {
    this.prisma = prismaService;
  }
}
