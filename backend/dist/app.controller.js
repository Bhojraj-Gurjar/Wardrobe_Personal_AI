"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AppController", {
    enumerable: true,
    get: function() {
        return AppController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _appservice = require("./app.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let AppController = class AppController {
    constructor(appService){
        this.appService = appService;
    }
    getHealth() {
        return this.appService.getHealth();
    }
    getAiHealth() {
        return this.appService.getAiHealth();
    }
    getQdrantHealth() {
        return this.appService.getQdrantHealth();
    }
    getDiagnostics() {
        return this.appService.getDiagnostics();
    }
    getMetrics() {
        return this.appService.getMetrics();
    }
};
_ts_decorate([
    (0, _common.Get)('health'),
    (0, _swagger.ApiOperation)({
        summary: 'API health check'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], AppController.prototype, "getHealth", null);
_ts_decorate([
    (0, _common.Get)('ai/health'),
    (0, _swagger.ApiOperation)({
        summary: 'FastAPI AI service health check'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], AppController.prototype, "getAiHealth", null);
_ts_decorate([
    (0, _common.Get)('qdrant/health'),
    (0, _swagger.ApiOperation)({
        summary: 'Qdrant vector database health check'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], AppController.prototype, "getQdrantHealth", null);
_ts_decorate([
    (0, _common.Get)('health/diagnostics'),
    (0, _swagger.ApiOperation)({
        summary: 'Face pipeline diagnostics (AI + Qdrant)'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], AppController.prototype, "getDiagnostics", null);
_ts_decorate([
    (0, _common.Get)('metrics'),
    (0, _swagger.ApiOperation)({
        summary: 'Runtime metrics (memory, uptime)'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], AppController.prototype, "getMetrics", null);
AppController = _ts_decorate([
    (0, _swagger.ApiTags)('health'),
    (0, _common.Controller)(),
    _ts_param(0, (0, _common.Inject)(_appservice.AppService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], AppController);

//# sourceMappingURL=app.controller.js.map