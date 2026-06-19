"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "FaceEmbeddingDto", {
    enumerable: true,
    get: function() {
        return FaceEmbeddingDto;
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
let FaceEmbeddingDto = class FaceEmbeddingDto {
    embedding;
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: [
            Number
        ],
        description: 'Face embedding vector captured on the client',
        example: [
            0.12,
            -0.05,
            0.88
        ]
    }),
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.ArrayMinSize)(1),
    (0, _classvalidator.IsNumber)({}, {
        each: true
    })
], FaceEmbeddingDto.prototype, "embedding", void 0);

//# sourceMappingURL=face-embedding.dto.js.map