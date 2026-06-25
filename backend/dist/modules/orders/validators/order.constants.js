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
        return DEFAULT_LIMIT;
    },
    get DEFAULT_PAGE () {
        return DEFAULT_PAGE;
    },
    get MAX_LIMIT () {
        return MAX_LIMIT;
    },
    get ORDER_STATUS () {
        return ORDER_STATUS;
    },
    get ORDER_STATUS_VALUES () {
        return ORDER_STATUS_VALUES;
    }
});
const ORDER_STATUS = {
    CREATED: 'CREATED',
    CONFIRMED: 'CONFIRMED',
    PACKED: 'PACKED',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED'
};
const ORDER_STATUS_VALUES = Object.values(ORDER_STATUS);
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

//# sourceMappingURL=order.constants.js.map