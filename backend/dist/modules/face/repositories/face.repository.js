"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "FaceRepository", {
    enumerable: true,
    get: function() {
        return FaceRepository;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _qdrantservice = require("../../../database/qdrant.service");
const _prismaservice = require("../../../database/prisma.service");
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
let FaceRepository = class FaceRepository {
    constructor(qdrantService, configService, prismaService){
        this.qdrantService = qdrantService;
        this.configService = configService;
        this.prisma = prismaService;
        this.collection = configService.get('face.collection');
        this.vectorSize = configService.get('face.vectorSize');
    }
    upsertFaceVector(userId, embedding) {
        return this.qdrantService.upsertVector(this.collection, userId, embedding, {
            user_id: userId
        }, this.vectorSize);
    }
    searchFaceVector(embedding) {
        return this.qdrantService.searchInCollection(this.collection, embedding, 1, this.vectorSize);
    }
    deleteFaceVector(userId) {
        return this.qdrantService.deleteVector(this.collection, userId);
    }
    findUserById(userId) {
        return this.prisma.user.findUnique({
            where: {
                id: userId
            }
        });
    }
};
FaceRepository = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_qdrantservice.QdrantService)),
    _ts_param(1, (0, _common.Inject)(_config.ConfigService)),
    _ts_param(2, (0, _common.Inject)(_prismaservice.PrismaService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0,
        void 0
    ])
], FaceRepository);

//# sourceMappingURL=face.repository.js.map