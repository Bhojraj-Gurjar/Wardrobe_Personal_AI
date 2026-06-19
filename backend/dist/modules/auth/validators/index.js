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
    get LoginIdentifierConstraint () {
        return _loginvalidator.LoginIdentifierConstraint;
    },
    get ValidateLoginIdentifier () {
        return _loginvalidator.ValidateLoginIdentifier;
    }
});
const _loginvalidator = require("./login.validator");

//# sourceMappingURL=index.js.map