"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "LoginDto", {
    enumerable: true,
    get: function() {
        return LoginDto;
    }
});
const _classvalidator = require("class-validator");
const _swagger = require("@nestjs/swagger");
const _loginvalidator = require("../validators/login.validator");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let LoginDto = class LoginDto {
    email;
    mobile;
    password;
    _loginIdentifier;
};
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'user@example.com'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEmail)()
], LoginDto.prototype, "email", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: '+919876543210'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.Matches)(/^\+?[1-9]\d{7,14}$/, {
        message: 'mobile must be a valid phone number'
    })
], LoginDto.prototype, "mobile", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        example: 'SecurePass123!'
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)(),
    (0, _classvalidator.MinLength)(8)
], LoginDto.prototype, "password", void 0);
_ts_decorate([
    (0, _swagger.ApiHideProperty)(),
    (0, _loginvalidator.ValidateLoginIdentifier)()
], LoginDto.prototype, "_loginIdentifier", void 0);

//# sourceMappingURL=login.dto.js.map