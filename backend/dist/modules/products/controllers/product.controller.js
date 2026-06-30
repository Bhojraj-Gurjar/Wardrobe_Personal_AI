"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ProductController", {
    enumerable: true,
    get: function() {
        return ProductController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _dtovalidationpipe = require("../../../common/pipes/dto-validation.pipe");
const _productservice = require("../services/product.service");
const _createproductdto = require("../dto/create-product.dto");
const _updateproductdto = require("../dto/update-product.dto");
const _queryproductsdto = require("../dto/query-products.dto");
const _searchproductsdto = require("../dto/search-products.dto");
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
const queryProductsPipe = (0, _dtovalidationpipe.DtoValidationPipe)(_queryproductsdto.QueryProductsDto);
const searchProductsPipe = (0, _dtovalidationpipe.DtoValidationPipe)(_searchproductsdto.SearchProductsDto);
const createProductPipe = (0, _dtovalidationpipe.DtoValidationPipe)(_createproductdto.CreateProductDto);
const updateProductPipe = (0, _dtovalidationpipe.DtoValidationPipe)(_updateproductdto.UpdateProductDto);
let ProductController = class ProductController {
    constructor(productService){
        this.productService = productService;
    }
    suggest(query) {
        return this.productService.suggestSearch(query);
    }
    search(query) {
        return this.productService.search(query);
    }
    findByCategory(category, query) {
        return this.productService.findByCategory(category, query);
    }
    findAll(query) {
        return this.productService.findAll(query);
    }
    findOne(id) {
        return this.productService.findOne(id);
    }
    create(dto) {
        return this.productService.create(dto);
    }
    update(id, dto) {
        return this.productService.update(id, dto);
    }
    remove(id) {
        return this.productService.remove(id);
    }
};
_ts_decorate([
    (0, _common.Get)('search/suggest'),
    (0, _swagger.ApiOperation)({
        summary: 'Search autocomplete suggestions',
        description: 'Returns matching products, brands, categories, collections, and styles'
    }),
    (0, _swagger.ApiQuery)({
        name: 'q',
        required: false
    }),
    (0, _swagger.ApiQuery)({
        name: 'limit',
        required: false
    }),
    _ts_param(0, (0, _common.Query)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], ProductController.prototype, "suggest", null);
_ts_decorate([
    (0, _common.Get)('search'),
    (0, _swagger.ApiOperation)({
        summary: 'Search products',
        description: 'Full-text search with brand, category, color, and price range filters'
    }),
    (0, _swagger.ApiQuery)({
        name: 'q',
        required: false,
        description: 'Search query'
    }),
    (0, _swagger.ApiQuery)({
        name: 'search',
        required: false,
        description: 'Alias for q'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Search results retrieved successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 400,
        description: 'Search query is required'
    }),
    _ts_param(0, (0, _common.Query)(searchProductsPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], ProductController.prototype, "search", null);
_ts_decorate([
    (0, _common.Get)('category/:category'),
    (0, _swagger.ApiOperation)({
        summary: 'List products by category',
        description: 'Matches category group (e.g. MEN), subcategory slug (e.g. men-jackets), or legacy category_id'
    }),
    (0, _swagger.ApiParam)({
        name: 'category',
        example: 'men-jackets',
        description: 'Category group code, subcategory slug, or legacy category id'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Category products retrieved successfully'
    }),
    _ts_param(0, (0, _common.Param)('category')),
    _ts_param(1, (0, _common.Query)(queryProductsPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], ProductController.prototype, "findByCategory", null);
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: 'List products',
        description: 'Paginated catalog with brand, category, color, and price range filters'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Products retrieved successfully'
    }),
    _ts_param(0, (0, _common.Query)(queryProductsPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], ProductController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    (0, _swagger.ApiOperation)({
        summary: 'Get product by id'
    }),
    (0, _swagger.ApiParam)({
        name: 'id',
        description: 'Product UUID'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Product retrieved successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 404,
        description: 'Product not found'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], ProductController.prototype, "findOne", null);
_ts_decorate([
    (0, _common.Post)(),
    (0, _common.HttpCode)(201),
    (0, _swagger.ApiOperation)({
        summary: 'Create a catalog product'
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: 'Product created successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 409,
        description: 'SKU already exists'
    }),
    _ts_param(0, (0, _common.Body)(createProductPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], ProductController.prototype, "create", null);
_ts_decorate([
    (0, _common.Put)(':id'),
    (0, _swagger.ApiOperation)({
        summary: 'Update a product'
    }),
    (0, _swagger.ApiParam)({
        name: 'id',
        description: 'Product UUID'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Product updated successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 404,
        description: 'Product not found'
    }),
    (0, _swagger.ApiResponse)({
        status: 409,
        description: 'SKU already exists'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)(updateProductPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], ProductController.prototype, "update", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    (0, _swagger.ApiOperation)({
        summary: 'Delete a product'
    }),
    (0, _swagger.ApiParam)({
        name: 'id',
        description: 'Product UUID'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Product deleted successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 404,
        description: 'Product not found'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], ProductController.prototype, "remove", null);
ProductController = _ts_decorate([
    (0, _swagger.ApiTags)('products'),
    (0, _common.Controller)('products'),
    _ts_param(0, (0, _common.Inject)(_productservice.ProductService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], ProductController);

//# sourceMappingURL=product.controller.js.map