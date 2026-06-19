"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "validateEnv", {
    enumerable: true,
    get: function() {
        return validateEnv;
    }
});
const _classtransformer = require("class-transformer");
const _classvalidator = require("class-validator");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let EnvironmentVariables = class EnvironmentVariables {
    NODE_ENV = 'development';
    PORT = 3000;
    DATABASE_URL;
    JWT_SECRET;
    JWT_EXPIRES_IN = '7d';
    JWT_REFRESH_EXPIRES_IN = '30d';
    REDIS_HOST = 'localhost';
    REDIS_PORT = 6379;
    QDRANT_URL;
    QDRANT_API_KEY;
    OPENAI_API_KEY;
};
_ts_decorate([
    (0, _classvalidator.IsEnum)([
        'development',
        'production',
        'test'
    ]),
    (0, _classvalidator.IsOptional)()
], EnvironmentVariables.prototype, "NODE_ENV", void 0);
_ts_decorate([
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.IsOptional)()
], EnvironmentVariables.prototype, "PORT", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)()
], EnvironmentVariables.prototype, "DATABASE_URL", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)()
], EnvironmentVariables.prototype, "JWT_SECRET", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)()
], EnvironmentVariables.prototype, "JWT_EXPIRES_IN", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)()
], EnvironmentVariables.prototype, "JWT_REFRESH_EXPIRES_IN", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)()
], EnvironmentVariables.prototype, "REDIS_HOST", void 0);
_ts_decorate([
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.IsOptional)()
], EnvironmentVariables.prototype, "REDIS_PORT", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)()
], EnvironmentVariables.prototype, "QDRANT_URL", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)()
], EnvironmentVariables.prototype, "QDRANT_API_KEY", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)()
], EnvironmentVariables.prototype, "OPENAI_API_KEY", void 0);
function validateEnv(config) {
    const validated = (0, _classtransformer.plainToInstance)(EnvironmentVariables, config, {
        enableImplicitConversion: true
    });
    const errors = (0, _classvalidator.validateSync)(validated, {
        skipMissingProperties: false
    });
    if (errors.length > 0) {
        throw new Error(errors.toString());
    }
    return validated;
}

//# sourceMappingURL=env.validation.js.map