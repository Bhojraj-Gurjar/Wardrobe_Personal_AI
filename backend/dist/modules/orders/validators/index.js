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
    get DEFAULT_LIMIT () {
        return _orderconstants.DEFAULT_LIMIT;
    },
    get DEFAULT_PAGE () {
        return _orderconstants.DEFAULT_PAGE;
    },
    get MAX_LIMIT () {
        return _orderconstants.MAX_LIMIT;
    },
    get ORDER_STATUS () {
        return _orderconstants.ORDER_STATUS;
    },
    get ORDER_STATUS_VALUES () {
        return _orderconstants.ORDER_STATUS_VALUES;
    }
});
const _orderconstants = require("./order.constants");

//# sourceMappingURL=index.js.map