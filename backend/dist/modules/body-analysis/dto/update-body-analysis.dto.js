"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UpdateBodyAnalysisDto", {
    enumerable: true,
    get: function() {
        return UpdateBodyAnalysisDto;
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
let UpdateBodyAnalysisDto = class UpdateBodyAnalysisDto {
    bodyType;
    bodyShape;
    height;
    shoulderWidth;
    chest;
    waist;
    hip;
    armLength;
    legLength;
    fitProfile;
};
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'Athletic'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(40)
], UpdateBodyAnalysisDto.prototype, "bodyType", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'Rectangle'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(40)
], UpdateBodyAnalysisDto.prototype, "bodyShape", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 170
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0)
], UpdateBodyAnalysisDto.prototype, "height", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 42
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0)
], UpdateBodyAnalysisDto.prototype, "shoulderWidth", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 90
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0)
], UpdateBodyAnalysisDto.prototype, "chest", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 72
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0)
], UpdateBodyAnalysisDto.prototype, "waist", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 95
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0)
], UpdateBodyAnalysisDto.prototype, "hip", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 58
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0)
], UpdateBodyAnalysisDto.prototype, "armLength", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 82
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0)
], UpdateBodyAnalysisDto.prototype, "legLength", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: {
            schemaVersion: 1,
            summary: 'Fit recommendations based on your body type and shape.',
            sections: [
                {
                    id: 'tops',
                    title: 'Tops',
                    fit: 'Regular fit with light waist definition',
                    recommendations: [
                        'Peplum and wrap tops'
                    ],
                    tips: [
                        'Semi-tuck tops to create waist shape'
                    ],
                    avoid: [
                        'Boxy oversized tops without structure'
                    ]
                }
            ]
        }
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsObject)()
], UpdateBodyAnalysisDto.prototype, "fitProfile", void 0);

//# sourceMappingURL=update-body-analysis.dto.js.map