import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { AuthService } from '../../auth/services/auth.service';
import { FaceService } from '../../face/services/face.service';
import { OrdersService } from '../../orders/services/orders.service';
import { OrderOmsService } from '../../orders/services/order-oms.service';
import { OrdersRepository } from '../../orders/repositories/orders.repository';
import { assertValidStatusTransition } from '../../orders/utils/order-transition.util';
import { StoragePathResolver } from '../../../storage/services/storage-path-resolver.service';
import { formatCatalogProduct } from '../../products/utils/product-catalog.mapper';
import {
  inferProductType,
  isValidProductType,
  resolveUiCategoryForProductType,
} from '../../products/constants/product-type.constants';
import { isValidCmsProductType } from '../constants/cms-taxonomy.constants';
import { USER_ROLE } from '../../../common/constants/user-role';
import { ORDER_STATUS } from '../../orders/validators/order.constants';
import { normalizeDisplayStatus } from '../../orders/utils/order-status.util';
import { AdminRepository } from '../repositories/admin.repository';
import { AdminAnalyticsRepository } from '../repositories/admin-analytics.repository';
import { AdminProductCmsService } from './admin-product-cms.service';
import { AdminProductBulkService } from './admin-product-bulk.service';
import { ProductService } from '../../products/services/product.service';
import { resolveAdminProductTypeDisplay } from '../utils/admin-product-type.util';
import {
  buildDeviceAnalyticsRows,
  buildDeviceSplit,
  buildDistribution,
  buildOrdersPerMonth,
  buildTopCategories,
  buildUserGrowthSeries,
  filterOrdersForAnalytics,
  filterUsersForGrowth,
  parseBrowserName,
  summarizeOrderAnalytics,
  summarizeUserGrowth,
} from '../utils/admin-analytics-charts.util';

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
    @Inject(AdminAnalyticsRepository) adminAnalyticsRepository,
    @Inject(AdminProductCmsService) productCmsService,
    @Inject(AdminProductBulkService) productBulkService,
    @Inject(AuthService) authService,
    @Inject(FaceService) faceService,
    @Inject(OrdersService) ordersService,
    @Inject(OrderOmsService) orderOmsService,
    @Inject(OrdersRepository) ordersRepository,
    @Inject(StoragePathResolver) storagePathResolver,
    @Inject(ProductService) productService,
  ) {
    this.adminRepository = adminRepository;
    this.adminAnalyticsRepository = adminAnalyticsRepository;
    this.productCmsService = productCmsService;
    this.productBulkService = productBulkService;
    this.authService = authService;
    this.faceService = faceService;
    this.ordersService = ordersService;
    this.orderOmsService = orderOmsService;
    this.ordersRepository = ordersRepository;
    this.storagePathResolver = storagePathResolver;
    this.productService = productService;
    this.logger = new Logger(AdminService.name);
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
    this.logger.log('Dashboard API called — syncing order statuses');
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
    const productTypeTotals = new Map();
    for (const order of categoryOrders) {
      const category = order.product?.category || 'Other';
      categoryTotals.set(category, (categoryTotals.get(category) || 0) + order.total_amount);

      const productType = order.product?.product_type
        || inferProductType(order.product || {});
      productTypeTotals.set(
        productType,
        (productTypeTotals.get(productType) || 0) + order.total_amount,
      );
    }

    const salesByCategory = [...categoryTotals.entries()]
      .map(([category, value]) => ({ category, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const payload = {
      cards: {
        revenue: { value: revenue, trend: buildTrend(revenue, prevRevenue) },
        activeUsers: { value: activeUsers, trend: buildTrend(activeUsers, totalUsers - activeUsers) },
        ordersThisMonth: { value: ordersThisMonth, trend: buildTrend(ordersThisMonth, ordersPrevMonth) },
        conversionRate: { value: conversionRate, trend: buildTrend(conversionRate, prevConversion) },
      },
      revenueUsersChart,
      salesByCategory,
      salesByProductType: [...productTypeTotals.entries()]
        .map(([productType, value]) => ({ productType, value: Math.round(value) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8),
    };

    this.logger.log(
      `Dashboard query executed — users=${totalUsers} active=${activeUsers} ordersMonth=${ordersThisMonth} revenue=${revenue}`,
    );

    return payload;
  }

  async getAnalytics(query = {}) {
    const chartBundle = await this.buildAnalyticsChartBundle({
      period: query.period || 'monthly',
    });

    const [
      totalUsers,
      faceCount,
      bodyCount,
      dnaCount,
      commerce,
    ] = await Promise.all([
      this.adminRepository.countUsers(),
      this.adminRepository.countUsersWithFaceAnalysis(),
      this.adminRepository.countUsersWithBodyAnalysis(),
      this.adminRepository.countUsersWithFashionDna(),
      this.getOrdersAnalytics(),
    ]);

    const aiAdoption = totalUsers
      ? Math.round((Math.max(faceCount, bodyCount, dnaCount) / totalUsers) * 100)
      : 0;

    return {
      cards: {
        avgSessionDuration: { value: '4m 32s', trend: buildTrend(272, 240) },
        bounceRate: { value: '32%', trend: buildTrend(32, 38) },
        pagesPerSession: { value: '5.8', trend: buildTrend(5.8, 5.1) },
        aiFeatureAdoption: { value: `${aiAdoption}%`, trend: buildTrend(aiAdoption, aiAdoption - 5) },
      },
      userGrowth: chartBundle.userGrowth,
      userGrowthChart: chartBundle.userGrowth,
      deviceSplit: chartBundle.deviceSplit,
      ordersPerMonth: chartBundle.ordersPerMonth,
      topCategories: chartBundle.topCategories,
      featureUsageChart: [
        { feature: 'Face Analysis', users: faceCount },
        { feature: 'Body Analysis', users: bodyCount },
        { feature: 'Fashion DNA', users: dnaCount },
        { feature: 'Recommendations', users: Math.round(totalUsers * 0.72) },
      ],
      commerce,
    };
  }

  async buildAnalyticsChartBundle({ period = 'monthly' } = {}) {
    const [
      users,
      orders,
      supportTickets,
      productViews,
      searches,
      productCategories,
      wishlistItems,
      cartItems,
    ] = await Promise.all([
      this.adminAnalyticsRepository.getUsersForGrowthAnalytics(),
      this.adminAnalyticsRepository.getOrdersForGrowthAnalytics(),
      this.adminAnalyticsRepository.getSupportDeviceSignals(),
      this.adminAnalyticsRepository.getProductViewSignals(),
      this.adminAnalyticsRepository.getSearchSignals(),
      this.adminAnalyticsRepository.getProductCategoryCounts(),
      this.adminAnalyticsRepository.getWishlistCategoryCounts(),
      this.adminAnalyticsRepository.getCartCategoryCounts(),
    ]);

    const activeUserIds = [
      ...new Set([
        ...orders.filter((order) => order.user_id).map((order) => order.user_id),
        ...productViews.map((item) => item.user_id),
        ...searches.map((item) => item.user_id),
      ]),
    ];

    const wishlistCounts = this.groupEngagementByCategory(wishlistItems, 'wishlist');
    const cartCounts = this.groupEngagementByCategory(cartItems, 'cart');

    return {
      userGrowth: buildUserGrowthSeries(users, orders, period),
      deviceSplit: buildDeviceSplit(supportTickets, activeUserIds),
      ordersPerMonth: buildOrdersPerMonth(orders, 6),
      topCategories: buildTopCategories({
        orders,
        products: productCategories,
        wishlistCounts,
        cartCounts,
      }),
    };
  }

  groupEngagementByCategory(items = []) {
    const map = new Map();

    for (const item of items) {
      const category = item.product?.category || 'Other';
      map.set(category, (map.get(category) || 0) + 1);
    }

    return [...map.entries()].map(([category, count]) => ({
      category,
      _count: { _all: count },
    }));
  }

  async getAnalyticsUserGrowth(query = {}) {
    const period = query.period || 'monthly';
    const [users, orders] = await Promise.all([
      this.adminAnalyticsRepository.getUsersForGrowthAnalytics(),
      this.adminAnalyticsRepository.getOrdersForGrowthAnalytics(),
    ]);

    const filteredUsers = filterUsersForGrowth(users, query);
    const filteredOrders = filterOrdersForAnalytics(orders, query);
    const summary = summarizeUserGrowth(filteredUsers, filteredOrders);

    return {
      summary,
      series: {
        selected: buildUserGrowthSeries(filteredUsers, filteredOrders, period),
        daily: buildUserGrowthSeries(filteredUsers, filteredOrders, 'weekly'),
        weekly: buildUserGrowthSeries(filteredUsers, filteredOrders, 'weekly'),
        monthly: buildUserGrowthSeries(filteredUsers, filteredOrders, 'monthly'),
        yearly: buildUserGrowthSeries(filteredUsers, filteredOrders, 'yearly'),
      },
    };
  }

  async getAnalyticsDevices(query = {}) {
    const [
      supportTickets,
      productViews,
      searches,
      orders,
    ] = await Promise.all([
      this.adminAnalyticsRepository.getSupportDeviceSignals(),
      this.adminAnalyticsRepository.getProductViewSignals(),
      this.adminAnalyticsRepository.getSearchSignals(),
      this.adminAnalyticsRepository.getOrdersForGrowthAnalytics(),
    ]);

    const activeUserIds = [
      ...new Set([
        ...orders.filter((order) => order.user_id).map((order) => order.user_id),
        ...productViews.map((item) => item.user_id),
        ...searches.map((item) => item.user_id),
      ]),
    ];

    const deviceSplit = buildDeviceSplit(supportTickets, activeUserIds);
    const rows = buildDeviceAnalyticsRows(supportTickets, productViews, searches);

    const browserMap = new Map();
    const osMap = new Map();

    for (const ticket of supportTickets) {
      const browser = parseBrowserName(ticket.browser_info);
      const os = ticket.os_info || 'Unknown';
      browserMap.set(browser, (browserMap.get(browser) || 0) + 1);
      osMap.set(os, (osMap.get(os) || 0) + 1);
    }

    return {
      summary: {
        totalSessions: productViews.length + searches.length,
        trackedDevices: deviceSplit.length,
        mobileShare: deviceSplit.find((item) => item.device === 'Mobile')?.percentage || 0,
        desktopShare: deviceSplit.find((item) => item.device === 'Desktop')?.percentage || 0,
      },
      deviceSplit,
      browserDistribution: buildDistribution(
        [...browserMap.entries()].map(([label, count]) => ({ label, count })),
        'label',
        'count',
      ),
      osDistribution: buildDistribution(
        [...osMap.entries()].map(([label, count]) => ({ label, count })),
        'label',
        'count',
      ),
      rows,
    };
  }

  async getAnalyticsOrders(query = {}) {
    const orders = await this.adminAnalyticsRepository.getOrdersWithCategory();
    const filtered = filterOrdersForAnalytics(orders, query);
    const summary = summarizeOrderAnalytics(filtered);

    return {
      summary,
      ordersPerMonth: buildOrdersPerMonth(filtered, 12),
      statusDistribution: buildDistribution(
        [
          { label: 'Delivered', count: summary.delivered },
          { label: 'Cancelled', count: summary.cancelled },
          { label: 'Returned', count: summary.returned },
          {
            label: 'Other',
            count: Math.max(0, summary.totalOrders - summary.delivered - summary.cancelled - summary.returned),
          },
        ],
        'label',
        'count',
      ),
      revenueTrend: buildOrdersPerMonth(filtered, 12).map((item) => ({
        month: item.month,
        revenue: item.revenue,
        orders: item.orders,
      })),
    };
  }

  async getAnalyticsCategories(query = {}) {
    const [
      orders,
      productCategories,
      wishlistItems,
      cartItems,
      products,
      returnCounts,
    ] = await Promise.all([
      this.adminAnalyticsRepository.getOrdersWithCategory(),
      this.adminAnalyticsRepository.getProductCategoryCounts(),
      this.adminAnalyticsRepository.getWishlistCategoryCounts(),
      this.adminAnalyticsRepository.getCartCategoryCounts(),
      this.adminAnalyticsRepository.findProductsForAnalytics({ category: query.category }),
      this.adminAnalyticsRepository.getCategoryReturnCounts(),
    ]);

    const wishlistCounts = this.groupEngagementByCategory(wishlistItems);
    const cartCounts = this.groupEngagementByCategory(cartItems);
    const categories = buildTopCategories({
      orders: filterOrdersForAnalytics(orders, query),
      products: productCategories,
      wishlistCounts,
      cartCounts,
    });

    const returnByProduct = new Map(
      returnCounts.map((entry) => [entry.product_id, entry._count?._all || 0]),
    );

    const returnByCategory = new Map();
    for (const product of products) {
      const returns = returnByProduct.get(product.id) || 0;
      if (!returns) {
        continue;
      }
      const category = product.category || 'Other';
      returnByCategory.set(category, (returnByCategory.get(category) || 0) + returns);
    }

    const items = categories
      .filter((item) => !query.category || item.category.toLowerCase() === query.category.toLowerCase())
      .map((item) => ({
        ...item,
        returns: returnByCategory.get(item.category) || 0,
        rating: null,
      }));

    return {
      summary: {
        totalCategories: items.length,
        topCategory: items[0]?.category || '—',
        totalRevenue: items.reduce((sum, item) => sum + item.revenue, 0),
        totalPurchases: items.reduce((sum, item) => sum + item.purchases, 0),
      },
      items,
      revenueByCategory: items.map((item) => ({
        category: item.category,
        revenue: item.revenue,
      })),
      purchasesByCategory: items.map((item) => ({
        category: item.category,
        purchases: item.purchases,
      })),
      wishlistByCategory: items.map((item) => ({
        category: item.category,
        wishlistCount: item.wishlistCount,
      })),
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
    await this.productService.invalidateCatalogCache();

    return { message: 'User deleted successfully' };
  }

  async inviteUser(payload) {
    const email = String(payload.email || '').trim().toLowerCase();
    const name = String(payload.name || '').trim();
    const plan = payload.plan || 'Free';

    if (!email || !name) {
      throw new BadRequestException('Email and name are required');
    }

    const existing = await this.adminRepository.findUserByEmail(email);

    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const providedPassword = String(payload.password || '').trim();
    const temporaryPassword = providedPassword || `Wa@${randomBytes(4).toString('hex')}9`;
    const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);

    const user = await this.adminRepository.createInvitedUser({
      email,
      passwordHash,
      name,
      plan,
    });

    return {
      message: 'User invited successfully',
      user: this.formatAdminUser(user, true),
      ...(providedPassword ? {} : { temporaryPassword }),
    };
  }

  async getProducts(query) {
    return this.productCmsService.listProducts(query);
  }

  async getProductDetail(id) {
    return this.productCmsService.getProductDetail(id);
  }

  async createProduct(payload, adminUserId) {
    if (this.isExtendedProductPayload(payload)) {
      return this.productCmsService.createProduct(payload, adminUserId);
    }

    if (!payload.productType || (!isValidProductType(payload.productType) && !isValidCmsProductType(payload.productType))) {
      throw new BadRequestException('A valid product type is required.');
    }

    return this.productCmsService.createProduct({
      sku: payload.sku,
      name: payload.name,
      brand: payload.brand,
      category: payload.category || resolveUiCategoryForProductType(payload.productType) || 'Clothing',
      productType: payload.productType,
      sellingPrice: payload.price,
      stockQuantity: payload.stock,
      imageUrl: payload.imageUrl,
      visibility: payload.isActive === false ? 'HIDDEN' : 'PUBLISHED',
      isActive: payload.isActive !== false,
    }, adminUserId);
  }

  async createCmsProduct(payload, adminUserId) {
    return this.productCmsService.createProduct(payload, adminUserId);
  }

  async updateProduct(id, payload, adminUserId) {
    if (this.isExtendedProductPayload(payload)) {
      return this.productCmsService.updateProduct(id, payload, adminUserId);
    }

    if (payload.productType !== undefined && !isValidProductType(payload.productType)) {
      throw new BadRequestException('Invalid product type.');
    }

    return this.productCmsService.updateProduct(id, {
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.brand !== undefined ? { brand: payload.brand } : {}),
      ...(payload.category !== undefined ? { category: payload.category } : {}),
      ...(payload.productType !== undefined ? { productType: payload.productType } : {}),
      ...(payload.price !== undefined ? { sellingPrice: payload.price } : {}),
      ...(payload.imageUrl !== undefined ? { images: payload.imageUrl ? [{ url: payload.imageUrl, isPrimary: true }] : [] } : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive, visibility: payload.isActive ? 'PUBLISHED' : 'HIDDEN' } : {}),
    }, adminUserId);
  }

  uploadProductImages(productId, files) {
    return this.productCmsService.uploadProductImages(productId, files);
  }

  adjustProductInventory(productId, payload, adminUserId) {
    return this.productCmsService.adjustInventory(productId, payload, adminUserId);
  }

  getProductInventoryHistory(productId) {
    return this.productCmsService.getInventoryHistory(productId);
  }

  validateBulkProducts(rows) {
    return this.productBulkService.validateRows(rows);
  }

  async importBulkProducts(rows, adminUserId) {
    const result = await this.productBulkService.importRows(rows, adminUserId);
    await this.productService.invalidateCatalogCache();
    return result;
  }

  isExtendedProductPayload(payload) {
    return Boolean(
      payload?.variants?.length
      || payload?.images?.length
      || payload?.mrp != null
      || payload?.visibility
      || payload?.aiAttributes
      || payload?.description
      || payload?.gender
      || payload?.barcode
      || payload?.fabric
      || payload?.sellingPrice != null,
    );
  }

  async deleteProduct(id) {
    await this.productCmsService.getProductDetail(id);

    try {
      const deleted = await this.productCmsService.deleteProduct(id);

      if (!deleted) {
        throw new NotFoundException('Product not found');
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      const isForeignKeyViolation = error?.code === 'P2003'
        || String(error?.message || '').toLowerCase().includes('foreign key');

      if (isForeignKeyViolation) {
        this.logger.warn(
          `Hard delete blocked for product ${id}; archiving to preserve order history.`,
        );

        const archived = await this.productCmsService.archiveProduct(id);

        if (!archived) {
          throw new NotFoundException('Product not found');
        }
      } else {
        this.logger.error(
          `Product delete failed for ${id}: ${error?.message || 'Unknown error'}`,
          error?.stack,
        );

        throw new BadRequestException(
          error?.message || 'Unable to delete product. Please try again.',
        );
      }
    }

    await this.productService.invalidateCatalogCache(id);

    return { message: 'Product deleted successfully', id };
  }

  async toggleProductStatus(id) {
    const product = await this.adminRepository.toggleProductStatus(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.productService.invalidateCatalogCache(id);

    return this.productCmsService.formatLegacyProduct(product);
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
      if (![
        ORDER_STATUS.COMPLETED,
        ORDER_STATUS.DELIVERED,
        ORDER_STATUS.CANCELLED,
        ORDER_STATUS.ARCHIVED,
        ORDER_STATUS.REFUNDED,
      ].includes(group.status)) {
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
      const userId = order.user_id ?? '__deleted__';
      const formatted = this.ordersService.formatOrder(order);

      if (!userMap.has(userId)) {
        userMap.set(userId, {
          userId,
          name: order.user?.profile?.name || order.user?.email || '[Deleted User]',
          email: order.user?.email ?? null,
          plan: order.user?.profile?.preferences?.plan || 'Free',
          status: (order.user?.status || 'removed').toLowerCase(),
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
      if ([ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED].includes(order.status)) {
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
          || (row.email || '').toLowerCase().includes(term),
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

      const customerKey = order.user_id ?? '__deleted__';
      if (!customerMap.has(customerKey)) {
        customerMap.set(customerKey, {
          userId: customerKey,
          name: order.user?.profile?.name || order.user?.email || '[Deleted User]',
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
    const order = await this.adminRepository.findOrderById(id);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    assertValidStatusTransition(order.status, normalized);

    const updated = await this.ordersRepository.updateStatus(
      id,
      normalized,
      {},
      order.status,
    );

    if (!updated) {
      throw new BadRequestException('Order status changed concurrently. Please refresh and retry.');
    }

    return this.ordersService.formatOrder(updated);
  }

  async cancelOrder(id, adminId) {
    return this.orderOmsService.cancelOrder(id, adminId);
  }

  async exportOrdersCsv(query) {
    const { items } = await this.getOrders(query);
    const header = 'Order Number,Customer,Email,Status,Total,Created At\n';
    const rows = items.map((order) => [
      order.order_number,
      order.user?.name || '[Deleted User]',
      order.user?.email || '',
      order.display_status || normalizeDisplayStatus(order.status),
      order.total_amount,
      order.created_at,
    ].map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','));

    return `${header}${rows.join('\n')}`;
  }

  async getAnalyticsCustomers(query = {}) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [orderAggregates, users] = await Promise.all([
      this.adminAnalyticsRepository.getCustomerOrderAggregates(),
      this.adminAnalyticsRepository.findCustomersForAnalytics({
        search: query.search,
        status: query.status,
      }),
    ]);

    const aggregateByUser = new Map(
      orderAggregates.map((entry) => [entry.user_id, entry]),
    );

    const customersWithOrders = orderAggregates.length;
    const returningCustomers = orderAggregates.filter(
      (entry) => (entry._count?._all || 0) > 1,
    ).length;
    const totalRevenueGenerated = orderAggregates.reduce(
      (sum, entry) => sum + (entry._sum?.total_amount || 0),
      0,
    );

    const [totalCustomers, activeCustomers, newCustomersThisMonth] = await Promise.all([
      this.adminAnalyticsRepository.countCustomers(),
      this.adminAnalyticsRepository.countCustomers({ status: 'ACTIVE' }),
      this.adminAnalyticsRepository.countCustomers({
        created_at: { gte: monthStart },
      }),
    ]);

    const rows = users.map((user) => {
      const aggregate = aggregateByUser.get(user.id);
      const orderCount = aggregate?._count?._all || 0;
      const lifetimeSpend = Math.round(aggregate?._sum?.total_amount || 0);
      const averageOrderValue = orderCount
        ? Math.round(lifetimeSpend / orderCount)
        : 0;
      const name = user.profile?.name || user.email?.split('@')[0] || 'User';

      return {
        id: user.id,
        name,
        email: user.email,
        phone: user.mobile || null,
        avatarInitial: name[0]?.toUpperCase() || 'U',
        orderCount,
        lifetimeSpend,
        averageOrderValue,
        lastOrderDate: aggregate?._max?.created_at || null,
        status: (user.status || 'ACTIVE').toLowerCase(),
        registrationDate: user.created_at,
      };
    });

    const sort = String(query.sort || 'highest_spend').toLowerCase();
    const sorted = [...rows].sort((left, right) => {
      switch (sort) {
        case 'lowest_spend':
          return left.lifetimeSpend - right.lifetimeSpend;
        case 'most_orders':
          return right.orderCount - left.orderCount;
        case 'newest_customer':
          return new Date(right.registrationDate) - new Date(left.registrationDate);
        case 'oldest_customer':
          return new Date(left.registrationDate) - new Date(right.registrationDate);
        case 'highest_spend':
        default:
          return right.lifetimeSpend - left.lifetimeSpend;
      }
    });

    const paginated = this.adminAnalyticsRepository.paginateItems(
      sorted,
      query.page,
      query.limit,
    );

    return {
      summary: {
        totalCustomers,
        activeCustomers,
        returningCustomers,
        newCustomersThisMonth,
        totalRevenueGenerated: Math.round(totalRevenueGenerated),
        averageCustomerSpend: customersWithOrders
          ? Math.round(totalRevenueGenerated / customersWithOrders)
          : 0,
      },
      items: paginated.items,
      meta: paginated.meta,
    };
  }

  async getAnalyticsProducts(query = {}) {
    const [
      [purchaseAgg, returnAgg, wishlistAgg, cartAgg],
      products,
    ] = await Promise.all([
      this.adminAnalyticsRepository.getProductEngagementAggregates(),
      this.adminAnalyticsRepository.findProductsForAnalytics({
        search: query.search,
        category: query.category,
        stock: query.stock,
      }),
    ]);

    const purchasesByProduct = new Map(
      purchaseAgg.map((entry) => [entry.product_id, entry]),
    );
    const returnsByProduct = new Map(
      returnAgg.map((entry) => [entry.product_id, entry]),
    );
    const wishlistByProduct = new Map(
      wishlistAgg.map((entry) => [entry.product_id, entry]),
    );
    const cartByProduct = new Map(
      cartAgg.map((entry) => [entry.product_id, entry]),
    );

    const rows = products.map((product) => {
      const purchase = purchasesByProduct.get(product.id);
      const purchaseCount = purchase?._count?._all || 0;
      const revenueGenerated = Math.round(purchase?._sum?.total_amount || 0);
      const returnCount = returnsByProduct.get(product.id)?._count?._all || 0;
      const wishlistCount = wishlistByProduct.get(product.id)?._count?._all
        || product.wishlist_count
        || 0;
      const cartCount = cartByProduct.get(product.id)?._count?._all || 0;
      const primaryImage = product.images?.[0];

      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        productType: resolveAdminProductTypeDisplay(product),
        brand: product.brand,
        imageUrl: this.storagePathResolver.toPublicUrl(
          primaryImage?.url || product.image_url,
        ),
        purchaseCount,
        revenueGenerated,
        wishlistCount,
        cartCount,
        returnCount,
        rating: product.rating_avg ?? null,
        stock: product.stock_quantity ?? 0,
        publishedStatus: this.productCmsService.resolveStatusLabel(product),
        isActive: product.is_active,
      };
    });

    const filter = String(query.filter || '').toLowerCase();
    const filtered = rows.filter((row) => {
      if (filter === 'most_wishlisted') {
        return row.wishlistCount > 0;
      }
      if (filter === 'highest_returns') {
        return row.returnCount > 0;
      }
      if (filter === 'lowest_stock') {
        return row.stock <= 10;
      }
      return true;
    });

    const sort = String(query.sort || 'purchase_count').toLowerCase();
    const sorted = [...filtered].sort((left, right) => {
      switch (sort) {
        case 'wishlist_count':
          return right.wishlistCount - left.wishlistCount;
        case 'cart_count':
          return right.cartCount - left.cartCount;
        case 'revenue':
          return right.revenueGenerated - left.revenueGenerated;
        case 'returns':
          return right.returnCount - left.returnCount;
        case 'rating':
          return (right.rating || 0) - (left.rating || 0);
        case 'stock':
          return left.stock - right.stock;
        case 'purchase_count':
        default:
          return right.purchaseCount - left.purchaseCount;
      }
    });

    if (filter === 'best_selling') {
      sorted.sort((left, right) => right.purchaseCount - left.purchaseCount);
    } else if (filter === 'highest_revenue') {
      sorted.sort((left, right) => right.revenueGenerated - left.revenueGenerated);
    } else if (filter === 'highest_rating') {
      sorted.sort((left, right) => (right.rating || 0) - (left.rating || 0));
    }

    const paginated = this.adminAnalyticsRepository.paginateItems(
      sorted,
      query.page,
      query.limit,
    );

    const bestSelling = [...rows].sort((a, b) => b.purchaseCount - a.purchaseCount)[0] || null;
    const mostWishlisted = [...rows].sort((a, b) => b.wishlistCount - a.wishlistCount)[0] || null;
    const mostAddedToCart = [...rows].sort((a, b) => b.cartCount - a.cartCount)[0] || null;

    return {
      summary: {
        bestSellingProduct: bestSelling?.name || null,
        totalUnitsSold: rows.reduce((sum, row) => sum + row.purchaseCount, 0),
        totalRevenue: rows.reduce((sum, row) => sum + row.revenueGenerated, 0),
        totalReturns: rows.reduce((sum, row) => sum + row.returnCount, 0),
        mostWishlistedProduct: mostWishlisted?.name || null,
        mostAddedToCartProduct: mostAddedToCart?.name || null,
      },
      items: paginated.items,
      meta: paginated.meta,
    };
  }

  formatAdminUser(user, detailed = false) {
    const name = user.profile?.name || user.email?.split('@')[0] || 'User';
    const plan = user.profile?.preferences?.plan || 'Free';
    const deliveredOrders = user.orders?.filter(
      (order) => [ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED].includes(order.status),
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
    return this.productCmsService.formatLegacyProduct(product);
  }
}
