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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { AdminRoleGuard } from '../../../guards/admin-role.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { DtoValidationPipe } from '../../../common/pipes/dto-validation.pipe';
import { AdminService } from '../services/admin.service';
import { AdminLoginDto } from '../dto/admin-login.dto';
import { InviteUserDto } from '../dto/invite-user.dto';
import {
  FACE_UPLOAD_FIELD,
  FACE_UPLOAD_MAX_BYTES,
  toFaceAuthDto,
} from '../../face/utils/face-upload.util';

const loginPipe = DtoValidationPipe(AdminLoginDto);
const inviteUserPipe = DtoValidationPipe(InviteUserDto);
const faceUploadInterceptor = FileInterceptor(FACE_UPLOAD_FIELD, {
  storage: memoryStorage(),
  limits: { fileSize: FACE_UPLOAD_MAX_BYTES },
});

const productImagesInterceptor = FilesInterceptor('images', 12, {
  storage: memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
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

  @Get('analytics/customers')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Paginated customer analytics for admin' })
  getAnalyticsCustomers(@Query() query) {
    return this.adminService.getAnalyticsCustomers(query);
  }

  @Get('analytics/products')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Paginated product analytics for admin' })
  getAnalyticsProducts(@Query() query) {
    return this.adminService.getAnalyticsProducts(query);
  }

  @Get('analytics/user-growth')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detailed user growth analytics' })
  getAnalyticsUserGrowth(@Query() query) {
    return this.adminService.getAnalyticsUserGrowth(query);
  }

  @Get('analytics/devices')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detailed device analytics' })
  getAnalyticsDevices(@Query() query) {
    return this.adminService.getAnalyticsDevices(query);
  }

  @Get('analytics/orders')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detailed order analytics' })
  getAnalyticsOrders(@Query() query) {
    return this.adminService.getAnalyticsOrders(query);
  }

  @Get('analytics/categories')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detailed category analytics' })
  getAnalyticsCategories(@Query() query) {
    return this.adminService.getAnalyticsCategories(query);
  }

  @Get('analytics')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  getAnalytics(@Query() query) {
    return this.adminService.getAnalytics(query);
  }

  @Get('users')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  getUsers(@Query() query) {
    return this.adminService.getUsers(query);
  }

  @Post('users')
  @HttpCode(201)
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite a new customer user' })
  inviteUser(@Body(inviteUserPipe) payload) {
    return this.adminService.inviteUser(payload);
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

  @Post('products/bulk/validate')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  validateBulkProducts(@Body('rows') rows) {
    return this.adminService.validateBulkProducts(rows);
  }

  @Post('products/bulk/import')
  @HttpCode(201)
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  importBulkProducts(@CurrentUser() user, @Body('rows') rows) {
    return this.adminService.importBulkProducts(rows, user?.userId);
  }

  @Post('products/cms')
  @HttpCode(201)
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  createCmsProduct(@CurrentUser() user, @Body() payload) {
    return this.adminService.createCmsProduct(payload, user?.userId);
  }

  @Post('products')
  @HttpCode(201)
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  createProduct(@CurrentUser() user, @Body() payload) {
    return this.adminService.createProduct(payload, user?.userId);
  }

  @Get('products/:id/inventory/history')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  getProductInventoryHistory(@Param('id') id) {
    return this.adminService.getProductInventoryHistory(id);
  }

  @Get('products/:id')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  getProductById(@Param('id') id) {
    const productId = String(id ?? '').trim();
    return this.adminService.getProductDetail(productId);
  }

  @Put('products/:id')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  updateProduct(@CurrentUser() user, @Param('id') id, @Body() payload) {
    return this.adminService.updateProduct(id, payload, user?.userId);
  }

  @Post('products/:id/images')
  @HttpCode(201)
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(productImagesInterceptor)
  uploadProductImages(@Param('id') id, @UploadedFiles() files) {
    const fileList = Array.isArray(files) ? files : files ? [files] : [];
    return this.adminService.uploadProductImages(id, fileList);
  }

  @Patch('products/:id/inventory')
  @UseGuards(...adminGuards)
  @ApiBearerAuth()
  adjustProductInventory(@CurrentUser() user, @Param('id') id, @Body() payload) {
    return this.adminService.adjustProductInventory(id, payload, user?.userId);
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
  cancelOrder(@CurrentUser() admin, @Param('id') id) {
    return this.adminService.cancelOrder(id, admin.userId);
  }
}
