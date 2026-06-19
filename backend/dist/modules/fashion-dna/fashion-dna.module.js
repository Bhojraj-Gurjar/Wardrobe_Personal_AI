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
const _fashiondnacontroller = require("./controllers/fashion-dna.controller");
const _fashiondnaservice = require("./services/fashion-dna.service");
const _fashiondnarepository = require("./repositories/fashion-dna.repository");
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
            _authmodule.AuthModule
        ],
        controllers: [
            _fashiondnacontroller.FashionDnaController
        ],
        providers: [
            _fashiondnaservice.FashionDnaService,
            _fashiondnarepository.FashionDnaRepository
        ],
        exports: [
            _fashiondnaservice.FashionDnaService
        ]
    })
], FashionDnaModule);

//# sourceMappingURL=fashion-dna.module.js.map