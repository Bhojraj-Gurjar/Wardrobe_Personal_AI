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
    get LoginDto () {
        return _logindto.LoginDto;
    },
    get LogoutDto () {
        return _logoutdto.LogoutDto;
    },
    get RefreshTokenDto () {
        return _refreshtokendto.RefreshTokenDto;
    },
    get RegisterDto () {
        return _registerdto.RegisterDto;
    }
});
const _registerdto = require("./register.dto");
const _logindto = require("./login.dto");
const _refreshtokendto = require("./refresh-token.dto");
const _logoutdto = require("./logout.dto");

//# sourceMappingURL=index.js.map