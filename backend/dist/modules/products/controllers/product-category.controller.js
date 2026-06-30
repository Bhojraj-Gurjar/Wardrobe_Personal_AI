"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ProductCategoryController", {
    enumerable: true,
    get: function() {
        return ProductCategoryController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _productcategoryservice = require("../services/product-category.service");
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
let ProductCategoryController = class ProductCategoryController {
    constructor(productCategoryService){
        this.productCategoryService = productCategoryService;
    }
    findAll() {
        return this.productCategoryService.findAll();
    }
    findGroup(code) {
        return this.productCategoryService.findGroupByCode(code.toUpperCase());
    }
    seed() {
        return this.productCategoryService.seedCatalogCategories();
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: 'List product category groups and subcategories'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Category catalog retrieved successfully'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], ProductCategoryController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)('groups/:code'),
    (0, _swagger.ApiOperation)({
        summary: 'Get a product category group by code'
    }),
    (0, _swagger.ApiParam)({
        name: 'code',
        example: 'MEN'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Category group retrieved successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 404,
        description: 'Category group not found'
    }),
    _ts_param(0, (0, _common.Param)('code')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], ProductCategoryController.prototype, "findGroup", null);
_ts_decorate([
    (0, _common.Post)('seed'),
    (0, _common.HttpCode)(200),
    (0, _swagger.ApiOperation)({
        summary: 'Seed default product category catalog (idempotent)'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Categories seeded successfully'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], ProductCategoryController.prototype, "seed", null);
ProductCategoryController = _ts_decorate([
    (0, _swagger.ApiTags)('product-categories'),
    (0, _common.Controller)('products/categories'),
    _ts_param(0, (0, _common.Inject)(_productcategoryservice.ProductCategoryService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], ProductCategoryController);

//# sourceMappingURL=product-category.controller.js.map