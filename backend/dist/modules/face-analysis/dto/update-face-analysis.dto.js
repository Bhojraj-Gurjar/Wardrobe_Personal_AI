"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UpdateFaceAnalysisDto", {
    enumerable: true,
    get: function() {
        return UpdateFaceAnalysisDto;
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
let UpdateFaceAnalysisDto = class UpdateFaceAnalysisDto {
    faceShape;
    skinTone;
    hairLength;
    hairColor;
    hairStyle;
    beardType;
};
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'Oval'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(40)
], UpdateFaceAnalysisDto.prototype, "faceShape", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'Medium'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(40)
], UpdateFaceAnalysisDto.prototype, "skinTone", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'Medium'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(40)
], UpdateFaceAnalysisDto.prototype, "hairLength", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'Brown'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(40)
], UpdateFaceAnalysisDto.prototype, "hairColor", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'Wavy'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(40)
], UpdateFaceAnalysisDto.prototype, "hairStyle", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'Clean Shave'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(40)
], UpdateFaceAnalysisDto.prototype, "beardType", void 0);

//# sourceMappingURL=update-face-analysis.dto.js.map