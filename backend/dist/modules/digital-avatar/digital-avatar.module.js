"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DigitalAvatarModule", {
    enumerable: true,
    get: function() {
        return DigitalAvatarModule;
    }
});
const _common = require("@nestjs/common");
const _authmodule = require("../auth/auth.module");
const _bodyanalysismodule = require("../body-analysis/body-analysis.module");
const _faceanalysismodule = require("../face-analysis/face-analysis.module");
const _fashiondnamodule = require("../fashion-dna/fashion-dna.module");
const _usersmodule = require("../users/users.module");
const _digitalavatarcontroller = require("./digital-avatar.controller");
const _digitalavatarrepository = require("./digital-avatar.repository");
const _digitalavatarservice = require("./digital-avatar.service");
const _avatarimagestorageservice = require("./services/avatar-image-storage.service");
const _digitalavatarvectorservice = require("./services/digital-avatar-vector.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let DigitalAvatarModule = class DigitalAvatarModule {
};
DigitalAvatarModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _authmodule.AuthModule,
            _usersmodule.UsersModule,
            (0, _common.forwardRef)(()=>_faceanalysismodule.FaceAnalysisModule),
            (0, _common.forwardRef)(()=>_bodyanalysismodule.BodyAnalysisModule),
            (0, _common.forwardRef)(()=>_fashiondnamodule.FashionDnaModule)
        ],
        controllers: [
            _digitalavatarcontroller.DigitalAvatarController
        ],
        providers: [
            _digitalavatarservice.DigitalAvatarService,
            _digitalavatarrepository.DigitalAvatarRepository,
            _avatarimagestorageservice.AvatarImageStorageService,
            _digitalavatarvectorservice.DigitalAvatarVectorService
        ],
        exports: [
            _digitalavatarservice.DigitalAvatarService,
            _digitalavatarrepository.DigitalAvatarRepository,
            _digitalavatarvectorservice.DigitalAvatarVectorService
        ]
    })
], DigitalAvatarModule);

//# sourceMappingURL=digital-avatar.module.js.map