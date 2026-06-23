"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UserActivityModule", {
    enumerable: true,
    get: function() {
        return UserActivityModule;
    }
});
const _common = require("@nestjs/common");
const _authmodule = require("../auth/auth.module");
const _fashiondnamodule = require("../fashion-dna/fashion-dna.module");
const _useractivitycontroller = require("./controllers/user-activity.controller");
const _useractivityservice = require("./services/user-activity.service");
const _useractivityrepository = require("./repositories/user-activity.repository");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let UserActivityModule = class UserActivityModule {
};
UserActivityModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _authmodule.AuthModule,
            _fashiondnamodule.FashionDnaModule
        ],
        controllers: [
            _useractivitycontroller.UserActivityController
        ],
        providers: [
            _useractivityservice.UserActivityService,
            _useractivityrepository.UserActivityRepository
        ],
        exports: [
            _useractivityservice.UserActivityService
        ]
    })
], UserActivityModule);

//# sourceMappingURL=user-activity.module.js.map