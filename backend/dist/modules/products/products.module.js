"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ProductsModule", {
    enumerable: true,
    get: function() {
        return ProductsModule;
    }
});
const _common = require("@nestjs/common");
const _aimodule = require("../ai/ai.module");
const _productcontroller = require("./controllers/product.controller");
const _productcategorycontroller = require("./controllers/product-category.controller");
const _productservice = require("./services/product.service");
const _productcategoryservice = require("./services/product-category.service");
const _productrepository = require("./repositories/product.repository");
const _productcategoryrepository = require("./repositories/product-category.repository");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let ProductsModule = class ProductsModule {
};
ProductsModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _aimodule.AiModule
        ],
        controllers: [
            _productcategorycontroller.ProductCategoryController,
            _productcontroller.ProductController
        ],
        providers: [
            _productservice.ProductService,
            _productcategoryservice.ProductCategoryService,
            _productrepository.ProductRepository,
            _productcategoryrepository.ProductCategoryRepository
        ],
        exports: [
            _productservice.ProductService,
            _productcategoryservice.ProductCategoryService,
            _productrepository.ProductRepository,
            _productcategoryrepository.ProductCategoryRepository
        ]
    })
], ProductsModule);

//# sourceMappingURL=products.module.js.map