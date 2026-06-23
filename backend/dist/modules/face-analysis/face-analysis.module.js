"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "FaceAnalysisModule", {
    enumerable: true,
    get: function() {
        return FaceAnalysisModule;
    }
});
const _common = require("@nestjs/common");
const _authmodule = require("../auth/auth.module");
const _facemodule = require("../face/face.module");
const _fashiondnamodule = require("../fashion-dna/fashion-dna.module");
const _pipelineeventmodule = require("../user-pipeline/pipeline-event.module");
const _faceanalysiscontroller = require("./face-analysis.controller");
const _faceanalysisrepository = require("./face-analysis.repository");
const _faceanalysisservice = require("./face-analysis.service");
const _facebiometrictraitsservice = require("./services/face-biometric-traits.service");
const _faceanalysisvectorservice = require("./services/face-analysis-vector.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let FaceAnalysisModule = class FaceAnalysisModule {
};
FaceAnalysisModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _authmodule.AuthModule,
            _facemodule.FaceModule,
            (0, _common.forwardRef)(()=>_fashiondnamodule.FashionDnaModule),
            _pipelineeventmodule.PipelineEventModule
        ],
        controllers: [
            _faceanalysiscontroller.FaceAnalysisController
        ],
        providers: [
            _faceanalysisservice.FaceAnalysisService,
            _faceanalysisrepository.FaceAnalysisRepository,
            _facebiometrictraitsservice.FaceBiometricTraitsService,
            _faceanalysisvectorservice.FaceAnalysisVectorService
        ],
        exports: [
            _faceanalysisservice.FaceAnalysisService,
            _faceanalysisrepository.FaceAnalysisRepository,
            _facebiometrictraitsservice.FaceBiometricTraitsService,
            _faceanalysisvectorservice.FaceAnalysisVectorService
        ]
    })
], FaceAnalysisModule);

//# sourceMappingURL=face-analysis.module.js.map