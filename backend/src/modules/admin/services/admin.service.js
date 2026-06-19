import { Inject, Injectable } from '@nestjs/common';
import { AdminRepository } from '../repositories/admin.repository';

export @Injectable()
class AdminService {
  constructor(@Inject(AdminRepository) adminRepository) {
    this.adminRepository = adminRepository;
  }
}
