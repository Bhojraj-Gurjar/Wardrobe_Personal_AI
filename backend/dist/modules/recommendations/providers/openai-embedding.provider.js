"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "OpenAiEmbeddingProvider", {
    enumerable: true,
    get: function() {
        return OpenAiEmbeddingProvider;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let OpenAiEmbeddingProvider = class OpenAiEmbeddingProvider {
    constructor(configService){
        this.apiKey = configService.get('openai.apiKey');
        this.model = 'text-embedding-3-small';
    }
    isAvailable() {
        // Enable once OpenAI embedding calls are implemented.
        return false;
    }
    async embedUserContext(_contextText) {
        // Future AI integration: call OpenAI embeddings API with user preference text.
        throw new Error('OpenAI embedding provider is reserved for future AI integration');
    }
    async embedProduct(_product) {
        throw new Error('OpenAI embedding provider is reserved for future AI integration');
    }
};
OpenAiEmbeddingProvider = _ts_decorate([
    _ts_param(0, (0, _common.Inject)(_config.ConfigService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], OpenAiEmbeddingProvider);

//# sourceMappingURL=openai-embedding.provider.js.map