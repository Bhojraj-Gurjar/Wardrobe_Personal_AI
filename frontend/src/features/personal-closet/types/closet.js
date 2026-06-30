/**
 * @typedef {Object} ClosetOverview
 * @property {number} purchasedItems
 * @property {number} savedOutfits
 * @property {number} favoriteBrands
 * @property {number} favoriteColors
 */

/**
 * @typedef {Object} PurchasedClosetItem
 * @property {string} id
 * @property {string} orderId
 * @property {string} productId
 * @property {string} name
 * @property {string} brand
 * @property {string} category
 * @property {string} size
 * @property {string} color
 * @property {number} price
 * @property {string} currency
 * @property {string} [imageUrl]
 * @property {string} purchasedAt
 */

/**
 * @typedef {Object} SavedClosetOutfit
 * @property {string} id
 * @property {string} name
 * @property {string} [thumbnailUrl]
 * @property {number} productCount
 * @property {number} totalPrice
 * @property {string} source
 * @property {string} createdAt
 * @property {Array} items
 */

/**
 * @typedef {Object} FavoriteBrand
 * @property {string} id
 * @property {string} brandName
 * @property {string} [logoUrl]
 * @property {number} interactionCount
 * @property {string} preferredCategory
 */

/**
 * @typedef {Object} FavoriteColor
 * @property {string} id
 * @property {string} colorName
 * @property {string} hexCode
 * @property {number} usagePercent
 */

export {};
