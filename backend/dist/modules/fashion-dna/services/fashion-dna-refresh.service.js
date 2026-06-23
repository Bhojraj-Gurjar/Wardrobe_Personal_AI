"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "FashionDnaRefreshService", {
    enumerable: true,
    get: function() {
        return FashionDnaRefreshService;
    }
});
const _common = require("@nestjs/common");
const _redisservice = require("../../../database/redis.service");
const _aiservice = require("../../ai/services/ai.service");
const _fashiondnarepository = require("../repositories/fashion-dna.repository");
const _fashiondnaservice = require("./fashion-dna.service");
const _fashiondnacontextservice = require("./fashion-dna-context.service");
const _fashiondnacacheservice = require("./fashion-dna-cache.service");
const _fashiondnahistoryservice = require("./fashion-dna-history.service");
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
const REFRESH_DEBOUNCE_MS = 3000;
const REFRESH_LOCK_PREFIX = 'fashion-dna:refresh:';
const REFRESH_SCHEDULED_PREFIX = 'fashion-dna:scheduled:';
const REFRESH_LOCK_SECONDS = 60;
const REFRESH_SCHEDULED_SECONDS = Math.ceil(REFRESH_DEBOUNCE_MS / 1000) + 10;
let FashionDnaRefreshService = class FashionDnaRefreshService {
    constructor(fashionDnaRepository, contextService, fashionDnaService, aiService, redisService, cacheService, historyService){
        this.fashionDnaRepository = fashionDnaRepository;
        this.contextService = contextService;
        this.fashionDnaService = fashionDnaService;
        this.aiService = aiService;
        this.redis = redisService;
        this.cacheService = cacheService;
        this.historyService = historyService;
        this.logger = new _common.Logger(FashionDnaRefreshService.name);
        this.pendingRefreshes = new Map();
    }
    scheduleRegeneration(userId, source = 'activity') {
        this.cacheService.invalidate(userId).catch((error)=>{
            this.logger.warn(`Failed to invalidate Fashion DNA cache for user ${userId}: ${error.message}`);
        });
        this.markScheduled(userId, source);
        const pending = this.pendingRefreshes.get(userId);
        if (pending?.timer) {
            clearTimeout(pending.timer);
        }
        const timer = setTimeout(()=>{
            const scheduled = this.pendingRefreshes.get(userId);
            this.pendingRefreshes.delete(userId);
            const refreshSource = scheduled?.source || source;
            this.runRefresh(userId, refreshSource).catch((error)=>{
                this.logger.error(`Failed to refresh Fashion DNA for user ${userId}: ${error.message}`, error.stack);
            });
        }, REFRESH_DEBOUNCE_MS);
        this.pendingRefreshes.set(userId, {
            timer,
            source
        });
    }
    scheduleRefresh(userId, source = 'activity') {
        this.scheduleRegeneration(userId, source);
    }
    markScheduled(userId, source) {
        this.redis.set(`${REFRESH_SCHEDULED_PREFIX}${userId}`, source, 'EX', REFRESH_SCHEDULED_SECONDS).catch((error)=>{
            this.logger.warn(`Failed to mark Fashion DNA regeneration scheduled for user ${userId}: ${error.message}`);
        });
    }
    async runRefresh(userId, source) {
        const lockKey = `${REFRESH_LOCK_PREFIX}${userId}`;
        const acquired = await this.redis.set(lockKey, source, 'EX', REFRESH_LOCK_SECONDS, 'NX');
        if (!acquired) {
            this.logger.debug(`Fashion DNA regeneration already running for user ${userId}`);
            return null;
        }
        try {
            await this.redis.del(`${REFRESH_SCHEDULED_PREFIX}${userId}`).catch(()=>null);
            return await this.regenerateFashionDna(userId, source);
        } finally{
            await this.redis.del(lockKey).catch(()=>null);
        }
    }
    async regenerateFashionDna(userId, source = 'activity') {
        const existing = await this.fashionDnaRepository.findByUserId(userId);
        if (!existing) {
            const generated = await this.fashionDnaService.generateFashionDnaIfReady(userId);
            if (generated) {
                this.logger.log(`Fashion DNA initial generation from ${source} | userId=${userId}`);
            }
            return generated;
        }
        if (!this.aiService.isConfigured()) {
            this.logger.debug(`Skipping Fashion DNA refresh for user ${userId} — AI service not configured`);
            return null;
        }
        const context = await this.contextService.collectContext(userId);
        const payload = await this.fashionDnaService.analyzeWithAi(userId, context);
        await this.historyService.archiveBeforeChange(existing, source);
        const updated = await this.fashionDnaRepository.updateByUserId(userId, payload);
        const formatted = await this.fashionDnaService.formatFashionDna(updated, userId);
        await this.cacheService.invalidate(userId);
        await this.cacheService.set(userId, formatted);
        this.logger.log(`Fashion DNA regenerated from ${source} | userId=${userId} | activityVolume=${JSON.stringify(context.signals.activityVolume)}`);
        return updated;
    }
    async refreshFromActivity(userId, source = 'activity') {
        return this.regenerateFashionDna(userId, source);
    }
};
FashionDnaRefreshService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_fashiondnarepository.FashionDnaRepository)),
    _ts_param(1, (0, _common.Inject)(_fashiondnacontextservice.FashionDnaContextService)),
    _ts_param(2, (0, _common.Inject)(_fashiondnaservice.FashionDnaService)),
    _ts_param(3, (0, _common.Inject)(_aiservice.AiService)),
    _ts_param(4, (0, _common.Inject)(_redisservice.RedisService)),
    _ts_param(5, (0, _common.Inject)(_fashiondnacacheservice.FashionDnaCacheService)),
    _ts_param(6, (0, _common.Inject)(_fashiondnahistoryservice.FashionDnaHistoryService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0,
        void 0,
        void 0,
        void 0,
        void 0,
        void 0
    ])
], FashionDnaRefreshService);

//# sourceMappingURL=fashion-dna-refresh.service.js.map