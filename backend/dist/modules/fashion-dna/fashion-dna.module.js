"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "FashionDnaModule", {
    enumerable: true,
    get: function() {
        return FashionDnaModule;
    }
});
const _common = require("@nestjs/common");
const _authmodule = require("../auth/auth.module");
const _bodyanalysismodule = require("../body-analysis/body-analysis.module");
const _faceanalysismodule = require("../face-analysis/face-analysis.module");
const _fashiondnacontroller = require("./controllers/fashion-dna.controller");
const _fashiondnarepository = require("./repositories/fashion-dna.repository");
const _fashiondnaactivityrepository = require("./repositories/fashion-dna-activity.repository");
const _fashiondnaservice = require("./services/fashion-dna.service");
const _fashiondnabehavioralservice = require("./services/fashion-dna-behavioral.service");
const _fashiondnacontextservice = require("./services/fashion-dna-context.service");
const _fashiondnarefreshservice = require("./services/fashion-dna-refresh.service");
const _fashiondnacacheservice = require("./services/fashion-dna-cache.service");
const _fashiondnaregenerationservice = require("./services/fashion-dna-regeneration.service");
const _fashiondnahistoryrepository = require("./repositories/fashion-dna-history.repository");
const _fashiondnahistoryservice = require("./services/fashion-dna-history.service");
const _fashiondnavectorservice = require("./services/fashion-dna-vector.service");
const _fashiondnaengineservice = require("./services/fashion-dna-engine.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let FashionDnaModule = class FashionDnaModule {
};
FashionDnaModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _authmodule.AuthModule,
            (0, _common.forwardRef)(()=>_faceanalysismodule.FaceAnalysisModule),
            (0, _common.forwardRef)(()=>_bodyanalysismodule.BodyAnalysisModule)
        ],
        controllers: [
            _fashiondnacontroller.FashionDnaController
        ],
        providers: [
            _fashiondnaservice.FashionDnaService,
            _fashiondnarepository.FashionDnaRepository,
            _fashiondnaactivityrepository.FashionDnaActivityRepository,
            _fashiondnabehavioralservice.FashionDnaBehavioralService,
            _fashiondnacontextservice.FashionDnaContextService,
            _fashiondnaengineservice.FashionDnaEngineService,
            _fashiondnarefreshservice.FashionDnaRefreshService,
            _fashiondnacacheservice.FashionDnaCacheService,
            _fashiondnaregenerationservice.FashionDnaRegenerationService,
            _fashiondnahistoryrepository.FashionDnaHistoryRepository,
            _fashiondnahistoryservice.FashionDnaHistoryService,
            _fashiondnavectorservice.FashionDnaVectorService
        ],
        exports: [
            _fashiondnaservice.FashionDnaService,
            _fashiondnarefreshservice.FashionDnaRefreshService,
            _fashiondnacacheservice.FashionDnaCacheService,
            _fashiondnaregenerationservice.FashionDnaRegenerationService,
            _fashiondnahistoryservice.FashionDnaHistoryService,
            _fashiondnavectorservice.FashionDnaVectorService,
            _fashiondnarepository.FashionDnaRepository
        ]
    })
], FashionDnaModule);

//# sourceMappingURL=fashion-dna.module.js.map