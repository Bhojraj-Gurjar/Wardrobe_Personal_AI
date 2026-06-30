export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';

/** Public origin for `/uploads/...` assets (matches API host or same-origin proxy). */
export function resolveStorageOrigin() {
  if (process.env.NEXT_PUBLIC_STORAGE_ORIGIN) {
    return process.env.NEXT_PUBLIC_STORAGE_ORIGIN.replace(/\/$/, '');
  }

  if (API_BASE_URL.startsWith('http')) {
    return API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'http://localhost:3000';
}

export const API_TIMEOUT_MS = 30000;

/** Longer timeout for face embedding / Qdrant operations. */
export const FACE_AI_TIMEOUT_MS = 120000;

export const API_ENDPOINTS = {
  HEALTH: '/health',
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  USERS: {
    PROFILE: '/users/profile',
    ENSURE_ARTIFACTS: '/users/artifacts/ensure',
    MEDIA: '/users/media',
    MEDIA_LATEST: (module) => `/users/media/${encodeURIComponent(module)}/latest`,
    MEDIA_HISTORY: (module) => `/users/media/${encodeURIComponent(module)}/history`,
  },
  PRODUCTS: {
    BASE: '/products',
    BY_ID: (id) => `/products/${id}`,
    SEARCH: '/products/search',
    SEARCH_SUGGEST: '/products/search/suggest',
    BY_CATEGORY: (category) => `/products/category/${encodeURIComponent(category)}`,
  },
  RECOMMENDATIONS: '/recommendations',
  RECOMMENDATIONS_DAILY: '/recommendations/daily',
  RECOMMENDATIONS_SEASONAL: '/recommendations/seasonal',
  RECOMMENDATIONS_EVENT: '/recommendations/event',
  RECOMMENDATIONS_TRENDING: '/recommendations/trending',
  FASHION_DNA: {
    ME: '/fashion-dna/me',
    HISTORY: '/fashion-dna/history',
    GENERATE: '/fashion-dna/generate',
    UPDATE: '/fashion-dna/update',
  },
  WISHLIST: {
    BASE: '/wishlist',
    BY_ID: (id) => `/wishlist/${id}`,
  },
  CART: {
    BASE: '/cart',
    ITEMS: '/cart/items',
    ITEM_BY_ID: (id) => `/cart/items/${id}`,
    CHECKOUT: '/cart/checkout',
  },
  ORDERS: {
    BASE: '/orders',
    BY_ID: (id) => `/orders/${id}`,
    CANCEL: (id) => `/orders/${id}/cancel`,
    EVENTS: '/orders/events',
    NOTIFICATIONS: '/orders/notifications',
    NOTIFICATIONS_READ: '/orders/notifications/read',
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    EVENTS: '/notifications/events',
  },
  ADDRESSES: {
    BASE: '/addresses',
    BY_ID: (id) => `/addresses/${id}`,
  },
  STYLIST: {
    SUGGESTIONS: '/stylist/suggestions',
    SESSIONS: '/stylist/sessions',
    SESSION_BY_ID: (id) => `/stylist/sessions/${id}`,
    CHAT: '/stylist/chat',
  },
  FACE: {
    REGISTER: '/face/register',
    LOGIN: '/face/login',
    VERIFY: '/face/verify',
    LOGOUT: '/face/logout',
    PHOTO: '/face/photo',
  },
  FACE_ANALYSIS: {
    ME: '/face-analysis/me',
    ANALYZE: '/face-analysis/analyze',
    ANALYZE_CURRENT: '/face-analysis/analyze-current',
    UPDATE: '/face-analysis/update',
  },
  BODY_ANALYSIS: {
    ME: '/body-analysis/me',
    ANALYZE: '/body-analysis/analyze',
    ANALYZE_CURRENT: '/body-analysis/analyze-current',
    UPDATE: '/body-analysis/update',
  },
  AVATAR: {
    ME: '/avatar/me',
    GENERATE: '/avatar/generate',
    UPDATE: '/avatar',
    OUTFIT: '/avatar/outfit',
    GENERATION_PROFILE: '/avatar/generation-profile',
    SAVE_LOOK: '/avatar/outfit/save-look',
  },
  DIGITAL_AVATAR: {
    ME: '/digital-avatar/me',
    GENERATE: '/digital-avatar/generate',
    GENERATE_BASIC: '/digital-avatar/generate/basic',
    GENERATE_PREMIUM: '/digital-avatar/generate/premium',
    GENERATE_DIGITAL_TWIN: '/digital-avatar/generate/digital-twin',
    UPDATE: '/digital-avatar/update',
    ACTIVATE: (id) => `/digital-avatar/activate/${id}`,
    HISTORY: '/digital-avatar/history',
  },
  VIRTUAL_TRY_ON: {
    SETUP: '/virtual-try-on/setup',
    UPLOAD_PERSON: '/virtual-try-on/upload/person',
    CLEAR_SESSION_PHOTO: '/virtual-try-on/session/person/clear',
    PRODUCTS: '/virtual-try-on/products',
    PRODUCTS_BY_CATEGORY: (categoryId) => `/virtual-try-on/products/${encodeURIComponent(categoryId)}`,
    GENERATE: (productId) => `/virtual-try-on/generate/${encodeURIComponent(productId)}`,
    GENERATE_OUTFIT: '/virtual-try-on/generate-outfit',
    RESULTS: '/virtual-try-on/results',
    RESULT_BY_ID: (id) => `/virtual-try-on/results/${id}`,
    RESULT_SAVE_OUTFIT: (id) => `/virtual-try-on/results/${id}/save-outfit`,
    RESULT_ADD_TO_CLOSET: (id) => `/virtual-try-on/results/${id}/add-to-closet`,
    APPLY: '/virtual-try-on/apply',
    RESET: '/virtual-try-on/reset',
    SAVED_OUTFITS: '/virtual-try-on/saved-outfits',
    SAVED_OUTFIT_BY_ID: (id) => `/virtual-try-on/saved-outfits/${id}`,
  },
  PERSONAL_CLOSET: {
    OVERVIEW: '/personal-closet/overview',
    PURCHASED_ITEMS: '/personal-closet/purchased-items',
    PURCHASED_ITEM: (orderId, productId) =>
      `/personal-closet/purchased-items/${orderId}/${productId}`,
    OUTFITS: '/personal-closet/outfits',
    OUTFIT_BY_ID: (id) => `/personal-closet/outfits/${id}`,
    OUTFIT_ADD_TO_CART: (id) => `/personal-closet/outfits/${id}/add-to-cart`,
    FAVORITE_BRANDS: '/personal-closet/favorite-brands',
    FAVORITE_BRAND: (brandName) => `/personal-closet/favorite-brands/${brandName}`,
    FAVORITE_COLORS: '/personal-closet/favorite-colors',
    FAVORITE_COLOR: (colorName) => `/personal-closet/favorite-colors/${colorName}`,
    SEARCH: '/personal-closet/search',
  },
  USER_ACTIVITY: {
    PRODUCT_VIEWS: '/user-activity/product-views',
    SEARCHES: '/user-activity/searches',
    INTERACTIONS: '/user-activity/interactions',
  },
  DASHBOARD: {
    SUMMARY: '/dashboard/summary',
  },
  ADMIN: {
    LOGIN: '/admin/login',
    FACE_LOGIN: '/admin/face-login',
    REGISTER_FACE: '/admin/register-face',
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    PRODUCTS: '/admin/products',
    ANALYTICS: '/admin/analytics',
    ANALYTICS_CUSTOMERS: '/admin/analytics/customers',
    ANALYTICS_PRODUCTS: '/admin/analytics/products',
    ANALYTICS_USER_GROWTH: '/admin/analytics/user-growth',
    ANALYTICS_DEVICES: '/admin/analytics/devices',
    ANALYTICS_ORDERS: '/admin/analytics/orders',
    ANALYTICS_CATEGORIES: '/admin/analytics/categories',
    ORDERS: '/admin/orders',
    ORDER_BY_ID: (id) => `/admin/orders/${id}`,
    ORDER_EXPORT: '/admin/orders/export',
    ORDERS_SUMMARY: '/admin/orders/summary',
    ORDERS_USERS: '/admin/orders/users',
    ORDERS_ANALYTICS: '/admin/orders/analytics',
    ORDER_STATUS: (id) => `/admin/orders/${id}/status`,
    ORDER_CANCEL: (id) => `/admin/orders/${id}/cancel`,
    OMS_SUMMARY: '/admin/orders/oms/summary',
    OMS_BULK_ACCEPT: '/admin/orders/bulk/accept',
    OMS_EVENTS: '/admin/orders/oms/events',
    OMS_ACCEPT: (id) => `/admin/orders/${id}/accept`,
    OMS_HOLD: (id) => `/admin/orders/${id}/hold`,
    OMS_INVOICE: (id) => `/admin/orders/${id}/generate-invoice`,
    OMS_LABEL: (id) => `/admin/orders/${id}/generate-label`,
    OMS_PACKING: (id) => `/admin/orders/${id}/move-to-packing`,
    OMS_PACKING_CHECKLIST: (id) => `/admin/orders/${id}/packing-checklist`,
    OMS_PACKED: (id) => `/admin/orders/${id}/mark-packed`,
    OMS_QUICK_RTD: (id) => `/admin/orders/${id}/quick-mark-rtd`,
    OMS_RTD: (id) => `/admin/orders/${id}/mark-rtd`,
    OMS_DISPATCH: (id) => `/admin/orders/${id}/dispatch`,
    OMS_HANDOVER: (id) => `/admin/orders/${id}/mark-handover`,
    OMS_SHIPPED: (id) => `/admin/orders/${id}/mark-shipped`,
    OMS_DELIVERED: (id) => `/admin/orders/${id}/mark-delivered`,
    OMS_COMPLETED: (id) => `/admin/orders/${id}/mark-completed`,
    OMS_NOTE: (id) => `/admin/orders/${id}/notes`,
    OMS_TIMELINE: (id) => `/admin/orders/${id}/timeline`,
    PROFILE: '/admin/profile',
    USER_BY_ID: (id) => `/admin/users/${id}`,
    PRODUCT_BY_ID: (id) => `/admin/products/${encodeURIComponent(String(id ?? ''))}`,
    PRODUCT_CMS: '/admin/products/cms',
    PRODUCT_IMAGES: (id) => `/admin/products/${id}/images`,
    PRODUCT_INVENTORY: (id) => `/admin/products/${id}/inventory`,
    PRODUCT_INVENTORY_HISTORY: (id) => `/admin/products/${id}/inventory/history`,
    PRODUCT_BULK_VALIDATE: '/admin/products/bulk/validate',
    PRODUCT_BULK_IMPORT: '/admin/products/bulk/import',
    TOGGLE_PRODUCT: (id) => `/admin/products/${id}/toggle-status`,
    DEACTIVATE_USER: (id) => `/admin/users/${id}/deactivate`,
    CHANGE_PASSWORD: '/admin/change-password',
    SUPPORT_TICKETS: '/admin/support/tickets',
    SUPPORT_TICKET_BY_ID: (id) => `/admin/support/tickets/${id}`,
    SUPPORT_ANALYTICS: '/admin/support/analytics',
    SUPPORT_ASSIGNEES: '/admin/support/assignees',
    SUPPORT_EXPORT: '/admin/support/tickets/export',
    SUPPORT_EVENTS: '/admin/support/events',
    NOTIFICATIONS: {
      BASE: '/admin/notifications',
      EVENTS: '/admin/notifications/events',
    },
  },
  SUPPORT: {
    TICKETS: '/support/tickets',
    TICKET_BY_ID: (id) => `/support/tickets/${id}`,
    NOTIFICATIONS: '/support/notifications',
    EVENTS: '/support/events',
  },
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500,
};
