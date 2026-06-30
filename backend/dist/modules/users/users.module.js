"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UsersModule", {
    enumerable: true,
    get: function() {
        return UsersModule;
    }
});
const _common = require("@nestjs/common");
const _authmodule = require("../auth/auth.module");
const _bodyanalysismodule = require("../body-analysis/body-analysis.module");
const _fashiondnamodule = require("../fashion-dna/fashion-dna.module");
const _pipelineeventmodule = require("../user-pipeline/pipeline-event.module");
const _notificationsmodule = require("../notifications/notifications.module");
const _userscontroller = require("./controllers/users.controller");
const _usersservice = require("./services/users.service");
const _usersrepository = require("./repositories/users.repository");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let UsersModule = class UsersModule {
};
UsersModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _authmodule.AuthModule,
            _fashiondnamodule.FashionDnaModule,
            (0, _common.forwardRef)(()=>_bodyanalysismodule.BodyAnalysisModule),
            _pipelineeventmodule.PipelineEventModule,
            _notificationsmodule.NotificationsModule
        ],
        controllers: [
            _userscontroller.UsersController
        ],
        providers: [
            _usersservice.UsersService,
            _usersrepository.UsersRepository
        ],
        exports: [
            _usersservice.UsersService,
            _usersrepository.UsersRepository
        ]
    })
], UsersModule);

//# sourceMappingURL=users.module.js.map