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
    get AVATAR_CATEGORIES () {
        return _avatarconstants.AVATAR_CATEGORIES;
    },
    get AVATAR_CATEGORY_OVERLAY_ORDER () {
        return _avatarconstants.AVATAR_CATEGORY_OVERLAY_ORDER;
    },
    get DEFAULT_LIMIT () {
        return _productconstants.DEFAULT_LIMIT;
    },
    get DEFAULT_PAGE () {
        return _productconstants.DEFAULT_PAGE;
    },
    get MAX_LIMIT () {
        return _productconstants.MAX_LIMIT;
    },
    get PRODUCT_SORT_FIELDS () {
        return _productconstants.PRODUCT_SORT_FIELDS;
    },
    get SORT_ORDERS () {
        return _productconstants.SORT_ORDERS;
    }
});
const _productconstants = require("./product.constants");
const _avatarconstants = require("../constants/avatar.constants");

//# sourceMappingURL=index.js.map