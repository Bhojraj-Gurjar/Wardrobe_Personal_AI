import { ORDER_STATUS } from '../../orders/validators/order.constants';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const COMPLETED_STATUSES = new Set([
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.COMPLETED,
]);

const CANCELLED_STATUSES = new Set([ORDER_STATUS.CANCELLED]);

const RETURNED_STATUSES = new Set([
  ORDER_STATUS.RETURNED,
  ORDER_STATUS.REFUNDED,
]);

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
}

function weekKey(date) {
  const start = startOfDay(date);
  const day = start.getDay();
  const diff = (day + 6) % 7;
  start.setDate(start.getDate() - diff);
  return start.toISOString().slice(0, 10);
}

function quarterKey(date) {
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()}-Q${quarter}`;
}

function yearKey(date) {
  return String(date.getFullYear());
}

function bucketKey(date, period) {
  switch (period) {
    case 'weekly':
      return weekKey(date);
    case 'quarterly':
      return quarterKey(date);
    case 'yearly':
      return yearKey(date);
    case 'monthly':
    default:
      return monthKey(date);
  }
}

function formatBucketLabel(key, period) {
  if (period === 'weekly') {
    return new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  if (period === 'quarterly') {
    return key.replace('-', ' ');
  }

  if (period === 'yearly') {
    return key;
  }

  const [year, month] = key.split('-');
  return MONTH_LABELS[Number(month)] || key;
}

function buildBucketRange(period, count = 6) {
  const buckets = [];
  const now = new Date();

  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(now);

    if (period === 'weekly') {
      date.setDate(date.getDate() - index * 7);
    } else if (period === 'quarterly') {
      date.setMonth(date.getMonth() - index * 3);
    } else if (period === 'yearly') {
      date.setFullYear(date.getFullYear() - index);
    } else {
      date.setMonth(date.getMonth() - index);
    }

    const key = bucketKey(date, period);
    if (!buckets.find((bucket) => bucket.key === key)) {
      buckets.push({ key, label: formatBucketLabel(key, period) });
    }
  }

  return buckets;
}

export function buildUserGrowthSeries(users = [], orders = [], period = 'monthly') {
  const buckets = buildBucketRange(period, period === 'yearly' ? 5 : 6);
  const bucketMap = new Map(
    buckets.map((bucket) => [bucket.key, {
      ...bucket,
      newUsers: 0,
      returningUsers: 0,
      totalUsers: 0,
      growthPercent: 0,
    }]),
  );

  const usersById = new Map(users.map((user) => [user.id, user]));
  const returningSets = new Map(buckets.map((bucket) => [bucket.key, new Set()]));

  for (const user of users) {
    const key = bucketKey(new Date(user.created_at), period);
    if (!bucketMap.has(key)) {
      continue;
    }
    bucketMap.get(key).newUsers += 1;
  }

  for (const order of orders) {
    if (!order.user_id || CANCELLED_STATUSES.has(order.status)) {
      continue;
    }

    const user = usersById.get(order.user_id);
    if (!user) {
      continue;
    }

    const orderDate = new Date(order.created_at);
    const key = bucketKey(orderDate, period);
    const bucket = bucketMap.get(key);

    if (!bucket) {
      continue;
    }

    const userCreated = new Date(user.created_at);
    const bucketStart = resolveBucketStart(key, period);

    if (userCreated < bucketStart) {
      returningSets.get(key)?.add(order.user_id);
    }
  }

  for (const [key, bucket] of bucketMap.entries()) {
    bucket.returningUsers = returningSets.get(key)?.size || 0;
  }

  const series = [...bucketMap.values()].map((bucket, index, list) => {
    const totalUsers = bucket.newUsers + bucket.returningUsers;
    const previous = index > 0 ? list[index - 1].totalUsers : 0;
    const growthPercent = previous
      ? Math.round(((totalUsers - previous) / previous) * 100)
      : totalUsers > 0 ? 100 : 0;

    return {
      month: bucket.label,
      label: bucket.label,
      key: bucket.key,
      newUsers: bucket.newUsers,
      returningUsers: bucket.returningUsers,
      totalUsers,
      growthPercent,
    };
  });

  return series;
}

function resolveBucketStart(key, period) {
  if (period === 'weekly') {
    return startOfDay(new Date(key));
  }

  if (period === 'quarterly') {
    const [year, quarterToken] = key.split('-Q');
    const quarter = Number(quarterToken) - 1;
    return new Date(Number(year), quarter * 3, 1);
  }

  if (period === 'yearly') {
    return new Date(Number(key), 0, 1);
  }

  const [year, month] = key.split('-');
  return new Date(Number(year), Number(month), 1);
}

export function normalizeDeviceType(deviceInfo) {
  const value = String(deviceInfo || '').trim().toLowerCase();

  if (!value) {
    return 'Unknown';
  }

  if (value.includes('tablet') || value.includes('ipad')) {
    return 'Tablet';
  }

  if (value.includes('mobile') || value.includes('phone') || value.includes('android') || value.includes('iphone')) {
    return 'Mobile';
  }

  if (value.includes('desktop') || value.includes('laptop')) {
    return 'Desktop';
  }

  return 'Unknown';
}

export function parseBrowserName(browserInfo) {
  const value = String(browserInfo || '');

  if (/Edg\//i.test(value)) return 'Edge';
  if (/Chrome\//i.test(value)) return 'Chrome';
  if (/Firefox\//i.test(value)) return 'Firefox';
  if (/Safari\//i.test(value)) return 'Safari';
  if (!value) return 'Unknown';
  return 'Other';
}

export function buildDeviceSplit(supportTickets = [], activeUserIds = []) {
  const deviceUsers = new Map();

  for (const ticket of supportTickets) {
    if (!ticket.user_id) {
      continue;
    }

    const device = normalizeDeviceType(ticket.device_info);
    const current = deviceUsers.get(device) || new Set();
    current.add(ticket.user_id);
    deviceUsers.set(device, current);
  }

  const classifiedUsers = new Set();
  for (const users of deviceUsers.values()) {
    for (const userId of users) {
      classifiedUsers.add(userId);
    }
  }

  const unknownUsers = activeUserIds.filter((userId) => !classifiedUsers.has(userId));

  if (unknownUsers.length) {
    deviceUsers.set('Unknown', new Set(unknownUsers));
  }

  const total = [...deviceUsers.values()].reduce((sum, users) => sum + users.size, 0) || 1;

  return [...deviceUsers.entries()]
    .map(([device, users]) => ({
      device,
      users: users.size,
      count: users.size,
      percentage: Math.round((users.size / total) * 1000) / 10,
    }))
    .sort((a, b) => b.users - a.users);
}

export function buildOrdersPerMonth(orders = [], months = 6) {
  const buckets = buildBucketRange('monthly', months);
  const bucketMap = new Map(
    buckets.map((bucket) => [bucket.key, {
      month: bucket.label,
      key: bucket.key,
      orders: 0,
      completed: 0,
      cancelled: 0,
      returned: 0,
      revenue: 0,
    }]),
  );

  for (const order of orders) {
    const key = monthKey(new Date(order.created_at));
    const bucket = bucketMap.get(key);

    if (!bucket) {
      continue;
    }

    bucket.orders += 1;

    if (COMPLETED_STATUSES.has(order.status)) {
      bucket.completed += 1;
      bucket.revenue += Number(order.total_amount) || 0;
    } else if (CANCELLED_STATUSES.has(order.status)) {
      bucket.cancelled += 1;
    } else if (RETURNED_STATUSES.has(order.status)) {
      bucket.returned += 1;
    } else if (order.status !== ORDER_STATUS.CANCELLED) {
      bucket.revenue += Number(order.total_amount) || 0;
    }
  }

  return [...bucketMap.values()].map((bucket) => ({
    ...bucket,
    revenue: Math.round(bucket.revenue),
  }));
}

export function buildTopCategories({
  orders = [],
  products = [],
  wishlistCounts = [],
  cartCounts = [],
}) {
  const categoryMap = new Map();

  const ensureCategory = (category) => {
    const key = category || 'Other';

    if (!categoryMap.has(key)) {
      categoryMap.set(key, {
        category: key,
        count: 0,
        products: 0,
        purchases: 0,
        revenue: 0,
        wishlistCount: 0,
        cartCount: 0,
      });
    }

    return categoryMap.get(key);
  };

  for (const product of products) {
    const row = ensureCategory(product.category);
    row.products += product._count?._all || 1;
  }

  for (const order of orders) {
    if (CANCELLED_STATUSES.has(order.status)) {
      continue;
    }

    const category = order.product?.category || 'Other';
    const row = ensureCategory(category);
    row.purchases += 1;
    row.count += 1;
    row.revenue += Number(order.total_amount) || 0;
  }

  for (const item of wishlistCounts) {
    const category = item.category || 'Other';
    const row = ensureCategory(category);
    row.wishlistCount += item._count?._all || 0;
  }

  for (const item of cartCounts) {
    const category = item.category || 'Other';
    const row = ensureCategory(category);
    row.cartCount += item._count?._all || 0;
  }

  return [...categoryMap.values()]
    .map((row) => ({
      ...row,
      revenue: Math.round(row.revenue),
    }))
    .sort((a, b) => b.revenue - a.revenue || b.purchases - a.purchases)
    .slice(0, 8);
}

export function summarizeUserGrowth(users = [], orders = []) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const activeUserIds = new Set();

  for (const order of orders) {
    if (order.user_id && !CANCELLED_STATUSES.has(order.status)) {
      activeUserIds.add(order.user_id);
    }
  }

  const orderCounts = new Map();
  for (const order of orders) {
    if (!order.user_id || CANCELLED_STATUSES.has(order.status)) {
      continue;
    }
    orderCounts.set(order.user_id, (orderCounts.get(order.user_id) || 0) + 1);
  }

  const totalUsers = users.length;
  const newUsers = users.filter((user) => new Date(user.created_at) >= monthStart).length;
  const returningUsers = [...orderCounts.entries()].filter(([, count]) => count > 1).length;
  const activeUsers = activeUserIds.size;
  const previousMonthUsers = users.filter((user) => {
    const created = new Date(user.created_at);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return created >= prevStart && created <= prevEnd;
  }).length;

  const growthPercent = previousMonthUsers
    ? Math.round(((newUsers - previousMonthUsers) / previousMonthUsers) * 100)
    : newUsers > 0 ? 100 : 0;

  return {
    totalUsers,
    newUsers,
    returningUsers,
    activeUsers,
    growthPercent,
  };
}

export function summarizeOrderAnalytics(orders = []) {
  let totalOrders = 0;
  let delivered = 0;
  let cancelled = 0;
  let returned = 0;
  let revenue = 0;

  for (const order of orders) {
    totalOrders += 1;

    if (COMPLETED_STATUSES.has(order.status)) {
      delivered += 1;
      revenue += Number(order.total_amount) || 0;
    } else if (CANCELLED_STATUSES.has(order.status)) {
      cancelled += 1;
    } else if (RETURNED_STATUSES.has(order.status)) {
      returned += 1;
    } else {
      revenue += Number(order.total_amount) || 0;
    }
  }

  return {
    totalOrders,
    delivered,
    cancelled,
    returned,
    revenue: Math.round(revenue),
    averageOrderValue: totalOrders ? Math.round(revenue / totalOrders) : 0,
  };
}

export function buildDeviceAnalyticsRows(supportTickets = [], productViews = [], searches = []) {
  const rows = new Map();

  const upsert = (key, patch) => {
    const current = rows.get(key) || {
      device: 'Unknown',
      browser: 'Unknown',
      os: 'Unknown',
      resolution: '—',
      sessions: 0,
      bounceRate: 0,
      avgSessionDuration: '0m',
    };

    rows.set(key, { ...current, ...patch });
  };

  for (const ticket of supportTickets) {
    const device = normalizeDeviceType(ticket.device_info);
    const browser = parseBrowserName(ticket.browser_info);
    const os = ticket.os_info || 'Unknown';
    const key = `${device}|${browser}|${os}`;

    upsert(key, {
      device,
      browser,
      os,
      sessions: (rows.get(key)?.sessions || 0) + 1,
    });
  }

  const viewsByUser = new Map();
  for (const view of productViews) {
    if (!viewsByUser.has(view.user_id)) {
      viewsByUser.set(view.user_id, []);
    }
    viewsByUser.get(view.user_id).push(new Date(view.viewed_at).getTime());
  }

  const singleViewUsers = [...viewsByUser.values()].filter((timestamps) => timestamps.length === 1).length;
  const totalViewUsers = viewsByUser.size;
  const bounceRate = totalViewUsers
    ? Math.round((singleViewUsers / totalViewUsers) * 100)
    : 0;

  const durations = [...viewsByUser.values()].map((timestamps) => {
    if (timestamps.length < 2) {
      return 1;
    }
    const sorted = [...timestamps].sort((a, b) => a - b);
    return Math.max(1, Math.round((sorted[sorted.length - 1] - sorted[0]) / 60000));
  });

  const avgMinutes = durations.length
    ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
    : 0;

  if (!rows.size) {
    upsert('engagement', {
      device: 'Unknown',
      browser: 'Unknown',
      os: 'Unknown',
      sessions: productViews.length + searches.length,
      bounceRate,
      avgSessionDuration: `${avgMinutes}m`,
    });
  } else {
    for (const [key, row] of rows.entries()) {
      rows.set(key, {
        ...row,
        bounceRate,
        avgSessionDuration: `${avgMinutes}m`,
      });
    }
  }

  return [...rows.values()].sort((a, b) => b.sessions - a.sessions);
}

export function buildDistribution(items = [], labelKey, valueKey = 'count') {
  const total = items.reduce((sum, item) => sum + (item[valueKey] || 0), 0) || 1;

  return items.map((item) => ({
    label: item[labelKey],
    value: item[valueKey] || 0,
    percentage: Math.round(((item[valueKey] || 0) / total) * 1000) / 10,
  }));
}

export function filterUsersForGrowth(users = [], filters = {}) {
  return users.filter((user) => {
    if (filters.status === 'active' && user.status !== 'ACTIVE') {
      return false;
    }

    if (filters.status === 'inactive' && user.status === 'ACTIVE') {
      return false;
    }

    const plan = user.profile?.preferences?.plan || 'free';

    if (filters.plan === 'premium' && String(plan).toLowerCase() !== 'premium') {
      return false;
    }

    if (filters.plan === 'free' && String(plan).toLowerCase() === 'premium') {
      return false;
    }

    if (filters.source) {
      const source = user.face_registration?.id ? 'face' : 'email';
      if (source !== filters.source) {
        return false;
      }
    }

    return true;
  });
}

export function filterOrdersForAnalytics(orders = [], filters = {}) {
  const { startDate, endDate, status, paymentMethod } = filters;

  return orders.filter((order) => {
    const created = new Date(order.created_at);

    if (startDate && created < new Date(startDate)) {
      return false;
    }

    if (endDate && created > new Date(endDate)) {
      return false;
    }

    if (status && order.status !== status) {
      return false;
    }

    if (paymentMethod && order.payment_method !== paymentMethod) {
      return false;
    }

    return true;
  });
}
