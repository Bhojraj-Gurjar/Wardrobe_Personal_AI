"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "FaceModule", {
    enumerable: true,
    get: function() {
        return FaceModule;
    }
});
const _common = require("@nestjs/common");
const _authmodule = require("../auth/auth.module");
const _fashiondnamodule = require("../fashion-dna/fashion-dna.module");
const _userpipelinemodule = require("../user-pipeline/user-pipeline.module");
const _storagemodule = require("../../storage/storage.module");
const _facecontroller = require("./controllers/face.controller");
const _faceservice = require("./services/face.service");
const _faceimagestorageservice = require("./services/face-image-storage.service");
const _facerepository = require("./repositories/face.repository");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let FaceModule = class FaceModule {
};
FaceModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _authmodule.AuthModule,
            _storagemodule.StorageModule,
            (0, _common.forwardRef)(()=>_fashiondnamodule.FashionDnaModule),
            (0, _common.forwardRef)(()=>_userpipelinemodule.UserPipelineModule)
        ],
        controllers: [
            _facecontroller.FaceController
        ],
        providers: [
            _faceservice.FaceService,
            _faceimagestorageservice.FaceImageStorageService,
            _facerepository.FaceRepository
        ],
        exports: [
            _faceservice.FaceService,
            _facerepository.FaceRepository,
            _faceimagestorageservice.FaceImageStorageService
        ]
    })
], FaceModule);

//# sourceMappingURL=face.module.js.map