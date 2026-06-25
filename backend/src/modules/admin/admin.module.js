import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FaceModule } from '../face/face.module';
import { OrdersModule } from '../orders/orders.module';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';
import { AdminBootstrapService } from './services/admin-bootstrap.service';
import { AdminRepository } from './repositories/admin.repository';

export @Module({
  imports: [AuthModule, FaceModule, OrdersModule],
  controllers: [AdminController],
  providers: [AdminService, AdminBootstrapService, AdminRepository],
  exports: [AdminService],
})
class AdminModule {}
