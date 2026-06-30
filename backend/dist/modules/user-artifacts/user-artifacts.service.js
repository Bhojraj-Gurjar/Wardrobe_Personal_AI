"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UserArtifactsService", {
    enumerable: true,
    get: function() {
        return UserArtifactsService;
    }
});
const _common = require("@nestjs/common");
const _core = require("@nestjs/core");
const _prismaservice = require("../../database/prisma.service");
const _storageservice = require("../../storage/services/storage.service");
const _faceanalysismapper = require("../face-analysis/utils/face-analysis.mapper");
const _bodyanalysismapper = require("../body-analysis/utils/body-analysis.mapper");
const _digitalavatarmapper = require("../digital-avatar/utils/digital-avatar.mapper");
const _storagepathresolverservice = require("../../storage/services/storage-path-resolver.service");
const _digitalavatarconstants = require("../digital-avatar/constants/digital-avatar.constants");
const _defaultartifactsconstants = require("./constants/default-artifacts.constants");
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
function isDefaultRecord(raw) {
    return Boolean(raw && typeof raw === 'object' && raw.isDefault === true);
}
function hasRealFaceRecord(record) {
    return Boolean(record?.face_shape && !isDefaultRecord(record?.raw_ai_response));
}
function hasRealBodyRecord(record) {
    return Boolean(record?.body_type && !isDefaultRecord(record?.raw_ai_response));
}
function hasRealAvatarRecord(record) {
    return Boolean(record && !isDefaultRecord(record?.raw_ai_response));
}
function hasRealFashionDnaRecord(record) {
    return Boolean(record?.style_type && !isDefaultRecord(record?.preference_traits));
}
let UserArtifactsService = class UserArtifactsService {
    constructor(prisma, storageService, storagePathResolver, moduleRef){
        this.prisma = prisma;
        this.storageService = storageService;
        this.storagePathResolver = storagePathResolver;
        this.moduleRef = moduleRef;
        this.logger = new _common.Logger(UserArtifactsService.name);
    }
    resolveFashionDnaService() {
        const { FashionDnaService } = require('../fashion-dna/services/fashion-dna.service');
        return this.moduleRef.get(FashionDnaService, {
            strict: false
        });
    }
    resolveFashionDnaCacheService() {
        const { FashionDnaCacheService } = require('../fashion-dna/services/fashion-dna-cache.service');
        return this.moduleRef.get(FashionDnaCacheService, {
            strict: false
        });
    }
    async ensureFaceAnalysis(userId) {
        const existing = await this.prisma.faceAnalysis.findUnique({
            where: {
                user_id: userId
            }
        });
        if (existing) {
            return (0, _faceanalysismapper.formatFaceAnalysisRecord)(existing);
        }
        const record = await this.prisma.faceAnalysis.create({
            data: {
                user_id: userId,
                ..._defaultartifactsconstants.DEFAULT_FACE_ANALYSIS
            }
        });
        this.logger.log(`Default face_analysis created | userId=${userId}`);
        return (0, _faceanalysismapper.formatFaceAnalysisRecord)(record);
    }
    async ensureBodyAnalysis(userId) {
        const existing = await this.prisma.bodyAnalysis.findUnique({
            where: {
                user_id: userId
            }
        });
        if (existing) {
            return (0, _bodyanalysismapper.formatBodyAnalysisRecord)(existing);
        }
        const record = await this.prisma.bodyAnalysis.create({
            data: {
                user_id: userId,
                ..._defaultartifactsconstants.DEFAULT_BODY_ANALYSIS
            }
        });
        this.logger.log(`Default body_analysis created | userId=${userId}`);
        return (0, _bodyanalysismapper.formatBodyAnalysisRecord)(record);
    }
    async ensureDigitalAvatar(userId) {
        const existing = await this.prisma.digitalAvatar.findFirst({
            where: {
                user_id: userId,
                is_active: true
            },
            orderBy: {
                version: 'desc'
            }
        });
        if (existing) {
            return (0, _digitalavatarmapper.formatDigitalAvatarRecord)(existing, this.storagePathResolver.toPublicUrl.bind(this.storagePathResolver));
        }
        const svg = (0, _defaultartifactsconstants.buildDefaultAvatarSvg)();
        const buffer = Buffer.from(svg, 'utf-8');
        const upload = await this.storageService.uploadAvatarImage({
            userId,
            version: 1,
            buffer,
            mimeType: 'image/svg+xml'
        });
        const record = await this.prisma.digitalAvatar.create({
            data: {
                user_id: userId,
                avatar_type: _digitalavatarconstants.BASIC_AVATAR_TYPE,
                avatar_image: upload.storagePath,
                version: 1,
                is_active: true,
                raw_ai_response: {
                    isDefault: true,
                    avatarType: _digitalavatarconstants.BASIC_AVATAR_TYPE,
                    avatarImage: upload.storagePath,
                    metadata: _defaultartifactsconstants.DEFAULT_AVATAR_METADATA,
                    confidence: 85
                }
            }
        });
        this.logger.log(`Default digital_avatar created | userId=${userId}`);
        return (0, _digitalavatarmapper.formatDigitalAvatarRecord)(record, this.storagePathResolver.toPublicUrl.bind(this.storagePathResolver));
    }
    async ensureFashionDna(userId) {
        const existing = await this.prisma.fashionDna.findUnique({
            where: {
                user_id: userId
            }
        });
        const fashionDnaService = this.resolveFashionDnaService();
        const fashionDnaCacheService = this.resolveFashionDnaCacheService();
        if (existing) {
            return fashionDnaService.formatFashionDna(existing, userId);
        }
        const record = await this.prisma.fashionDna.create({
            data: {
                user_id: userId,
                ..._defaultartifactsconstants.DEFAULT_FASHION_DNA,
                preference_traits: {
                    ..._defaultartifactsconstants.DEFAULT_FASHION_DNA.preference_traits,
                    isDefault: true
                }
            }
        });
        const formatted = await fashionDnaService.formatFashionDna(record, userId);
        await fashionDnaCacheService.set(userId, formatted);
        this.logger.log(`Default fashion_dna created | userId=${userId}`);
        return formatted;
    }
    async ensureAllUserArtifacts(userId) {
        const [face, body, avatar, fashionDna] = await Promise.all([
            this.ensureFaceAnalysis(userId),
            this.ensureBodyAnalysis(userId),
            this.ensureDigitalAvatar(userId),
            this.ensureFashionDna(userId)
        ]);
        return {
            face,
            body,
            avatar,
            fashionDna
        };
    }
    async upgradeDefaultsIfNeeded(userId) {
        await this.ensureAllUserArtifacts(userId);
        const [face, body, avatar, dna] = await Promise.all([
            this.prisma.faceAnalysis.findUnique({
                where: {
                    user_id: userId
                }
            }),
            this.prisma.bodyAnalysis.findUnique({
                where: {
                    user_id: userId
                }
            }),
            this.prisma.digitalAvatar.findFirst({
                where: {
                    user_id: userId,
                    is_active: true
                },
                orderBy: {
                    version: 'desc'
                }
            }),
            this.prisma.fashionDna.findUnique({
                where: {
                    user_id: userId
                }
            })
        ]);
        return {
            faceAnalysis: hasRealFaceRecord(face),
            bodyAnalysis: hasRealBodyRecord(body),
            digitalAvatar: hasRealAvatarRecord(avatar),
            fashionDna: hasRealFashionDnaRecord(dna)
        };
    }
};
UserArtifactsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_prismaservice.PrismaService)),
    _ts_param(1, (0, _common.Inject)(_storageservice.StorageService)),
    _ts_param(2, (0, _common.Inject)(_storagepathresolverservice.StoragePathResolver)),
    _ts_param(3, (0, _common.Inject)(_core.ModuleRef)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0,
        void 0,
        void 0
    ])
], UserArtifactsService);

//# sourceMappingURL=user-artifacts.service.js.map