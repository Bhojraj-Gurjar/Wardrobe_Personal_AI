"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RegisterDto", {
    enumerable: true,
    get: function() {
        return RegisterDto;
    }
});
const _classvalidator = require("class-validator");
const _swagger = require("@nestjs/swagger");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let RegisterDto = class RegisterDto {
    email;
    mobile;
    password;
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        example: 'user@example.com'
    }),
    (0, _classvalidator.IsEmail)(),
    (0, _classvalidator.IsNotEmpty)()
], RegisterDto.prototype, "email", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: '+919876543210'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.Matches)(/^\+?[1-9]\d{7,14}$/, {
        message: 'mobile must be a valid phone number'
    })
], RegisterDto.prototype, "mobile", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        example: 'SecurePass123!',
        minLength: 8
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)(),
    (0, _classvalidator.MinLength)(8, {
        message: 'password must be at least 8 characters'
    })
], RegisterDto.prototype, "password", void 0);

//# sourceMappingURL=register.dto.js.map