"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UpdateProfileDto", {
    enumerable: true,
    get: function() {
        return UpdateProfileDto;
    }
});
const _classvalidator = require("class-validator");
const _swagger = require("@nestjs/swagger");
const _profileconstants = require("../validators/profile.constants");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let UpdateProfileDto = class UpdateProfileDto {
    name;
    gender;
    age;
    height;
    weight;
    country;
    language;
    body_type;
    skin_tone;
    preferences;
};
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'Alex Johnson'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MinLength)(1),
    (0, _classvalidator.MaxLength)(120)
], UpdateProfileDto.prototype, "name", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        enum: _profileconstants.GENDER_VALUES,
        example: 'FEMALE'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(_profileconstants.GENDER_VALUES, {
        message: 'gender must be a valid value'
    })
], UpdateProfileDto.prototype, "gender", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 28,
        minimum: 13,
        maximum: 120
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(13),
    (0, _classvalidator.Max)(120)
], UpdateProfileDto.prototype, "age", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 165,
        description: 'Height in cm'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(50),
    (0, _classvalidator.Max)(300)
], UpdateProfileDto.prototype, "height", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 62,
        description: 'Weight in kg'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(20),
    (0, _classvalidator.Max)(500)
], UpdateProfileDto.prototype, "weight", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'India'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(120)
], UpdateProfileDto.prototype, "country", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'English'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(80)
], UpdateProfileDto.prototype, "language", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        enum: _profileconstants.BODY_TYPE_VALUES,
        example: 'AVERAGE'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(_profileconstants.BODY_TYPE_VALUES, {
        message: 'body_type must be a valid value'
    })
], UpdateProfileDto.prototype, "body_type", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        enum: _profileconstants.SKIN_TONE_VALUES,
        example: 'MEDIUM'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(_profileconstants.SKIN_TONE_VALUES, {
        message: 'skin_tone must be a valid value'
    })
], UpdateProfileDto.prototype, "skin_tone", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: 'Onboarding lifestyle and style preferences',
        example: {
            occupation: 'EMPLOYEE',
            shopping_frequency: 'MONTHLY',
            budget_preference: 'MID_RANGE',
            preferred_categories: [
                'CASUAL',
                'FORMAL'
            ],
            favorite_colors: [
                'Navy',
                'White'
            ],
            favorite_brands: [
                'Zara',
                'H&M'
            ],
            fashion_influencers: [
                '@styleicon'
            ]
        }
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsObject)()
], UpdateProfileDto.prototype, "preferences", void 0);

//# sourceMappingURL=update-profile.dto.js.map