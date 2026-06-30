"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get PIPELINE_SIGNALS () {
        return PIPELINE_SIGNALS;
    },
    get PipelineEventBus () {
        return PipelineEventBus;
    }
});
const _common = require("@nestjs/common");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
const PIPELINE_SIGNALS = {
    FACE_ANALYSIS_COMPLETED: 'pipeline.face_analysis.completed',
    BODY_ANALYSIS_COMPLETED: 'pipeline.body_analysis.completed',
    PROFILE_UPDATED: 'pipeline.profile.updated'
};
let PipelineEventBus = class PipelineEventBus {
    constructor(){
        this.handlers = new Map();
    }
    on(event, handler) {
        const existing = this.handlers.get(event) || [];
        existing.push(handler);
        this.handlers.set(event, existing);
    }
    emit(event, payload) {
        const handlers = this.handlers.get(event) || [];
        handlers.forEach((handler)=>{
            Promise.resolve(handler(payload)).catch(()=>null);
        });
    }
};
PipelineEventBus = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [])
], PipelineEventBus);

//# sourceMappingURL=pipeline-event.bus.js.map