"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "FashionDnaCacheService", {
    enumerable: true,
    get: function() {
        return FashionDnaCacheService;
    }
});
const _common = require("@nestjs/common");
const _redisservice = require("../../../database/redis.service");
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
const CACHE_KEY_PREFIX = 'fashion-dna:';
const CACHE_TTL_SECONDS = 24 * 60 * 60;
let FashionDnaCacheService = class FashionDnaCacheService {
    constructor(redisService){
        this.redis = redisService;
        this.logger = new _common.Logger(FashionDnaCacheService.name);
    }
    buildKey(userId) {
        return `${CACHE_KEY_PREFIX}${userId}`;
    }
    async get(userId) {
        const cached = await this.redis.get(this.buildKey(userId));
        if (!cached) {
            return null;
        }
        try {
            return JSON.parse(cached);
        } catch (error) {
            this.logger.warn(`Invalid Fashion DNA cache for user ${userId}: ${error.message}`);
            await this.invalidate(userId);
            return null;
        }
    }
    async set(userId, fashionDna) {
        await this.redis.setex(this.buildKey(userId), CACHE_TTL_SECONDS, JSON.stringify(fashionDna));
    }
    async invalidate(userId) {
        await this.redis.del(this.buildKey(userId));
    }
};
FashionDnaCacheService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_redisservice.RedisService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], FashionDnaCacheService);

//# sourceMappingURL=fashion-dna-cache.service.js.map