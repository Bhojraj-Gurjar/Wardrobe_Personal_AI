"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AllExceptionsFilter", {
    enumerable: true,
    get: function() {
        return AllExceptionsFilter;
    }
});
const _common = require("@nestjs/common");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let AllExceptionsFilter = class AllExceptionsFilter {
    constructor(){
        this.logger = new _common.Logger(AllExceptionsFilter.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception.status || _common.HttpStatus.INTERNAL_SERVER_ERROR;
        const message = exception.message || 'Internal server error';
        this.logger.error(`${request.method} ${request.url} - ${status} - ${message}`, exception.stack);
        response.status(status).json({
            success: false,
            statusCode: status,
            message: [
                message
            ],
            timestamp: new Date().toISOString()
        });
    }
};
AllExceptionsFilter = _ts_decorate([
    (0, _common.Catch)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [])
], AllExceptionsFilter);

//# sourceMappingURL=all-exceptions.filter.js.map