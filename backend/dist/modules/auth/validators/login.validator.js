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
        return LoginIdentifierConstraint;
    },
    get ValidateLoginIdentifier () {
        return ValidateLoginIdentifier;
    }
});
const _classvalidator = require("class-validator");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let LoginIdentifierConstraint = class LoginIdentifierConstraint {
    validate(_value, args) {
        const { email, mobile } = args.object;
        return Boolean(email || mobile);
    }
    defaultMessage() {
        return 'Either email or mobile must be provided';
    }
};
LoginIdentifierConstraint = _ts_decorate([
    (0, _classvalidator.ValidatorConstraint)({
        name: 'loginIdentifier',
        async: false
    })
], LoginIdentifierConstraint);
function ValidateLoginIdentifier() {
    return (0, _classvalidator.Validate)(LoginIdentifierConstraint);
}

//# sourceMappingURL=login.validator.js.map