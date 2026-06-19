import { Inject, Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminService } from '../services/admin.service';

export @ApiTags('admin')
@Controller('admin')
class AdminController {
  constructor(@Inject(AdminService) adminService) {
    this.adminService = adminService;
  }
}
