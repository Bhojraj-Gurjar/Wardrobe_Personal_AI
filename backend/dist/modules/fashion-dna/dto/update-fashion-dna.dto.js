"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UpdateFashionDnaDto", {
    enumerable: true,
    get: function() {
        return UpdateFashionDnaDto;
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
let UpdateFashionDnaDto = class UpdateFashionDnaDto {
    style_type;
    color_affinity;
    budget_range;
    brand_affinity;
    fashion_confidence_score;
    face_traits;
    body_traits;
    preference_traits;
    activity_traits;
};
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'casual'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(80)
], UpdateFashionDnaDto.prototype, "style_type", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: {
            navy: 0.9,
            white: 0.7
        },
        description: 'Weighted color preferences'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsObject)()
], UpdateFashionDnaDto.prototype, "color_affinity", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        enum: [
            'ECONOMY',
            'MID_RANGE',
            'PREMIUM',
            'LUXURY'
        ],
        example: 'MID_RANGE'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(40)
], UpdateFashionDnaDto.prototype, "budget_range", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: {
            zara: 0.8,
            'h&m': 0.6
        },
        description: 'Weighted brand preferences'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsObject)()
], UpdateFashionDnaDto.prototype, "brand_affinity", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 82,
        minimum: 0,
        maximum: 100
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0),
    (0, _classvalidator.Max)(100)
], UpdateFashionDnaDto.prototype, "fashion_confidence_score", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: {
            is_face_registered: true,
            registered_at: '2026-06-20T10:00:00.000Z',
            biometric_enabled: true
        }
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsObject)()
], UpdateFashionDnaDto.prototype, "face_traits", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: {
            body_type: 'ATHLETIC',
            skin_tone: 'MEDIUM',
            gender: 'FEMALE',
            age: 28
        }
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsObject)()
], UpdateFashionDnaDto.prototype, "body_traits", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: {
            occupation: 'EMPLOYEE',
            preferred_categories: [
                'CASUAL',
                'FORMAL'
            ],
            favorite_colors: [
                'Navy',
                'White'
            ]
        }
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsObject)()
], UpdateFashionDnaDto.prototype, "preference_traits", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: {
            favorite_brands: {
                zara: 0.8
            },
            favorite_categories: {
                casual: 0.7
            },
            average_spending: 89.5,
            price_affinity: {
                mid_range: 0.6
            }
        }
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsObject)()
], UpdateFashionDnaDto.prototype, "activity_traits", void 0);

//# sourceMappingURL=update-fashion-dna.dto.js.map