"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DtoValidationPipe", {
    enumerable: true,
    get: function() {
        return DtoValidationPipe;
    }
});
const _common = require("@nestjs/common");
const _classtransformer = require("class-transformer");
const _classvalidator = require("class-validator");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function DtoValidationPipe(dtoClass) {
    let MixinValidationPipe = class MixinValidationPipe {
        async transform(value) {
            const object = (0, _classtransformer.plainToInstance)(dtoClass, value, {
                enableImplicitConversion: true
            });
            const errors = await (0, _classvalidator.validate)(object, {
                whitelist: true,
                forbidNonWhitelisted: true
            });
            if (errors.length > 0) {
                const messages = errors.flatMap((error)=>Object.values(error.constraints || {}));
                throw new _common.BadRequestException(messages);
            }
            return object;
        }
    };
    MixinValidationPipe = _ts_decorate([
        (0, _common.Injectable)()
    ], MixinValidationPipe);
    return new MixinValidationPipe();
}

//# sourceMappingURL=dto-validation.pipe.js.map