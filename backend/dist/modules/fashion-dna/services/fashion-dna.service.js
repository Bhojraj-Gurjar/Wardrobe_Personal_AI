"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "FashionDnaService", {
    enumerable: true,
    get: function() {
        return FashionDnaService;
    }
});
const _common = require("@nestjs/common");
const _fashiondnarepository = require("../repositories/fashion-dna.repository");
const _fashiondnagenerator = require("./fashion-dna.generator");
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
let FashionDnaService = class FashionDnaService {
    constructor(fashionDnaRepository){
        this.fashionDnaRepository = fashionDnaRepository;
    }
    async getFashionDna(userId) {
        const fashionDna = await this.fashionDnaRepository.findByUserId(userId);
        if (!fashionDna) {
            throw new _common.NotFoundException('Fashion DNA not found. Generate it first using POST /fashion-dna/generate');
        }
        return this.formatFashionDna(fashionDna);
    }
    async generateFashionDna(userId) {
        const profile = await this.fashionDnaRepository.findUserProfile(userId);
        if (!profile) {
            throw new _common.BadRequestException('Complete your profile before generating Fashion DNA');
        }
        const wishlistItems = await this.fashionDnaRepository.findWishlistProducts(userId);
        const payload = (0, _fashiondnagenerator.buildFashionDnaPayload)(profile, wishlistItems);
        const fashionDna = await this.fashionDnaRepository.upsert(userId, payload);
        return this.formatFashionDna(fashionDna);
    }
    formatFashionDna(fashionDna) {
        return {
            id: fashionDna.id,
            user_id: fashionDna.user_id,
            style_score: fashionDna.style_score,
            color_affinity: fashionDna.color_affinity,
            brand_affinity: fashionDna.brand_affinity,
            lifestyle_score: fashionDna.lifestyle_score,
            created_at: fashionDna.created_at,
            updated_at: fashionDna.updated_at
        };
    }
};
FashionDnaService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_fashiondnarepository.FashionDnaRepository)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], FashionDnaService);

//# sourceMappingURL=fashion-dna.service.js.map