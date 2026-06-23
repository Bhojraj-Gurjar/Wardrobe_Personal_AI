"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "FaceBiometricTraitsService", {
    enumerable: true,
    get: function() {
        return FaceBiometricTraitsService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _facerepository = require("../../face/repositories/face.repository");
const _faceanalysisconstants = require("../constants/face-analysis.constants");
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
let FaceBiometricTraitsService = class FaceBiometricTraitsService {
    constructor(faceRepository, configService){
        this.faceRepository = faceRepository;
        this.vectorSize = configService.get('face.vectorSize') || _faceanalysisconstants.FACE_VECTOR_SIZE;
    }
    async collectBiometricTraits(userId) {
        const [registration, faceVector] = await Promise.all([
            this.faceRepository.findFaceRegistration(userId),
            this.faceRepository.getFaceVector(userId).catch(()=>null)
        ]);
        const isRegistered = Boolean(registration?.is_face_registered);
        const hasVector = Array.isArray(faceVector) && faceVector.length > 0;
        return {
            is_face_registered: isRegistered,
            registered_at: registration?.registered_at || null,
            face_embedding_id: registration?.face_embedding_id || null,
            biometric_enabled: isRegistered && hasVector,
            has_face_vector: hasVector,
            embedding_dimensions: hasVector ? faceVector.length : this.vectorSize,
            quality_score: hasVector ? 1 : isRegistered ? 0.6 : null,
            analysis_source: _faceanalysisconstants.FACE_TRAIT_SOURCE,
            analyzed_at: new Date().toISOString()
        };
    }
};
FaceBiometricTraitsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_facerepository.FaceRepository)),
    _ts_param(1, (0, _common.Inject)(_config.ConfigService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ])
], FaceBiometricTraitsService);

//# sourceMappingURL=face-biometric-traits.service.js.map