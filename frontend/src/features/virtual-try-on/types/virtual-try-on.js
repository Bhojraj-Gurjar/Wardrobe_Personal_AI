/**

 * @typedef {Object} VirtualTryOnProduct

 * @property {string} id

 * @property {string} name

 * @property {string|null} brand

 * @property {number} price

 * @property {string|null} currency

 * @property {string|null} category

 * @property {string|null} imageUrl

 */



/**

 * @typedef {Object} VirtualTryOnSetup

 * @property {boolean} ready

 * @property {string|null} message

 * @property {string|null} bodyPhoto

 * @property {string|null} bodyPhotoUrl

 * @property {boolean} hasTransparentCache

 */



/**

 * @typedef {Object} VirtualTryOnResult

 * @property {string} id

 * @property {string} userId

 * @property {string|null} productId

 * @property {string|null} bodyPhotoReference

 * @property {string|null} bodyPhotoUrl

 * @property {string|null} garmentImageUrl

 * @property {string|null} generatedImageUrl

 * @property {VirtualTryOnProduct|null} product

 * @property {string} createdAt

 */



export {};

