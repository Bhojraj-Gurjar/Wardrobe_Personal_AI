"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AdminService", {
    enumerable: true,
    get: function() {
        return AdminService;
    }
});
const _common = require("@nestjs/common");
const _bcryptjs = /*#__PURE__*/ _interop_require_wildcard(require("bcryptjs"));
const _crypto = require("crypto");
const _authservice = require("../../auth/services/auth.service");
const _faceservice = require("../../face/services/face.service");
const _ordersservice = require("../../orders/services/orders.service");
const _orderomsservice = require("../../orders/services/order-oms.service");
const _ordersrepository = require("../../orders/repositories/orders.repository");
const _ordertransitionutil = require("../../orders/utils/order-transition.util");
const _storagepathresolverservice = require("../../../storage/services/storage-path-resolver.service");
const _productcatalogmapper = require("../../products/utils/product-catalog.mapper");
const _producttypeconstants = require("../../products/constants/product-type.constants");
const _cmstaxonomyconstants = require("../constants/cms-taxonomy.constants");
const _userrole = require("../../../common/constants/user-role");
const _orderconstants = require("../../orders/validators/order.constants");
const _orderrevenueutil = require("../../orders/utils/order-revenue.util");
const _orderstatusutil = require("../../orders/utils/order-status.util");
const _adminrepository = require("../repositories/admin.repository");
const _adminanalyticsrepository = require("../repositories/admin-analytics.repository");
const _adminproductcmsservice = require("./admin-product-cms.service");
const _adminproductbulkservice = require("./admin-product-bulk.service");
const _productservice = require("../../products/services/product.service");
const _adminproducttypeutil = require("../utils/admin-product-type.util");
const _adminanalyticschartsutil = require("../utils/admin-analytics-charts.util");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
const BCRYPT_ROUNDS = 12;
const MONTH_LABELS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
];
function buildTrend(current, previous) {
    if (!previous) {
        return {
            value: current > 0 ? 100 : 0,
            direction: 'up'
        };
    }
    const delta = Math.round((current - previous) / previous * 100);
    return {
        value: Math.abs(delta),
        direction: delta >= 0 ? 'up' : 'down'
    };
}
function deriveStock(sku = '') {
    let hash = 0;
    for(let index = 0; index < sku.length; index += 1){
        hash = (hash + sku.charCodeAt(index) * (index + 5)) % 1000;
    }
    return 50 + hash % 200;
}
function deriveSoldCount(orderCount = 0, sku = '') {
    let hash = 0;
    for(let index = 0; index < sku.length; index += 1){
        hash = (hash + sku.charCodeAt(index) * (index + 11)) % 100;
    }
    return orderCount + hash;
}
let AdminService = class AdminService {
    constructor(adminRepository, adminAnalyticsRepository, productCmsService, productBulkService, authService, faceService, ordersService, orderOmsService, ordersRepository, storagePathResolver, productService){
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
        this.logger = new _common.Logger(AdminService.name);
    }
    async login(dto) {
        const user = await this.adminRepository.findUserByEmail(dto.email);
        if (!user || user.role !== _userrole.USER_ROLE.ADMIN) {
            throw new _common.UnauthorizedException('Invalid admin credentials');
        }
        const isPasswordValid = await _bcryptjs.compare(dto.password, user.password_hash);
        if (!isPasswordValid) {
            throw new _common.UnauthorizedException('Invalid admin credentials');
        }
        await this.authService.ensureActiveUser(user);
        return this.authService.buildAuthResponse(user);
    }
    async faceLogin(dto) {
        const response = await this.faceService.login(dto);
        const user = await this.adminRepository.findUserById(response.user?.id);
        if (!user || user.role !== _userrole.USER_ROLE.ADMIN) {
            throw new _common.ForbiddenException('Admin face login requires an admin account');
        }
        return {
            ...response,
            user: this.authService.sanitizeUser(user)
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
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        const chartStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        chartStart.setHours(0, 0, 0, 0);
        const [totalUsers, activeUsers, ordersThisMonth, ordersPrevMonth, revenueThisMonth, revenuePrevMonth, revenueOrders, monthlyUsers, categoryOrders, productViewsThisMonth, completedOrdersThisMonth, completedOrdersPrevMonth, engagedUsersThisMonth, engagedUsersPrevMonth] = await Promise.all([
            this.adminRepository.countUsers(),
            this.adminRepository.countActiveUsers(),
            this.adminRepository.countOrdersCreatedInRange(monthStart, monthEnd),
            this.adminRepository.countOrdersCreatedInRange(prevMonthStart, prevMonthEnd),
            this.adminRepository.aggregateNetRecognizedRevenue(monthStart, monthEnd),
            this.adminRepository.aggregateNetRecognizedRevenue(prevMonthStart, prevMonthEnd),
            this.adminRepository.getRevenueOrdersSince(chartStart),
            this.adminRepository.getMonthlyStats(6).then(([, users])=>users),
            this.adminRepository.groupOrdersByCategory({
                since: monthStart
            }),
            this.adminRepository.countProductViewsInRange(monthStart, monthEnd),
            this.adminRepository.countRecognizedOrdersInRange(monthStart, monthEnd),
            this.adminRepository.countRecognizedOrdersInRange(prevMonthStart, prevMonthEnd),
            this.adminRepository.countEngagedUsersInRange(monthStart, monthEnd),
            this.adminRepository.countEngagedUsersInRange(prevMonthStart, prevMonthEnd)
        ]);
        const revenue = revenueThisMonth.net;
        const prevRevenue = revenuePrevMonth.net;
        const conversionRate = productViewsThisMonth > 0 ? Math.round(completedOrdersThisMonth / productViewsThisMonth * 1000) / 10 : ordersThisMonth > 0 ? Math.round(completedOrdersThisMonth / ordersThisMonth * 1000) / 10 : 0;
        const prevConversion = ordersPrevMonth > 0 ? Math.round(completedOrdersPrevMonth / ordersPrevMonth * 1000) / 10 : 0;
        const revenueUsersChart = (0, _orderrevenueutil.buildMonthlyRevenueSeries)(revenueOrders, 6, MONTH_LABELS);
        const usersByMonth = new Map();
        for (const user of monthlyUsers){
            const key = `${user.created_at.getFullYear()}-${String(user.created_at.getMonth()).padStart(2, '0')}`;
            usersByMonth.set(key, (usersByMonth.get(key) || 0) + 1);
        }
        const revenueUsersChartWithUsers = revenueUsersChart.map((bucket)=>({
                ...bucket,
                users: usersByMonth.get(bucket.key) || 0
            }));
        const categoryTotals = new Map();
        const productTypeTotals = new Map();
        for (const order of categoryOrders){
            const category = order.product?.category || 'Other';
            categoryTotals.set(category, (categoryTotals.get(category) || 0) + order.total_amount);
            const productType = order.product?.product_type || (0, _producttypeconstants.inferProductType)(order.product || {});
            productTypeTotals.set(productType, (productTypeTotals.get(productType) || 0) + order.total_amount);
        }
        const salesByCategory = [
            ...categoryTotals.entries()
        ].map(([category, value])=>({
                category,
                value: Math.round(value)
            })).sort((a, b)=>b.value - a.value).slice(0, 6);
        const payload = {
            cards: {
                revenue: {
                    value: revenue,
                    trend: buildTrend(revenue, prevRevenue)
                },
                activeUsers: {
                    value: activeUsers,
                    trend: buildTrend(engagedUsersThisMonth, engagedUsersPrevMonth)
                },
                ordersThisMonth: {
                    value: ordersThisMonth,
                    trend: buildTrend(ordersThisMonth, ordersPrevMonth)
                },
                conversionRate: {
                    value: conversionRate,
                    trend: buildTrend(conversionRate, prevConversion)
                }
            },
            revenueUsersChart: revenueUsersChartWithUsers,
            salesByCategory,
            salesByProductType: [
                ...productTypeTotals.entries()
            ].map(([productType, value])=>({
                    productType,
                    value: Math.round(value)
                })).sort((a, b)=>b.value - a.value).slice(0, 8)
        };
        this.logger.log(`Dashboard query executed — users=${totalUsers} active=${activeUsers} ordersMonth=${ordersThisMonth} revenue=${revenue}`);
        return payload;
    }
    async getAnalytics(query = {}) {
        const chartBundle = await this.buildAnalyticsChartBundle({
            period: query.period || 'monthly'
        });
        const [totalUsers, faceCount, bodyCount, dnaCount, commerce] = await Promise.all([
            this.adminRepository.countUsers(),
            this.adminRepository.countUsersWithFaceAnalysis(),
            this.adminRepository.countUsersWithBodyAnalysis(),
            this.adminRepository.countUsersWithFashionDna(),
            this.getOrdersAnalytics()
        ]);
        const aiAdoption = totalUsers ? Math.round(Math.max(faceCount, bodyCount, dnaCount) / totalUsers * 100) : 0;
        return {
            cards: {
                avgSessionDuration: {
                    value: '4m 32s',
                    trend: buildTrend(272, 240)
                },
                bounceRate: {
                    value: '32%',
                    trend: buildTrend(32, 38)
                },
                pagesPerSession: {
                    value: '5.8',
                    trend: buildTrend(5.8, 5.1)
                },
                aiFeatureAdoption: {
                    value: `${aiAdoption}%`,
                    trend: buildTrend(aiAdoption, aiAdoption - 5)
                }
            },
            userGrowth: chartBundle.userGrowth,
            userGrowthChart: chartBundle.userGrowth,
            deviceSplit: chartBundle.deviceSplit,
            ordersPerMonth: chartBundle.ordersPerMonth,
            topCategories: chartBundle.topCategories,
            featureUsageChart: [
                {
                    feature: 'Face Analysis',
                    users: faceCount
                },
                {
                    feature: 'Body Analysis',
                    users: bodyCount
                },
                {
                    feature: 'Fashion DNA',
                    users: dnaCount
                },
                {
                    feature: 'Recommendations',
                    users: Math.round(totalUsers * 0.72)
                }
            ],
            commerce
        };
    }
    async buildAnalyticsChartBundle({ period = 'monthly' } = {}) {
        const [users, orders, supportTickets, productViews, searches, productCategories, wishlistItems, cartItems] = await Promise.all([
            this.adminAnalyticsRepository.getUsersForGrowthAnalytics(),
            this.adminAnalyticsRepository.getOrdersForGrowthAnalytics(),
            this.adminAnalyticsRepository.getSupportDeviceSignals(),
            this.adminAnalyticsRepository.getProductViewSignals(),
            this.adminAnalyticsRepository.getSearchSignals(),
            this.adminAnalyticsRepository.getProductCategoryCounts(),
            this.adminAnalyticsRepository.getWishlistCategoryCounts(),
            this.adminAnalyticsRepository.getCartCategoryCounts()
        ]);
        const activeUserIds = [
            ...new Set([
                ...orders.filter((order)=>order.user_id).map((order)=>order.user_id),
                ...productViews.map((item)=>item.user_id),
                ...searches.map((item)=>item.user_id)
            ])
        ];
        const wishlistCounts = this.groupEngagementByCategory(wishlistItems, 'wishlist');
        const cartCounts = this.groupEngagementByCategory(cartItems, 'cart');
        return {
            userGrowth: (0, _adminanalyticschartsutil.buildUserGrowthSeries)(users, orders, period),
            deviceSplit: (0, _adminanalyticschartsutil.buildDeviceSplit)(supportTickets, activeUserIds),
            ordersPerMonth: (0, _adminanalyticschartsutil.buildOrdersPerMonth)(orders, 6),
            topCategories: (0, _adminanalyticschartsutil.buildTopCategories)({
                orders,
                products: productCategories,
                wishlistCounts,
                cartCounts
            })
        };
    }
    groupEngagementByCategory(items = []) {
        const map = new Map();
        for (const item of items){
            const category = item.product?.category || 'Other';
            map.set(category, (map.get(category) || 0) + 1);
        }
        return [
            ...map.entries()
        ].map(([category, count])=>({
                category,
                _count: {
                    _all: count
                }
            }));
    }
    async getAnalyticsUserGrowth(query = {}) {
        const period = query.period || 'monthly';
        const [users, orders] = await Promise.all([
            this.adminAnalyticsRepository.getUsersForGrowthAnalytics(),
            this.adminAnalyticsRepository.getOrdersForGrowthAnalytics()
        ]);
        const filteredUsers = (0, _adminanalyticschartsutil.filterUsersForGrowth)(users, query);
        const filteredOrders = (0, _adminanalyticschartsutil.filterOrdersForAnalytics)(orders, query);
        const summary = (0, _adminanalyticschartsutil.summarizeUserGrowth)(filteredUsers, filteredOrders);
        return {
            summary,
            series: {
                selected: (0, _adminanalyticschartsutil.buildUserGrowthSeries)(filteredUsers, filteredOrders, period),
                daily: (0, _adminanalyticschartsutil.buildUserGrowthSeries)(filteredUsers, filteredOrders, 'weekly'),
                weekly: (0, _adminanalyticschartsutil.buildUserGrowthSeries)(filteredUsers, filteredOrders, 'weekly'),
                monthly: (0, _adminanalyticschartsutil.buildUserGrowthSeries)(filteredUsers, filteredOrders, 'monthly'),
                yearly: (0, _adminanalyticschartsutil.buildUserGrowthSeries)(filteredUsers, filteredOrders, 'yearly')
            }
        };
    }
    async getAnalyticsDevices(query = {}) {
        const [supportTickets, productViews, searches, orders] = await Promise.all([
            this.adminAnalyticsRepository.getSupportDeviceSignals(),
            this.adminAnalyticsRepository.getProductViewSignals(),
            this.adminAnalyticsRepository.getSearchSignals(),
            this.adminAnalyticsRepository.getOrdersForGrowthAnalytics()
        ]);
        const activeUserIds = [
            ...new Set([
                ...orders.filter((order)=>order.user_id).map((order)=>order.user_id),
                ...productViews.map((item)=>item.user_id),
                ...searches.map((item)=>item.user_id)
            ])
        ];
        const deviceSplit = (0, _adminanalyticschartsutil.buildDeviceSplit)(supportTickets, activeUserIds);
        const rows = (0, _adminanalyticschartsutil.buildDeviceAnalyticsRows)(supportTickets, productViews, searches);
        const browserMap = new Map();
        const osMap = new Map();
        for (const ticket of supportTickets){
            const browser = (0, _adminanalyticschartsutil.parseBrowserName)(ticket.browser_info);
            const os = ticket.os_info || 'Unknown';
            browserMap.set(browser, (browserMap.get(browser) || 0) + 1);
            osMap.set(os, (osMap.get(os) || 0) + 1);
        }
        return {
            summary: {
                totalSessions: productViews.length + searches.length,
                trackedDevices: deviceSplit.length,
                mobileShare: deviceSplit.find((item)=>item.device === 'Mobile')?.percentage || 0,
                desktopShare: deviceSplit.find((item)=>item.device === 'Desktop')?.percentage || 0
            },
            deviceSplit,
            browserDistribution: (0, _adminanalyticschartsutil.buildDistribution)([
                ...browserMap.entries()
            ].map(([label, count])=>({
                    label,
                    count
                })), 'label', 'count'),
            osDistribution: (0, _adminanalyticschartsutil.buildDistribution)([
                ...osMap.entries()
            ].map(([label, count])=>({
                    label,
                    count
                })), 'label', 'count'),
            rows
        };
    }
    async getAnalyticsOrders(query = {}) {
        const orders = await this.adminAnalyticsRepository.getOrdersWithCategory();
        const filtered = (0, _adminanalyticschartsutil.filterOrdersForAnalytics)(orders, query);
        const summary = (0, _adminanalyticschartsutil.summarizeOrderAnalytics)(filtered, query);
        return {
            summary,
            ordersPerMonth: (0, _adminanalyticschartsutil.buildOrdersPerMonth)(filtered, 12),
            statusDistribution: (0, _adminanalyticschartsutil.buildDistribution)([
                {
                    label: 'Delivered',
                    count: summary.delivered
                },
                {
                    label: 'Cancelled',
                    count: summary.cancelled
                },
                {
                    label: 'Returned',
                    count: summary.returned
                },
                {
                    label: 'Other',
                    count: Math.max(0, summary.totalOrders - summary.delivered - summary.cancelled - summary.returned)
                }
            ], 'label', 'count'),
            revenueTrend: (0, _adminanalyticschartsutil.buildOrdersPerMonth)(filtered, 12).map((item)=>({
                    month: item.month,
                    revenue: item.revenue,
                    orders: item.orders
                }))
        };
    }
    async getAnalyticsCategories(query = {}) {
        const [orders, productCategories, wishlistItems, cartItems, products, returnCounts] = await Promise.all([
            this.adminAnalyticsRepository.getOrdersWithCategory(),
            this.adminAnalyticsRepository.getProductCategoryCounts(),
            this.adminAnalyticsRepository.getWishlistCategoryCounts(),
            this.adminAnalyticsRepository.getCartCategoryCounts(),
            this.adminAnalyticsRepository.findProductsForAnalytics({
                category: query.category
            }),
            this.adminAnalyticsRepository.getCategoryReturnCounts()
        ]);
        const wishlistCounts = this.groupEngagementByCategory(wishlistItems);
        const cartCounts = this.groupEngagementByCategory(cartItems);
        const categories = (0, _adminanalyticschartsutil.buildTopCategories)({
            orders: (0, _adminanalyticschartsutil.filterOrdersForAnalytics)(orders, query),
            products: productCategories,
            wishlistCounts,
            cartCounts
        });
        const returnByProduct = new Map(returnCounts.map((entry)=>[
                entry.product_id,
                entry._count?._all || 0
            ]));
        const returnByCategory = new Map();
        for (const product of products){
            const returns = returnByProduct.get(product.id) || 0;
            if (!returns) {
                continue;
            }
            const category = product.category || 'Other';
            returnByCategory.set(category, (returnByCategory.get(category) || 0) + returns);
        }
        const items = categories.filter((item)=>!query.category || item.category.toLowerCase() === query.category.toLowerCase()).map((item)=>({
                ...item,
                returns: returnByCategory.get(item.category) || 0,
                rating: null
            }));
        return {
            summary: {
                totalCategories: items.length,
                topCategory: items[0]?.category || '—',
                totalRevenue: items.reduce((sum, item)=>sum + item.revenue, 0),
                totalPurchases: items.reduce((sum, item)=>sum + item.purchases, 0)
            },
            items,
            revenueByCategory: items.map((item)=>({
                    category: item.category,
                    revenue: item.revenue
                })),
            purchasesByCategory: items.map((item)=>({
                    category: item.category,
                    purchases: item.purchases
                })),
            wishlistByCategory: items.map((item)=>({
                    category: item.category,
                    wishlistCount: item.wishlistCount
                }))
        };
    }
    async getUsers(query) {
        const [users, total] = await this.adminRepository.findUsers(query);
        return {
            items: users.map((user)=>this.formatAdminUser(user)),
            meta: {
                total,
                page: query.page || 1,
                limit: query.limit || 50,
                totalPages: Math.ceil(total / (query.limit || 50)) || 1
            }
        };
    }
    async getUser(id) {
        const user = await this.adminRepository.findUserById(id);
        if (!user) {
            throw new _common.NotFoundException('User not found');
        }
        return this.formatAdminUser(user, true);
    }
    async updateUser(id, payload) {
        const existing = await this.adminRepository.findUserById(id);
        if (!existing) {
            throw new _common.NotFoundException('User not found');
        }
        const preferences = {
            ...existing.profile?.preferences || {},
            ...payload.plan ? {
                plan: payload.plan
            } : {}
        };
        const user = await this.adminRepository.updateUser(id, {
            name: payload.name,
            status: payload.status,
            preferences
        });
        return this.formatAdminUser(user, true);
    }
    async deactivateUser(id) {
        const user = await this.adminRepository.deactivateUser(id);
        if (!user) {
            throw new _common.NotFoundException('User not found');
        }
        return this.formatAdminUser(user, true);
    }
    async deleteUser(id) {
        const user = await this.adminRepository.findUserById(id);
        if (!user) {
            throw new _common.NotFoundException('User not found');
        }
        if (user.role === _userrole.USER_ROLE.ADMIN) {
            throw new _common.BadRequestException('Cannot delete admin users');
        }
        await this.adminRepository.deleteUser(id);
        await this.productService.invalidateCatalogCache();
        return {
            message: 'User deleted successfully'
        };
    }
    async inviteUser(payload) {
        const email = String(payload.email || '').trim().toLowerCase();
        const name = String(payload.name || '').trim();
        const plan = payload.plan || 'Free';
        if (!email || !name) {
            throw new _common.BadRequestException('Email and name are required');
        }
        const existing = await this.adminRepository.findUserByEmail(email);
        if (existing) {
            throw new _common.ConflictException('A user with this email already exists');
        }
        const providedPassword = String(payload.password || '').trim();
        const temporaryPassword = providedPassword || `Wa@${(0, _crypto.randomBytes)(4).toString('hex')}9`;
        const passwordHash = await _bcryptjs.hash(temporaryPassword, BCRYPT_ROUNDS);
        const user = await this.adminRepository.createInvitedUser({
            email,
            passwordHash,
            name,
            plan
        });
        return {
            message: 'User invited successfully',
            user: this.formatAdminUser(user, true),
            ...providedPassword ? {} : {
                temporaryPassword
            }
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
        if (!payload.productType || !(0, _producttypeconstants.isValidProductType)(payload.productType) && !(0, _cmstaxonomyconstants.isValidCmsProductType)(payload.productType)) {
            throw new _common.BadRequestException('A valid product type is required.');
        }
        return this.productCmsService.createProduct({
            sku: payload.sku,
            name: payload.name,
            brand: payload.brand,
            category: payload.category || (0, _producttypeconstants.resolveUiCategoryForProductType)(payload.productType) || 'Clothing',
            productType: payload.productType,
            sellingPrice: payload.price,
            stockQuantity: payload.stock,
            imageUrl: payload.imageUrl,
            visibility: payload.isActive === false ? 'HIDDEN' : 'PUBLISHED',
            isActive: payload.isActive !== false
        }, adminUserId);
    }
    async createCmsProduct(payload, adminUserId) {
        return this.productCmsService.createProduct(payload, adminUserId);
    }
    async updateProduct(id, payload, adminUserId) {
        if (this.isExtendedProductPayload(payload)) {
            return this.productCmsService.updateProduct(id, payload, adminUserId);
        }
        if (payload.productType !== undefined && !(0, _producttypeconstants.isValidProductType)(payload.productType)) {
            throw new _common.BadRequestException('Invalid product type.');
        }
        return this.productCmsService.updateProduct(id, {
            ...payload.name !== undefined ? {
                name: payload.name
            } : {},
            ...payload.brand !== undefined ? {
                brand: payload.brand
            } : {},
            ...payload.category !== undefined ? {
                category: payload.category
            } : {},
            ...payload.productType !== undefined ? {
                productType: payload.productType
            } : {},
            ...payload.price !== undefined ? {
                sellingPrice: payload.price
            } : {},
            ...payload.imageUrl !== undefined ? {
                images: payload.imageUrl ? [
                    {
                        url: payload.imageUrl,
                        isPrimary: true
                    }
                ] : []
            } : {},
            ...payload.isActive !== undefined ? {
                isActive: payload.isActive,
                visibility: payload.isActive ? 'PUBLISHED' : 'HIDDEN'
            } : {}
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
        return Boolean(payload?.variants?.length || payload?.images?.length || payload?.mrp != null || payload?.visibility || payload?.aiAttributes || payload?.description || payload?.gender || payload?.barcode || payload?.fabric || payload?.sellingPrice != null);
    }
    async deleteProduct(id) {
        await this.productCmsService.getProductDetail(id);
        try {
            const deleted = await this.productCmsService.deleteProduct(id);
            if (!deleted) {
                throw new _common.NotFoundException('Product not found');
            }
        } catch (error) {
            if (error instanceof _common.NotFoundException) {
                throw error;
            }
            const isForeignKeyViolation = error?.code === 'P2003' || String(error?.message || '').toLowerCase().includes('foreign key');
            if (isForeignKeyViolation) {
                this.logger.warn(`Hard delete blocked for product ${id}; archiving to preserve order history.`);
                const archived = await this.productCmsService.archiveProduct(id);
                if (!archived) {
                    throw new _common.NotFoundException('Product not found');
                }
            } else {
                this.logger.error(`Product delete failed for ${id}: ${error?.message || 'Unknown error'}`, error?.stack);
                throw new _common.BadRequestException(error?.message || 'Unable to delete product. Please try again.');
            }
        }
        await this.productService.invalidateCatalogCache(id);
        return {
            message: 'Product deleted successfully',
            id
        };
    }
    async toggleProductStatus(id) {
        const product = await this.adminRepository.toggleProductStatus(id);
        if (!product) {
            throw new _common.NotFoundException('Product not found');
        }
        await this.productService.invalidateCatalogCache(id);
        return this.productCmsService.formatLegacyProduct(product);
    }
    async getProfile(userId) {
        const user = await this.adminRepository.findUserById(userId);
        if (!user) {
            throw new _common.NotFoundException('Admin profile not found');
        }
        return {
            id: user.id,
            email: user.email,
            name: user.profile?.name || 'Admin',
            role: user.role,
            is_face_registered: user.face_registration?.is_face_registered ?? false,
            face_image_url: this.storagePathResolver.toPublicUrl(user.face_registration?.face_image_url)
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
            face_image_url: this.storagePathResolver.toPublicUrl(user.face_registration?.face_image_url)
        };
    }
    async changePassword(userId, payload) {
        const user = await this.adminRepository.findUserById(userId);
        if (!user) {
            throw new _common.NotFoundException('Admin not found');
        }
        const isValid = await _bcryptjs.compare(payload.currentPassword, user.password_hash);
        if (!isValid) {
            throw new _common.UnauthorizedException('Current password is incorrect');
        }
        const passwordHash = await _bcryptjs.hash(payload.newPassword, BCRYPT_ROUNDS);
        await this.adminRepository.updateAdminPassword(userId, passwordHash);
        return {
            message: 'Password updated successfully'
        };
    }
    async getOrdersSummary() {
        await this.ordersService.updateExpiredOrders();
        const [statusGroups, revenueAgg, totalOrders, cancelledOrders] = await Promise.all([
            this.adminRepository.groupOrdersByStatus(),
            this.adminRepository.aggregateOrderRevenue(),
            this.adminRepository.countOrders(),
            this.adminRepository.countOrders({
                status: _orderconstants.ORDER_STATUS.CANCELLED
            })
        ]);
        const statusCounts = {};
        let activeOrders = 0;
        for (const group of statusGroups){
            statusCounts[group.status] = group._count.status;
            if (![
                _orderconstants.ORDER_STATUS.COMPLETED,
                _orderconstants.ORDER_STATUS.DELIVERED,
                _orderconstants.ORDER_STATUS.CANCELLED,
                _orderconstants.ORDER_STATUS.ARCHIVED,
                _orderconstants.ORDER_STATUS.REFUNDED
            ].includes(group.status)) {
                activeOrders += group._count.status;
            }
        }
        return {
            totalOrders,
            totalRevenue: Math.round(revenueAgg._sum.total_amount || 0),
            activeOrders,
            cancelledOrders,
            statusCounts
        };
    }
    async getOrders(query) {
        await this.ordersService.updateExpiredOrders();
        const [orders, total] = await this.adminRepository.findOrders(query);
        return {
            items: orders.map((order)=>this.ordersService.formatOrder(order)),
            meta: {
                total,
                page: query.page || 1,
                limit: query.limit || 50,
                totalPages: Math.ceil(total / (query.limit || 50)) || 1
            }
        };
    }
    async getOrderById(id) {
        const order = await this.adminRepository.findOrderById(id);
        if (!order) {
            throw new _common.NotFoundException('Order not found');
        }
        return this.ordersService.formatOrder(order);
    }
    async getOrdersByUser(query) {
        await this.ordersService.updateExpiredOrders();
        const orders = await this.adminRepository.findOrdersWithUsers();
        const userMap = new Map();
        for (const order of orders){
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
                    lastOrderDate: null
                });
            }
            const row = userMap.get(userId);
            row.orders.push(formatted);
            row.orderCount += 1;
            row.totalSpent += order.total_amount;
            if ([
                _orderconstants.ORDER_STATUS.DELIVERED,
                _orderconstants.ORDER_STATUS.COMPLETED
            ].includes(order.status)) {
                row.deliveredCount += 1;
            }
            if (!row.lastOrderDate || order.created_at > row.lastOrderDate) {
                row.lastOrderDate = order.created_at;
            }
        }
        let items = [
            ...userMap.values()
        ];
        if (query.search) {
            const term = query.search.toLowerCase();
            items = items.filter((row)=>row.name.toLowerCase().includes(term) || (row.email || '').toLowerCase().includes(term));
        }
        return {
            items
        };
    }
    async getOrdersAnalytics() {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const [dailyRevenue, monthlyRevenue, totalOrders, completedOrders, orders, revenueOrders] = await Promise.all([
            this.ordersRepository.aggregateTodayRevenue(),
            this.adminRepository.aggregateNetRecognizedRevenue(monthStart, monthEnd),
            this.adminRepository.countOrdersCreatedInRange(monthStart, monthEnd),
            this.adminRepository.countRecognizedOrdersInRange(monthStart, monthEnd),
            this.adminRepository.findOrdersWithUsers(),
            this.adminRepository.getRevenueOrdersSince(new Date(now.getFullYear(), now.getMonth() - 11, 1))
        ]);
        const customerMap = new Map();
        const productMap = new Map();
        for (const order of orders){
            if (order.status === _orderconstants.ORDER_STATUS.CANCELLED) {
                continue;
            }
            const customerKey = order.user_id ?? '__deleted__';
            if (!customerMap.has(customerKey)) {
                customerMap.set(customerKey, {
                    userId: customerKey,
                    name: order.user?.profile?.name || order.user?.email || '[Deleted User]',
                    orderCount: 0,
                    totalSpent: 0
                });
            }
            const customer = customerMap.get(customerKey);
            customer.orderCount += 1;
            if ([
                _orderconstants.ORDER_STATUS.DELIVERED,
                _orderconstants.ORDER_STATUS.COMPLETED
            ].includes(order.status)) {
                customer.totalSpent += order.total_amount;
            }
            const productId = order.product_id;
            if (productId && order.product) {
                if (!productMap.has(productId)) {
                    productMap.set(productId, {
                        productId,
                        name: order.product.name,
                        brand: order.product.brand,
                        quantitySold: 0
                    });
                }
                productMap.get(productId).quantitySold += 1;
            }
        }
        const monthlyRev = monthlyRevenue.net;
        const revenueTrend = (0, _orderrevenueutil.buildMonthlyRevenueSeries)(revenueOrders, 12, MONTH_LABELS);
        return {
            dailyRevenue: Math.round(dailyRevenue._sum.total_amount || 0),
            monthlyRevenue: Math.round(monthlyRev),
            grossRevenue: monthlyRevenue.gross,
            refundAmount: monthlyRevenue.refunds,
            averageOrderValue: completedOrders ? Math.round(monthlyRevenue.gross / completedOrders) : 0,
            totalOrders,
            topCustomers: [
                ...customerMap.values()
            ].sort((a, b)=>b.totalSpent - a.totalSpent).slice(0, 5),
            topProducts: [
                ...productMap.values()
            ].sort((a, b)=>b.quantitySold - a.quantitySold).slice(0, 5),
            revenueTrend,
            ordersByStatus: []
        };
    }
    async updateOrderStatus(id, status) {
        const normalized = status === 'PENDING' ? _orderconstants.ORDER_STATUS.CREATED : status;
        const order = await this.adminRepository.findOrderById(id);
        if (!order) {
            throw new _common.NotFoundException('Order not found');
        }
        (0, _ordertransitionutil.assertValidStatusTransition)(order.status, normalized);
        const updated = await this.ordersRepository.updateStatus(id, normalized, {}, order.status);
        if (!updated) {
            throw new _common.BadRequestException('Order status changed concurrently. Please refresh and retry.');
        }
        return this.ordersService.formatOrder(updated);
    }
    async cancelOrder(id, adminId) {
        return this.orderOmsService.cancelOrder(id, adminId);
    }
    async exportOrdersCsv(query) {
        const { items } = await this.getOrders(query);
        const header = 'Order Number,Customer,Email,Status,Total,Created At\n';
        const rows = items.map((order)=>[
                order.order_number,
                order.user?.name || '[Deleted User]',
                order.user?.email || '',
                order.display_status || (0, _orderstatusutil.normalizeDisplayStatus)(order.status),
                order.total_amount,
                order.created_at
            ].map((value)=>`"${String(value ?? '').replace(/"/g, '""')}"`).join(','));
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
                status: query.status
            })
        ]);
        const aggregateByUser = new Map(orderAggregates.map((entry)=>[
                entry.user_id,
                entry
            ]));
        const customersWithOrders = orderAggregates.length;
        const returningCustomers = orderAggregates.filter((entry)=>(entry._count?._all || 0) > 1).length;
        const totalRevenueGenerated = orderAggregates.reduce((sum, entry)=>sum + (entry._sum?.total_amount || 0), 0);
        const [totalCustomers, activeCustomers, newCustomersThisMonth] = await Promise.all([
            this.adminAnalyticsRepository.countCustomers(),
            this.adminAnalyticsRepository.countCustomers({
                status: 'ACTIVE'
            }),
            this.adminAnalyticsRepository.countCustomers({
                created_at: {
                    gte: monthStart
                }
            })
        ]);
        const rows = users.map((user)=>{
            const aggregate = aggregateByUser.get(user.id);
            const orderCount = aggregate?._count?._all || 0;
            const lifetimeSpend = Math.round(aggregate?._sum?.total_amount || 0);
            const averageOrderValue = orderCount ? Math.round(lifetimeSpend / orderCount) : 0;
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
                registrationDate: user.created_at
            };
        });
        const sort = String(query.sort || 'highest_spend').toLowerCase();
        const sorted = [
            ...rows
        ].sort((left, right)=>{
            switch(sort){
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
        const paginated = this.adminAnalyticsRepository.paginateItems(sorted, query.page, query.limit);
        return {
            summary: {
                totalCustomers,
                activeCustomers,
                returningCustomers,
                newCustomersThisMonth,
                totalRevenueGenerated: Math.round(totalRevenueGenerated),
                averageCustomerSpend: customersWithOrders ? Math.round(totalRevenueGenerated / customersWithOrders) : 0
            },
            items: paginated.items,
            meta: paginated.meta
        };
    }
    async getAnalyticsProducts(query = {}) {
        const [[purchaseAgg, returnAgg, wishlistAgg, cartAgg], products] = await Promise.all([
            this.adminAnalyticsRepository.getProductEngagementAggregates(),
            this.adminAnalyticsRepository.findProductsForAnalytics({
                search: query.search,
                category: query.category,
                stock: query.stock
            })
        ]);
        const purchasesByProduct = new Map(purchaseAgg.map((entry)=>[
                entry.product_id,
                entry
            ]));
        const returnsByProduct = new Map(returnAgg.map((entry)=>[
                entry.product_id,
                entry
            ]));
        const wishlistByProduct = new Map(wishlistAgg.map((entry)=>[
                entry.product_id,
                entry
            ]));
        const cartByProduct = new Map(cartAgg.map((entry)=>[
                entry.product_id,
                entry
            ]));
        const rows = products.map((product)=>{
            const purchase = purchasesByProduct.get(product.id);
            const purchaseCount = purchase?._count?._all || 0;
            const revenueGenerated = Math.round(purchase?._sum?.total_amount || 0);
            const returnCount = returnsByProduct.get(product.id)?._count?._all || 0;
            const wishlistCount = wishlistByProduct.get(product.id)?._count?._all || product.wishlist_count || 0;
            const cartCount = cartByProduct.get(product.id)?._count?._all || 0;
            const primaryImage = product.images?.[0];
            return {
                id: product.id,
                sku: product.sku,
                name: product.name,
                category: product.category,
                productType: (0, _adminproducttypeutil.resolveAdminProductTypeDisplay)(product),
                brand: product.brand,
                imageUrl: this.storagePathResolver.toPublicUrl(primaryImage?.url || product.image_url),
                purchaseCount,
                revenueGenerated,
                wishlistCount,
                cartCount,
                returnCount,
                rating: product.rating_avg ?? null,
                stock: product.stock_quantity ?? 0,
                publishedStatus: this.productCmsService.resolveStatusLabel(product),
                isActive: product.is_active
            };
        });
        const filter = String(query.filter || '').toLowerCase();
        const filtered = rows.filter((row)=>{
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
        const sorted = [
            ...filtered
        ].sort((left, right)=>{
            switch(sort){
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
            sorted.sort((left, right)=>right.purchaseCount - left.purchaseCount);
        } else if (filter === 'highest_revenue') {
            sorted.sort((left, right)=>right.revenueGenerated - left.revenueGenerated);
        } else if (filter === 'highest_rating') {
            sorted.sort((left, right)=>(right.rating || 0) - (left.rating || 0));
        }
        const paginated = this.adminAnalyticsRepository.paginateItems(sorted, query.page, query.limit);
        const bestSelling = [
            ...rows
        ].sort((a, b)=>b.purchaseCount - a.purchaseCount)[0] || null;
        const mostWishlisted = [
            ...rows
        ].sort((a, b)=>b.wishlistCount - a.wishlistCount)[0] || null;
        const mostAddedToCart = [
            ...rows
        ].sort((a, b)=>b.cartCount - a.cartCount)[0] || null;
        return {
            summary: {
                bestSellingProduct: bestSelling?.name || null,
                totalUnitsSold: rows.reduce((sum, row)=>sum + row.purchaseCount, 0),
                totalRevenue: rows.reduce((sum, row)=>sum + row.revenueGenerated, 0),
                totalReturns: rows.reduce((sum, row)=>sum + row.returnCount, 0),
                mostWishlistedProduct: mostWishlisted?.name || null,
                mostAddedToCartProduct: mostAddedToCart?.name || null
            },
            items: paginated.items,
            meta: paginated.meta
        };
    }
    formatAdminUser(user, detailed = false) {
        const name = user.profile?.name || user.email?.split('@')[0] || 'User';
        const plan = user.profile?.preferences?.plan || 'Free';
        const deliveredOrders = user.orders?.filter((order)=>[
                _orderconstants.ORDER_STATUS.DELIVERED,
                _orderconstants.ORDER_STATUS.COMPLETED
            ].includes(order.status)).length || 0;
        const base = {
            id: user.id,
            name,
            email: user.email,
            plan,
            styleScore: user.fashion_dna?.fashion_confidence_score ? Math.round(user.fashion_dna.fashion_confidence_score) : null,
            orderCount: user.orders?.length || 0,
            deliveredOrders,
            joinedAt: user.created_at,
            status: (user.status || 'ACTIVE').toLowerCase(),
            avatarInitial: name[0]?.toUpperCase() || 'U'
        };
        if (!detailed) {
            return base;
        }
        return {
            ...base,
            mobile: user.mobile,
            preferences: user.profile?.preferences || {}
        };
    }
    formatAdminProduct(product) {
        return this.productCmsService.formatLegacyProduct(product);
    }
};
AdminService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_adminrepository.AdminRepository)),
    _ts_param(1, (0, _common.Inject)(_adminanalyticsrepository.AdminAnalyticsRepository)),
    _ts_param(2, (0, _common.Inject)(_adminproductcmsservice.AdminProductCmsService)),
    _ts_param(3, (0, _common.Inject)(_adminproductbulkservice.AdminProductBulkService)),
    _ts_param(4, (0, _common.Inject)(_authservice.AuthService)),
    _ts_param(5, (0, _common.Inject)(_faceservice.FaceService)),
    _ts_param(6, (0, _common.Inject)(_ordersservice.OrdersService)),
    _ts_param(7, (0, _common.Inject)(_orderomsservice.OrderOmsService)),
    _ts_param(8, (0, _common.Inject)(_ordersrepository.OrdersRepository)),
    _ts_param(9, (0, _common.Inject)(_storagepathresolverservice.StoragePathResolver)),
    _ts_param(10, (0, _common.Inject)(_productservice.ProductService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0,
        void 0,
        void 0,
        void 0,
        void 0,
        void 0,
        void 0,
        void 0,
        void 0,
        void 0
    ])
], AdminService);

//# sourceMappingURL=admin.service.js.map