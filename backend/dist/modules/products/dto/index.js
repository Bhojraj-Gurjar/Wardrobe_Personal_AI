"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get CreateProductDto () {
        return _createproductdto.CreateProductDto;
    },
    get ProductImageDto () {
        return _createproductdto.ProductImageDto;
    },
    get QueryProductsDto () {
        return _queryproductsdto.QueryProductsDto;
    },
    get UpdateProductDto () {
        return _updateproductdto.UpdateProductDto;
    }
});
const _createproductdto = require("./create-product.dto");
const _updateproductdto = require("./update-product.dto");
const _queryproductsdto = require("./query-products.dto");

//# sourceMappingURL=index.js.map