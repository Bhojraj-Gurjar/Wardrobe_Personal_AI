"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BodyAnalysisModule", {
    enumerable: true,
    get: function() {
        return BodyAnalysisModule;
    }
});
const _common = require("@nestjs/common");
const _authmodule = require("../auth/auth.module");
const _fashiondnamodule = require("../fashion-dna/fashion-dna.module");
const _pipelineeventmodule = require("../user-pipeline/pipeline-event.module");
const _storagemodule = require("../../storage/storage.module");
const _bodyanalysiscontroller = require("./body-analysis.controller");
const _bodyanalysisrepository = require("./body-analysis.repository");
const _bodyanalysisservice = require("./body-analysis.service");
const _bodyprofileinsightsservice = require("./services/body-profile-insights.service");
const _bodyanalysisvectorservice = require("./services/body-analysis-vector.service");
const _bodyimagestorageservice = require("./services/body-image-storage.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let BodyAnalysisModule = class BodyAnalysisModule {
};
BodyAnalysisModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _authmodule.AuthModule,
            _storagemodule.StorageModule,
            (0, _common.forwardRef)(()=>_fashiondnamodule.FashionDnaModule),
            _pipelineeventmodule.PipelineEventModule
        ],
        controllers: [
            _bodyanalysiscontroller.BodyAnalysisController
        ],
        providers: [
            _bodyanalysisservice.BodyAnalysisService,
            _bodyanalysisrepository.BodyAnalysisRepository,
            _bodyprofileinsightsservice.BodyProfileInsightsService,
            _bodyanalysisvectorservice.BodyAnalysisVectorService,
            _bodyimagestorageservice.BodyImageStorageService
        ],
        exports: [
            _bodyanalysisservice.BodyAnalysisService,
            _bodyanalysisrepository.BodyAnalysisRepository,
            _bodyprofileinsightsservice.BodyProfileInsightsService,
            _bodyanalysisvectorservice.BodyAnalysisVectorService,
            _bodyimagestorageservice.BodyImageStorageService
        ]
    })
], BodyAnalysisModule);

//# sourceMappingURL=body-analysis.module.js.map