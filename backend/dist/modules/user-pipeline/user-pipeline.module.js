"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UserPipelineModule", {
    enumerable: true,
    get: function() {
        return UserPipelineModule;
    }
});
const _common = require("@nestjs/common");
const _databasemodule = require("../../database/database.module");
const _pipelineeventmodule = require("./pipeline-event.module");
const _userpipelineservice = require("./user-pipeline.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let UserPipelineModule = class UserPipelineModule {
};
UserPipelineModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _pipelineeventmodule.PipelineEventModule,
            _databasemodule.DatabaseModule
        ],
        providers: [
            _userpipelineservice.UserPipelineService
        ],
        exports: [
            _userpipelineservice.UserPipelineService,
            _pipelineeventmodule.PipelineEventModule
        ]
    })
], UserPipelineModule);

//# sourceMappingURL=user-pipeline.module.js.map