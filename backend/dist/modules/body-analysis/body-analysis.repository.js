"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BodyAnalysisRepository", {
    enumerable: true,
    get: function() {
        return BodyAnalysisRepository;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../../database/prisma.service");
const _bodyanalysismapper = require("./utils/body-analysis.mapper");
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
let BodyAnalysisRepository = class BodyAnalysisRepository {
    constructor(prismaService){
        this.prisma = prismaService;
    }
    findByUserId(userId) {
        return this.prisma.bodyAnalysis.findUnique({
            where: {
                user_id: userId
            }
        });
    }
    findUserBodyImageContext(userId) {
        return this.prisma.user.findUnique({
            where: {
                id: userId
            },
            include: {
                profile: true,
                body_analysis: true
            }
        });
    }
    updateProfileBodyImageRefs(userId, { body_image: bodyImage, preferences }) {
        return this.prisma.userProfile.update({
            where: {
                user_id: userId
            },
            data: {
                ...bodyImage ? {
                    body_image: bodyImage
                } : {},
                ...preferences ? {
                    preferences
                } : {}
            }
        });
    }
    /**
   * Persist AI analysis for a user.
   * Updates the existing row when present; otherwise creates exactly one row.
   * Enforced by unique user_id — never creates duplicates.
   * Always stores the full raw AI response payload.
   */ saveAnalysisFromAi(userId, aiResponse, bodyImageUrl = null) {
        const data = (0, _bodyanalysismapper.mapAiResponseToPersistence)(aiResponse);
        if (bodyImageUrl) {
            data.body_image_url = bodyImageUrl;
        }
        return this.prisma.bodyAnalysis.upsert({
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
    saveBodyImagePath(userId, bodyImageUrl) {
        if (!bodyImageUrl) {
            return null;
        }
        return this.prisma.bodyAnalysis.upsert({
            where: {
                user_id: userId
            },
            create: {
                user_id: userId,
                body_image_url: bodyImageUrl
            },
            update: {
                body_image_url: bodyImageUrl
            }
        });
    }
    /**
   * Update manually overridden extracted traits.
   * Updates when a record exists; otherwise creates the user's first row.
   * Never creates duplicate rows (one record per user_id).
   */ async saveOrUpdateExtractedTraits(userId, dto) {
        const extracted = (0, _bodyanalysismapper.mapUpdateDtoToPersistence)(dto);
        if (!Object.keys(extracted).length) {
            return null;
        }
        const existing = await this.findByUserId(userId);
        const rawAiResponse = (0, _bodyanalysismapper.mergeManualUpdateIntoRaw)(existing?.raw_ai_response, dto);
        if (existing) {
            return this.prisma.bodyAnalysis.update({
                where: {
                    user_id: userId
                },
                data: {
                    ...extracted,
                    raw_ai_response: rawAiResponse
                }
            });
        }
        return this.prisma.bodyAnalysis.create({
            data: {
                user_id: userId,
                ...extracted,
                raw_ai_response: rawAiResponse
            }
        });
    }
};
BodyAnalysisRepository = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_prismaservice.PrismaService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], BodyAnalysisRepository);

//# sourceMappingURL=body-analysis.repository.js.map