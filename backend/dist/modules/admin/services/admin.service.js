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
const _orderstatusutil = require("../../orders/utils/order-status.util");
const _adminrepository = require("../repositories/admin.repository");
const _adminproductcmsservice = require("./admin-product-cms.service");
const _adminproductbulkservice = require("./admin-product-bulk.service");
const _productservice = require("../../products/services/product.service");
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
    constructor(adminRepository, productCmsService, productBulkService, authService, faceService, ordersService, orderOmsService, ordersRepository, storagePathResolver, productService){
        this.adminRepository = adminRepository;
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
        const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        const [totalUsers, activeUsers, ordersThisMonth, ordersPrevMonth, revenueThisMonth, revenuePrevMonth, [monthlyOrders, monthlyUsers], categoryOrders] = await Promise.all([
            this.adminRepository.countUsers(),
            this.adminRepository.countActiveUsers(),
            this.adminRepository.countOrders({
                created_at: {
                    gte: monthStart
                }
            }),
            this.adminRepository.countOrders({
                created_at: {
                    gte: prevMonthStart,
                    lte: prevMonthEnd
                }
            }),
            this.adminRepository.aggregateOrderRevenue({
                created_at: {
                    gte: monthStart
                }
            }),
            this.adminRepository.aggregateOrderRevenue({
                created_at: {
                    gte: prevMonthStart,
                    lte: prevMonthEnd
                }
            }),
            this.adminRepository.getMonthlyStats(6),
            this.adminRepository.groupOrdersByCategory()
        ]);
        const revenue = Math.round(revenueThisMonth._sum.total_amount || 0);
        const prevRevenue = Math.round(revenuePrevMonth._sum.total_amount || 0);
        const conversionRate = totalUsers ? Math.round(ordersThisMonth / totalUsers * 1000) / 10 : 0;
        const prevConversion = totalUsers ? Math.round(ordersPrevMonth / totalUsers * 1000) / 10 : 0;
        const revenueByMonth = new Map();
        const usersByMonth = new Map();
        for (const order of monthlyOrders){
            const key = `${order.created_at.getFullYear()}-${order.created_at.getMonth()}`;
            revenueByMonth.set(key, (revenueByMonth.get(key) || 0) + order.total_amount);
        }
        for (const user of monthlyUsers){
            const key = `${user.created_at.getFullYear()}-${user.created_at.getMonth()}`;
            usersByMonth.set(key, (usersByMonth.get(key) || 0) + 1);
        }
        const revenueUsersChart = [];
        for(let index = 5; index >= 0; index -= 1){
            const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            revenueUsersChart.push({
                month: MONTH_LABELS[date.getMonth()],
                revenue: Math.round(revenueByMonth.get(key) || 0),
                users: usersByMonth.get(key) || 0
            });
        }
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
                    trend: buildTrend(activeUsers, totalUsers - activeUsers)
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
            revenueUsersChart,
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
    async getAnalytics() {
        const [totalUsers, faceCount, bodyCount, dnaCount, [monthlyOrders, monthlyUsers], commerce] = await Promise.all([
            this.adminRepository.countUsers(),
            this.adminRepository.countUsersWithFaceAnalysis(),
            this.adminRepository.countUsersWithBodyAnalysis(),
            this.adminRepository.countUsersWithFashionDna(),
            this.adminRepository.getMonthlyStats(6),
            this.getOrdersAnalytics()
        ]);
        const aiAdoption = totalUsers ? Math.round(Math.max(faceCount, bodyCount, dnaCount) / totalUsers * 100) : 0;
        const userGrowthChart = [];
        for(let index = 5; index >= 0; index -= 1){
            const date = new Date();
            date.setMonth(date.getMonth() - index);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            const newUsers = monthlyUsers.filter((user)=>`${user.created_at.getFullYear()}-${user.created_at.getMonth()}` === key).length;
            userGrowthChart.push({
                month: MONTH_LABELS[date.getMonth()],
                newUsers,
                returningUsers: Math.max(0, monthlyOrders.length - newUsers)
            });
        }
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
            userGrowthChart,
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
                _orderconstants.ORDER_STATUS.DELIVERED,
                _orderconstants.ORDER_STATUS.CANCELLED
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
            if (order.status === _orderconstants.ORDER_STATUS.DELIVERED) {
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
        const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const [dailyRevenue, monthlyRevenue, totalOrders, orders] = await Promise.all([
            this.adminRepository.aggregateOrderRevenue({
                created_at: {
                    gte: dayStart
                }
            }),
            this.adminRepository.aggregateOrderRevenue({
                created_at: {
                    gte: monthStart
                }
            }),
            this.adminRepository.countOrders({
                status: {
                    not: _orderconstants.ORDER_STATUS.CANCELLED
                }
            }),
            this.adminRepository.findOrdersWithUsers()
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
            customer.totalSpent += order.total_amount;
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
        const monthlyRev = monthlyRevenue._sum.total_amount || 0;
        return {
            dailyRevenue: Math.round(dailyRevenue._sum.total_amount || 0),
            monthlyRevenue: Math.round(monthlyRev),
            averageOrderValue: totalOrders ? Math.round(monthlyRev / totalOrders) : 0,
            totalOrders,
            topCustomers: [
                ...customerMap.values()
            ].sort((a, b)=>b.totalSpent - a.totalSpent).slice(0, 5),
            topProducts: [
                ...productMap.values()
            ].sort((a, b)=>b.quantitySold - a.quantitySold).slice(0, 5),
            revenueTrend: [],
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
    formatAdminUser(user, detailed = false) {
        const name = user.profile?.name || user.email?.split('@')[0] || 'User';
        const plan = user.profile?.preferences?.plan || 'Free';
        const deliveredOrders = user.orders?.filter((order)=>order.status === _orderconstants.ORDER_STATUS.DELIVERED).length || 0;
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
    _ts_param(1, (0, _common.Inject)(_adminproductcmsservice.AdminProductCmsService)),
    _ts_param(2, (0, _common.Inject)(_adminproductbulkservice.AdminProductBulkService)),
    _ts_param(3, (0, _common.Inject)(_authservice.AuthService)),
    _ts_param(4, (0, _common.Inject)(_faceservice.FaceService)),
    _ts_param(5, (0, _common.Inject)(_ordersservice.OrdersService)),
    _ts_param(6, (0, _common.Inject)(_orderomsservice.OrderOmsService)),
    _ts_param(7, (0, _common.Inject)(_ordersrepository.OrdersRepository)),
    _ts_param(8, (0, _common.Inject)(_storagepathresolverservice.StoragePathResolver)),
    _ts_param(9, (0, _common.Inject)(_productservice.ProductService)),
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
        void 0
    ])
], AdminService);

//# sourceMappingURL=admin.service.js.map