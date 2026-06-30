"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "FaceAnalysisRepository", {
    enumerable: true,
    get: function() {
        return FaceAnalysisRepository;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../../database/prisma.service");
const _faceanalysismapper = require("./utils/face-analysis.mapper");
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
let FaceAnalysisRepository = class FaceAnalysisRepository {
    constructor(prismaService){
        this.prisma = prismaService;
    }
    findByUserId(userId) {
        return this.prisma.faceAnalysis.findUnique({
            where: {
                user_id: userId
            }
        });
    }
    /**
   * Persist AI analysis for a user.
   * Updates the existing row when present; otherwise creates exactly one row.
   * Enforced by unique user_id — never creates duplicates.
   */ saveAnalysisFromAi(userId, aiResponse) {
        const data = (0, _faceanalysismapper.mapAiResponseToPersistence)(aiResponse);
        return this.prisma.faceAnalysis.upsert({
            where: {
                user_id: userId
            },
            create: {
                user_id: userId,
                ...data
            },
            update: data
        });
    }
    /**
   * Update manually overridden extracted traits while keeping one record per user.
   */ updateExtractedTraits(userId, dto, existingRecord) {
        const extracted = (0, _faceanalysismapper.mapUpdateDtoToPersistence)(dto);
        const rawAiResponse = (0, _faceanalysismapper.mergeManualUpdateIntoRaw)(existingRecord?.raw_ai_response, dto);
        return this.prisma.faceAnalysis.update({
            where: {
                user_id: userId
            },
            data: {
                ...extracted,
                raw_ai_response: rawAiResponse
            }
        });
    }
};
FaceAnalysisRepository = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_prismaservice.PrismaService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], FaceAnalysisRepository);

//# sourceMappingURL=face-analysis.repository.js.map