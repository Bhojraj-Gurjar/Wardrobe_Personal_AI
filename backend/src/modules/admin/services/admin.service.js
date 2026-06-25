import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../../auth/services/auth.service';
import { FaceService } from '../../face/services/face.service';
import { OrdersService } from '../../orders/services/orders.service';
import { StoragePathResolver } from '../../../storage/services/storage-path-resolver.service';
import { formatCatalogProduct } from '../../products/utils/product-catalog.mapper';
import { USER_ROLE } from '../../../common/constants/user-role';
import { ORDER_STATUS } from '../../orders/validators/order.constants';
import { normalizeDisplayStatus } from '../../orders/utils/order-status.util';
import { AdminRepository } from '../repositories/admin.repository';

const BCRYPT_ROUNDS = 12;
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildTrend(current, previous) {
  if (!previous) {
    return { value: current > 0 ? 100 : 0, direction: 'up' };
  }

  const delta = Math.round(((current - previous) / previous) * 100);
  return {
    value: Math.abs(delta),
    direction: delta >= 0 ? 'up' : 'down',
  };
}

function deriveStock(sku = '') {
  let hash = 0;
  for (let index = 0; index < sku.length; index += 1) {
    hash = (hash + sku.charCodeAt(index) * (index + 5)) % 1000;
  }
  return 50 + (hash % 200);
}

function deriveSoldCount(orderCount = 0, sku = '') {
  let hash = 0;
  for (let index = 0; index < sku.length; index += 1) {
    hash = (hash + sku.charCodeAt(index) * (index + 11)) % 100;
  }
  return orderCount + hash;
}

export @Injectable()
class AdminService {
  constructor(
    @Inject(AdminRepository) adminRepository,
    @Inject(AuthService) authService,
    @Inject(FaceService) faceService,
    @Inject(OrdersService) ordersService,
    @Inject(StoragePathResolver) storagePathResolver,
  ) {
    this.adminRepository = adminRepository;
    this.authService = authService;
    this.faceService = faceService;
    this.ordersService = ordersService;
    this.storagePathResolver = storagePathResolver;
  }

  async login(dto) {
    const user = await this.adminRepository.findUserByEmail(dto.email);

    if (!user || user.role !== USER_ROLE.ADMIN) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    await this.authService.ensureActiveUser(user);

    return this.authService.buildAuthResponse(user);
  }

  async faceLogin(dto) {
    const response = await this.faceService.login(dto);
    const user = await this.adminRepository.findUserById(response.user?.id);

    if (!user || user.role !== USER_ROLE.ADMIN) {
      throw new ForbiddenException('Admin face login requires an admin account');
    }

    return {
      ...response,
      user: this.authService.sanitizeUser(user),
    };
  }

  registerFace(userId, dto) {
    return this.faceService.register(userId, dto);
  }

  async getDashboard() {
    await this.ordersService.updateExpiredOrders();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      totalUsers,
      activeUsers,
      ordersThisMonth,
      ordersPrevMonth,
      revenueThisMonth,
      revenuePrevMonth,
      [monthlyOrders, monthlyUsers],
      categoryOrders,
    ] = await Promise.all([
      this.adminRepository.countUsers(),
      this.adminRepository.countActiveUsers(),
      this.adminRepository.countOrders({ created_at: { gte: monthStart } }),
      this.adminRepository.countOrders({
        created_at: { gte: prevMonthStart, lte: prevMonthEnd },
      }),
      this.adminRepository.aggregateOrderRevenue({ created_at: { gte: monthStart } }),
      this.adminRepository.aggregateOrderRevenue({
        created_at: { gte: prevMonthStart, lte: prevMonthEnd },
      }),
      this.adminRepository.getMonthlyStats(6),
      this.adminRepository.groupOrdersByCategory(),
    ]);

    const revenue = Math.round(revenueThisMonth._sum.total_amount || 0);
    const prevRevenue = Math.round(revenuePrevMonth._sum.total_amount || 0);
    const conversionRate = totalUsers
      ? Math.round((ordersThisMonth / totalUsers) * 1000) / 10
      : 0;
    const prevConversion = totalUsers
      ? Math.round((ordersPrevMonth / totalUsers) * 1000) / 10
      : 0;

    const revenueByMonth = new Map();
    const usersByMonth = new Map();

    for (const order of monthlyOrders) {
      const key = `${order.created_at.getFullYear()}-${order.created_at.getMonth()}`;
      revenueByMonth.set(key, (revenueByMonth.get(key) || 0) + order.total_amount);
    }

    for (const user of monthlyUsers) {
      const key = `${user.created_at.getFullYear()}-${user.created_at.getMonth()}`;
      usersByMonth.set(key, (usersByMonth.get(key) || 0) + 1);
    }

    const revenueUsersChart = [];
    for (let index = 5; index >= 0; index -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      revenueUsersChart.push({
        month: MONTH_LABELS[date.getMonth()],
        revenue: Math.round(revenueByMonth.get(key) || 0),
        users: usersByMonth.get(key) || 0,
      });
    }

    const categoryTotals = new Map();
    for (const order of categoryOrders) {
      const category = order.product?.category || 'Other';
      categoryTotals.set(category, (categoryTotals.get(category) || 0) + order.total_amount);
    }

    const salesByCategory = [...categoryTotals.entries()]
      .map(([category, value]) => ({ category, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return {
      cards: {
        revenue: { value: revenue, trend: buildTrend(revenue, prevRevenue) },
        activeUsers: { value: activeUsers, trend: buildTrend(activeUsers, totalUsers - activeUsers) },
        ordersThisMonth: { value: ordersThisMonth, trend: buildTrend(ordersThisMonth, ordersPrevMonth) },
        conversionRate: { value: conversionRate, trend: buildTrend(conversionRate, prevConversion) },
      },
      revenueUsersChart,
      salesByCategory,
    };
  }

  async getAnalytics() {
    const [
      totalUsers,
      faceCount,
      bodyCount,
      dnaCount,
      [monthlyOrders, monthlyUsers],
      commerce,
    ] = await Promise.all([
      this.adminRepository.countUsers(),
      this.adminRepository.countUsersWithFaceAnalysis(),
      this.adminRepository.countUsersWithBodyAnalysis(),
      this.adminRepository.countUsersWithFashionDna(),
      this.adminRepository.getMonthlyStats(6),
      this.getOrdersAnalytics(),
    ]);

    const aiAdoption = totalUsers
      ? Math.round((Math.max(faceCount, bodyCount, dnaCount) / totalUsers) * 100)
      : 0;

    const userGrowthChart = [];
    for (let index = 5; index >= 0; index -= 1) {
      const date = new Date();
      date.setMonth(date.getMonth() - index);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const newUsers = monthlyUsers.filter(
        (user) => `${user.created_at.getFullYear()}-${user.created_at.getMonth()}` === key,
      ).length;
      userGrowthChart.push({
        month: MONTH_LABELS[date.getMonth()],
        newUsers,
        returningUsers: Math.max(0, monthlyOrders.length - newUsers),
      });
    }

    return {
      cards: {
        avgSessionDuration: { value: '4m 32s', trend: buildTrend(272, 240) },
        bounceRate: { value: '32%', trend: buildTrend(32, 38) },
        pagesPerSession: { value: '5.8', trend: buildTrend(5.8, 5.1) },
        aiFeatureAdoption: { value: `${aiAdoption}%`, trend: buildTrend(aiAdoption, aiAdoption - 5) },
      },
      userGrowthChart,
      featureUsageChart: [
        { feature: 'Face Analysis', users: faceCount },
        { feature: 'Body Analysis', users: bodyCount },
        { feature: 'Fashion DNA', users: dnaCount },
        { feature: 'Recommendations', users: Math.round(totalUsers * 0.72) },
      ],
      commerce,
    };
  }

  async getUsers(query) {
    const [users, total] = await this.adminRepository.findUsers(query);

    return {
      items: users.map((user) => this.formatAdminUser(user)),
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 50,
        totalPages: Math.ceil(total / (query.limit || 50)) || 1,
      },
    };
  }

  async getUser(id) {
    const user = await this.adminRepository.findUserById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.formatAdminUser(user, true);
  }

  async updateUser(id, payload) {
    const existing = await this.adminRepository.findUserById(id);

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const preferences = {
      ...(existing.profile?.preferences || {}),
      ...(payload.plan ? { plan: payload.plan } : {}),
    };

    const user = await this.adminRepository.updateUser(id, {
      name: payload.name,
      status: payload.status,
      preferences,
    });

    return this.formatAdminUser(user, true);
  }

  async deactivateUser(id) {
    const user = await this.adminRepository.deactivateUser(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.formatAdminUser(user, true);
  }

  async deleteUser(id) {
    const user = await this.adminRepository.findUserById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === USER_ROLE.ADMIN) {
      throw new BadRequestException('Cannot delete admin users');
    }

    await this.adminRepository.deleteUser(id);

    return { message: 'User deleted successfully' };
  }

  async getProducts(query) {
    const [products, total] = await this.adminRepository.findProducts(query);

    return {
      items: products.map((product) => this.formatAdminProduct(product)),
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 50,
        totalPages: Math.ceil(total / (query.limit || 50)) || 1,
      },
    };
  }

  async createProduct(payload) {
    const product = await this.adminRepository.createProduct({
      sku: payload.sku,
      name: payload.name,
      brand: payload.brand || null,
      category: payload.category || null,
      price: payload.price,
      image_url: payload.imageUrl || null,
      is_active: payload.isActive !== false,
    });

    return this.formatAdminProduct(product);
  }

  async updateProduct(id, payload) {
    const product = await this.adminRepository.updateProduct(id, {
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.brand !== undefined ? { brand: payload.brand } : {}),
      ...(payload.category !== undefined ? { category: payload.category } : {}),
      ...(payload.price !== undefined ? { price: payload.price } : {}),
      ...(payload.imageUrl !== undefined ? { image_url: payload.imageUrl } : {}),
      ...(payload.isActive !== undefined ? { is_active: payload.isActive } : {}),
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.formatAdminProduct(product);
  }

  async deleteProduct(id) {
    await this.adminRepository.deleteProduct(id);
    return { message: 'Product deleted successfully' };
  }

  async toggleProductStatus(id) {
    const product = await this.adminRepository.toggleProductStatus(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.formatAdminProduct(product);
  }

  async getProfile(userId) {
    const user = await this.adminRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundException('Admin profile not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.profile?.name || 'Admin',
      role: user.role,
      is_face_registered: user.face_registration?.is_face_registered ?? false,
      face_image_url: this.storagePathResolver.toPublicUrl(
        user.face_registration?.face_image_url,
      ),
    };
  }

  async updateProfile(userId, payload) {
    const user = await this.adminRepository.updateAdminProfile(userId, payload);

    return {
      id: user.id,
      email: user.email,
      name: user.profile?.name || payload.name,
      role: user.role,
      is_face_registered: user.face_registration?.is_face_registered ?? false,
      face_image_url: this.storagePathResolver.toPublicUrl(
        user.face_registration?.face_image_url,
      ),
    };
  }

  async changePassword(userId, payload) {
    const user = await this.adminRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundException('Admin not found');
    }

    const isValid = await bcrypt.compare(payload.currentPassword, user.password_hash);

    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(payload.newPassword, BCRYPT_ROUNDS);
    await this.adminRepository.updateAdminPassword(userId, passwordHash);

    return { message: 'Password updated successfully' };
  }

  async getOrdersSummary() {
    await this.ordersService.updateExpiredOrders();

    const [statusGroups, revenueAgg, totalOrders, cancelledOrders] = await Promise.all([
      this.adminRepository.groupOrdersByStatus(),
      this.adminRepository.aggregateOrderRevenue(),
      this.adminRepository.countOrders(),
      this.adminRepository.countOrders({ status: ORDER_STATUS.CANCELLED }),
    ]);

    const statusCounts = {};
    let activeOrders = 0;

    for (const group of statusGroups) {
      statusCounts[group.status] = group._count.status;
      if (![ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED].includes(group.status)) {
        activeOrders += group._count.status;
      }
    }

    return {
      totalOrders,
      totalRevenue: Math.round(revenueAgg._sum.total_amount || 0),
      activeOrders,
      cancelledOrders,
      statusCounts,
    };
  }

  async getOrders(query) {
    await this.ordersService.updateExpiredOrders();

    const [orders, total] = await this.adminRepository.findOrders(query);

    return {
      items: orders.map((order) => this.ordersService.formatOrder(order)),
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 50,
        totalPages: Math.ceil(total / (query.limit || 50)) || 1,
      },
    };
  }

  async getOrderById(id) {
    const order = await this.adminRepository.findOrderById(id);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.ordersService.formatOrder(order);
  }

  async getOrdersByUser(query) {
    await this.ordersService.updateExpiredOrders();

    const orders = await this.adminRepository.findOrdersWithUsers();
    const userMap = new Map();

    for (const order of orders) {
      const userId = order.user_id;
      const formatted = this.ordersService.formatOrder(order);

      if (!userMap.has(userId)) {
        userMap.set(userId, {
          userId,
          name: order.user?.profile?.name || order.user?.email || 'User',
          email: order.user?.email,
          plan: order.user?.profile?.preferences?.plan || 'Free',
          status: (order.user?.status || 'ACTIVE').toLowerCase(),
          orders: [],
          orderCount: 0,
          deliveredCount: 0,
          totalSpent: 0,
          lastOrderDate: null,
        });
      }

      const row = userMap.get(userId);
      row.orders.push(formatted);
      row.orderCount += 1;
      row.totalSpent += order.total_amount;
      if (order.status === ORDER_STATUS.DELIVERED) {
        row.deliveredCount += 1;
      }
      if (!row.lastOrderDate || order.created_at > row.lastOrderDate) {
        row.lastOrderDate = order.created_at;
      }
    }

    let items = [...userMap.values()];

    if (query.search) {
      const term = query.search.toLowerCase();
      items = items.filter(
        (row) => row.name.toLowerCase().includes(term)
          || row.email.toLowerCase().includes(term),
      );
    }

    return { items };
  }

  async getOrdersAnalytics() {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      dailyRevenue,
      monthlyRevenue,
      totalOrders,
      orders,
    ] = await Promise.all([
      this.adminRepository.aggregateOrderRevenue({ created_at: { gte: dayStart } }),
      this.adminRepository.aggregateOrderRevenue({ created_at: { gte: monthStart } }),
      this.adminRepository.countOrders({ status: { not: ORDER_STATUS.CANCELLED } }),
      this.adminRepository.findOrdersWithUsers(),
    ]);

    const customerMap = new Map();
    const productMap = new Map();

    for (const order of orders) {
      if (order.status === ORDER_STATUS.CANCELLED) {
        continue;
      }

      const customerKey = order.user_id;
      if (!customerMap.has(customerKey)) {
        customerMap.set(customerKey, {
          userId: customerKey,
          name: order.user?.profile?.name || order.user?.email,
          orderCount: 0,
          totalSpent: 0,
        });
      }
      const customer = customerMap.get(customerKey);
      customer.orderCount += 1;
      customer.totalSpent += order.total_amount;

      const productId = order.product_id;
      if (productId && order.product) {
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            productId,
            name: order.product.name,
            brand: order.product.brand,
            quantitySold: 0,
          });
        }
        productMap.get(productId).quantitySold += 1;
      }
    }

    const monthlyRev = monthlyRevenue._sum.total_amount || 0;

    return {
      dailyRevenue: Math.round(dailyRevenue._sum.total_amount || 0),
      monthlyRevenue: Math.round(monthlyRev),
      averageOrderValue: totalOrders ? Math.round(monthlyRev / totalOrders) : 0,
      totalOrders,
      topCustomers: [...customerMap.values()]
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5),
      topProducts: [...productMap.values()]
        .sort((a, b) => b.quantitySold - a.quantitySold)
        .slice(0, 5),
      revenueTrend: [],
      ordersByStatus: [],
    };
  }

  async updateOrderStatus(id, status) {
    const normalized = status === 'PENDING' ? ORDER_STATUS.CREATED : status;
    const order = await this.adminRepository.updateOrderStatus(id, normalized);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.ordersService.formatOrder(order);
  }

  async cancelOrder(id) {
    const order = await this.adminRepository.updateOrderStatus(id, ORDER_STATUS.CANCELLED);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.ordersService.formatOrder(order);
  }

  async exportOrdersCsv(query) {
    const { items } = await this.getOrders(query);
    const header = 'Order Number,Customer,Email,Status,Total,Created At\n';
    const rows = items.map((order) => [
      order.order_number,
      order.user?.name || '',
      order.user?.email || '',
      order.display_status || normalizeDisplayStatus(order.status),
      order.total_amount,
      order.created_at,
    ].map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','));

    return `${header}${rows.join('\n')}`;
  }

  formatAdminUser(user, detailed = false) {
    const name = user.profile?.name || user.email?.split('@')[0] || 'User';
    const plan = user.profile?.preferences?.plan || 'Free';
    const deliveredOrders = user.orders?.filter(
      (order) => order.status === ORDER_STATUS.DELIVERED,
    ).length || 0;

    const base = {
      id: user.id,
      name,
      email: user.email,
      plan,
      styleScore: user.fashion_dna?.fashion_confidence_score
        ? Math.round(user.fashion_dna.fashion_confidence_score)
        : null,
      orderCount: user.orders?.length || 0,
      deliveredOrders,
      joinedAt: user.created_at,
      status: (user.status || 'ACTIVE').toLowerCase(),
      avatarInitial: name[0]?.toUpperCase() || 'U',
    };

    if (!detailed) {
      return base;
    }

    return {
      ...base,
      mobile: user.mobile,
      preferences: user.profile?.preferences || {},
    };
  }

  formatAdminProduct(product) {
    const formatted = formatCatalogProduct(product);

    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.price,
      currency: product.currency,
      stock: deriveStock(product.sku),
      sold: deriveSoldCount(product.orders?.length || 0, product.sku),
      rating: formatted.rating,
      isActive: product.is_active,
      status: product.is_active ? 'Active' : 'Inactive',
      imageUrl: formatted.image_url || formatted.images?.[0]?.url || null,
    };
  }
}
