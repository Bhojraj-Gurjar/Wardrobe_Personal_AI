import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { AdminRoleGuard } from '../../../guards/admin-role.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { DtoValidationPipe } from '../../../common/pipes/dto-validation.pipe';
import { AdminService } from '../services/admin.service';
import { AdminLoginDto } from '../dto/admin-login.dto';
import {
  FACE_UPLOAD_FIELD,
  FACE_UPLOAD_MAX_BYTES,
  toFaceAuthDto,
} from '../../face/utils/face-upload.util';

const loginPipe = DtoValidationPipe(AdminLoginDto);
const faceUploadInterceptor = FileInterceptor(FACE_UPLOAD_FIELD, {
  storage: memoryStorage(),
  limits: { fileSize: FACE_UPLOAD_MAX_BYTES },
});

const adminGuards = [JwtAuthGuard, AdminRoleGuard];

export @ApiTags('admin')
@Controller('admin')
class AdminController {
  constructor(@Inject(AdminService) adminService) {
    this.adminService = adminService;
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Admin login with email and password' })
  login(@Body(loginPipe) dto) {
    return this.adminService.login(dto);
  }

  @Post('face-login')
  @HttpCode(200)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Admin login with face recognition' })
  @UseInterceptors(faceUploadInterceptor)
  async faceLogin(@UploadedFile() file, @Body() body) {
    const dto = await toFaceAuthDto(file, body);
    return this.adminService.faceLogin(dto);
  }

  @Post('register-face')
  @HttpCode(201)
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Register admin face for face login' })
  @UseInterceptors(faceUploadInterceptor)
  async registerFace(@CurrentUser() user, @UploadedFile() file, @Body() body) {
    const dto = await toFaceAuthDto(file, body);
    return this.adminService.registerFace(user.userId, dto);
  }

  @Get('dashboard')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('analytics')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Get('users')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  getUsers(@Query() query) {
    return this.adminService.getUsers(query);
  }

  @Get('users/:id')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  getUser(@Param('id') id) {
    return this.adminService.getUser(id);
  }

  @Patch('users/:id')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  updateUser(@Param('id') id, @Body() payload) {
    return this.adminService.updateUser(id, payload);
  }

  @Post('users/:id/deactivate')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  deactivateUser(@Param('id') id) {
    return this.adminService.deactivateUser(id);
  }

  @Delete('users/:id')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  deleteUser(@Param('id') id) {
    return this.adminService.deleteUser(id);
  }

  @Get('products')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  getProducts(@Query() query) {
    return this.adminService.getProducts(query);
  }

  @Post('products')
  @HttpCode(201)
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  createProduct(@Body() payload) {
    return this.adminService.createProduct(payload);
  }

  @Put('products/:id')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  updateProduct(@Param('id') id, @Body() payload) {
    return this.adminService.updateProduct(id, payload);
  }

  @Delete('products/:id')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  deleteProduct(@Param('id') id) {
    return this.adminService.deleteProduct(id);
  }

  @Patch('products/:id/toggle-status')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  toggleProduct(@Param('id') id) {
    return this.adminService.toggleProductStatus(id);
  }

  @Get('profile')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  getProfile(@CurrentUser() user) {
    return this.adminService.getProfile(user.userId);
  }

  @Put('profile')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  updateProfile(@CurrentUser() user, @Body() payload) {
    return this.adminService.updateProfile(user.userId, payload);
  }

  @Post('change-password')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  changePassword(@CurrentUser() user, @Body() payload) {
    return this.adminService.changePassword(user.userId, payload);
  }

  @Get('orders/summary')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  getOrdersSummary() {
    return this.adminService.getOrdersSummary();
  }

  @Get('orders/export')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  @Header('Content-Type', 'text/csv')
  async exportOrders(@Query() query, @Res() res) {
    const csv = await this.adminService.exportOrdersCsv(query);
    res.setHeader('Content-Disposition', 'attachment; filename="orders-export.csv"');
    res.send(csv);
  }

  @Get('orders/users')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  getOrdersByUser(@Query() query) {
    return this.adminService.getOrdersByUser(query);
  }

  @Get('orders/analytics')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  getOrdersAnalytics() {
    return this.adminService.getOrdersAnalytics();
  }

  @Get('orders')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  getOrders(@Query() query) {
    return this.adminService.getOrders(query);
  }

  @Get('orders/:id')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  getOrderById(@Param('id') id) {
    return this.adminService.getOrderById(id);
  }

  @Patch('orders/:id/status')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  updateOrderStatus(@Param('id') id, @Body('status') status) {
    return this.adminService.updateOrderStatus(id, status);
  }

  @Post('orders/:id/cancel')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  cancelOrder(@Param('id') id) {
    return this.adminService.cancelOrder(id);
  }
}
