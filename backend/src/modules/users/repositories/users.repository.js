import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

export @Injectable()
class UsersRepository {
  constructor(@Inject(PrismaService) prismaService) {
    this.prisma = prismaService;
  }

  findProfileByUserId(userId) {
    return this.prisma.userProfile.findUnique({
      where: { user_id: userId },
    });
  }

  findProfileContextByUserId(userId) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        profile: true,
        face_registration: {
          select: {
            face_image_url: true,
            is_face_registered: true,
            registered_at: true,
            updated_at: true,
          },
        },
      },
    });
  }

  updateProfileByUserId(userId, data) {
    return this.prisma.userProfile.update({
      where: { user_id: userId },
      data,
    });
  }
}
