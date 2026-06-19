"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RecommendationsModule", {
    enumerable: true,
    get: function() {
        return RecommendationsModule;
    }
});
const _common = require("@nestjs/common");
const _authmodule = require("../auth/auth.module");
const _recommendationscontroller = require("./controllers/recommendations.controller");
const _recommendationsservice = require("./services/recommendations.service");
const _recommendationsrepository = require("./repositories/recommendations.repository");
const _embeddingprovider = require("./providers/embedding.provider");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let RecommendationsModule = class RecommendationsModule {
};
RecommendationsModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _authmodule.AuthModule
        ],
        controllers: [
            _recommendationscontroller.RecommendationsController
        ],
        providers: [
            _recommendationsservice.RecommendationsService,
            _recommendationsrepository.RecommendationsRepository,
            _embeddingprovider.EmbeddingProviderFactory
        ],
        exports: [
            _recommendationsservice.RecommendationsService
        ]
    })
], RecommendationsModule);

//# sourceMappingURL=recommendations.module.js.map