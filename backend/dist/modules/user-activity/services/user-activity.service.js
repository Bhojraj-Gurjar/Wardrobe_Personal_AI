"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UserActivityService", {
    enumerable: true,
    get: function() {
        return UserActivityService;
    }
});
const _common = require("@nestjs/common");
const _fashiondnaregenerationconstants = require("../../fashion-dna/constants/fashion-dna-regeneration.constants");
const _fashiondnaregenerationservice = require("../../fashion-dna/services/fashion-dna-regeneration.service");
const _useractivityrepository = require("../repositories/user-activity.repository");
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
let UserActivityService = class UserActivityService {
    constructor(userActivityRepository, fashionDnaRegenerationService){
        this.userActivityRepository = userActivityRepository;
        this.fashionDnaRegenerationService = fashionDnaRegenerationService;
    }
    async recordProductView(userId, productId) {
        const product = await this.userActivityRepository.productExists(productId);
        if (!product) {
            throw new _common.NotFoundException('Product not found');
        }
        const view = await this.userActivityRepository.createProductView(userId, productId);
        this.fashionDnaRegenerationService.trigger(userId, _fashiondnaregenerationconstants.REFRESH_SOURCES.BROWSING_ACTIVITY);
        return {
            id: view.id,
            product_id: view.product_id,
            viewed_at: view.viewed_at
        };
    }
    async recordSearch(userId, query) {
        const entry = await this.userActivityRepository.createSearchHistory(userId, query);
        this.fashionDnaRegenerationService.trigger(userId, _fashiondnaregenerationconstants.REFRESH_SOURCES.BROWSING_ACTIVITY);
        return {
            id: entry.id,
            query: entry.query,
            searched_at: entry.searched_at
        };
    }
};
UserActivityService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_useractivityrepository.UserActivityRepository)),
    _ts_param(1, (0, _common.Inject)(_fashiondnaregenerationservice.FashionDnaRegenerationService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ])
], UserActivityService);

//# sourceMappingURL=user-activity.service.js.map