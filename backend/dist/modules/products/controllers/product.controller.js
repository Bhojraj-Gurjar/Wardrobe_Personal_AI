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
const createProductPipe = (0, _dtovalidationpipe.DtoValidationPipe)(_createproductdto.CreateProductDto);
const updateProductPipe = (0, _dtovalidationpipe.DtoValidationPipe)(_updateproductdto.UpdateProductDto);
let ProductController = class ProductController {
    constructor(productService){
        this.productService = productService;
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
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: 'List products with pagination, search, sort, filters'
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
        summary: 'Create a product'
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