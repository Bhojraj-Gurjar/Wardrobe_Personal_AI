import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { USER_ROLE } from '../../../common/constants/user-role';
import { USER_STATUS } from '../../../common/constants/user-status';
import { AdminRepository } from '../repositories/admin.repository';

const BCRYPT_ROUNDS = 12;
const DEFAULT_ADMIN_EMAIL = 'admin@wardrobeai.com';
const DEFAULT_ADMIN_PASSWORD = 'Admin@123';

export @Injectable()
class AdminBootstrapService {
  constructor(
    @Inject(AdminRepository) adminRepository,
    @Inject(ConfigService) configService,
  ) {
    this.adminRepository = adminRepository;
    this.configService = configService;
    this.logger = new Logger(AdminBootstrapService.name);
  }

  async onModuleInit() {
    const email = String(
      this.configService.get('admin.email')
      || process.env.ADMIN_EMAIL
      || DEFAULT_ADMIN_EMAIL,
    ).trim().toLowerCase();

    const password = String(
      this.configService.get('admin.password')
      || process.env.ADMIN_PASSWORD
      || DEFAULT_ADMIN_PASSWORD,
    );

    if (!email || !password) {
      return;
    }

    try {
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const existing = await this.adminRepository.findUserByEmail(email);

      if (existing) {
        if (existing.role === USER_ROLE.ADMIN) {
          return;
        }

        await this.adminRepository.updateUserAdminAccess(existing.id, {
          role: USER_ROLE.ADMIN,
          status: USER_STATUS.ACTIVE,
          password_hash: passwordHash,
          admin_created_at: existing.admin_created_at || new Date(),
        });

        this.logger.warn(
          `Promoted existing account to admin: ${email}`,
        );
        return;
      }

      await this.adminRepository.createAdminUser({
        email,
        password_hash: passwordHash,
        role: USER_ROLE.ADMIN,
        status: USER_STATUS.ACTIVE,
        admin_created_at: new Date(),
        profile: { create: { name: 'Admin' } },
      });

      this.logger.log(`Created default admin account: ${email}`);
    } catch (error) {
      this.logger.warn(`Admin bootstrap skipped: ${error.message}`);
    }
  }
}
