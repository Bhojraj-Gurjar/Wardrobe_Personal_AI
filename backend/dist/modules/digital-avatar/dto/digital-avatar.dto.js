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
    get GenerateDigitalAvatarDto () {
        return GenerateDigitalAvatarDto;
    },
    get UpdateDigitalAvatarDto () {
        return UpdateDigitalAvatarDto;
    }
});
const _classvalidator = require("class-validator");
const _swagger = require("@nestjs/swagger");
const _digitalavatarconstants = require("../constants/digital-avatar.constants");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let GenerateDigitalAvatarDto = class GenerateDigitalAvatarDto {
    avatarType;
};
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: _digitalavatarconstants.AvatarRenderMode.BASIC_2D,
        enum: _digitalavatarconstants.AVATAR_TYPES,
        description: 'Canonical: BASIC_2D, PREMIUM_PHOTOREALISTIC, DIGITAL_TWIN_3D. Legacy BASIC/PREMIUM accepted.'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsIn)(_digitalavatarconstants.AVATAR_TYPES)
], GenerateDigitalAvatarDto.prototype, "avatarType", void 0);
let UpdateDigitalAvatarDto = class UpdateDigitalAvatarDto {
    avatarId;
    avatarType;
    isActive;
    avatarImage;
};
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsUUID)()
], UpdateDigitalAvatarDto.prototype, "avatarId", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: _digitalavatarconstants.AvatarRenderMode.PREMIUM_PHOTOREALISTIC,
        enum: _digitalavatarconstants.AVATAR_TYPES
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsIn)(_digitalavatarconstants.AVATAR_TYPES)
], UpdateDigitalAvatarDto.prototype, "avatarType", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: true
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsBoolean)()
], UpdateDigitalAvatarDto.prototype, "isActive", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: 'Stored avatar image path (e.g. /uploads/avatars/{userId}/avatar-v1.png)'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(2048)
], UpdateDigitalAvatarDto.prototype, "avatarImage", void 0);

//# sourceMappingURL=digital-avatar.dto.js.map