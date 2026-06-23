"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AiService", {
    enumerable: true,
    get: function() {
        return AiService;
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
const AI_TIMEOUT_MS = 30000;
const FACE_AI_TIMEOUT_MS = 120000;
let AiService = class AiService {
    constructor(configService){
        this.configService = configService;
        this.baseUrl = (configService.get('aiService.url') || '').replace(/\/$/, '');
        this.logger = new _common.Logger(AiService.name);
    }
    isConfigured() {
        return Boolean(this.baseUrl);
    }
    getConfigSummary() {
        return {
            url: this.baseUrl || null,
            configured: this.isConfigured()
        };
    }
    mapConnectionError(error, path = '') {
        const code = error?.cause?.code || error?.code || '';
        const message = error?.message || 'Unknown AI service error';
        if (code === 'ECONNREFUSED' || message.includes('ECONNREFUSED')) {
            return `FastAPI not running — connection refused at ${this.baseUrl}. Start: uvicorn app.main:app --port 8000`;
        }
        if (error?.name === 'AbortError' || message.includes('aborted')) {
            return `FastAPI request timed out on ${path || 'request'}`;
        }
        if (message.includes('fetch failed') || code === 'ENOTFOUND') {
            return `Cannot reach FastAPI at ${this.baseUrl}`;
        }
        return message;
    }
    mapResponseError(status, data, path, rawText = '') {
        const detail = typeof data?.detail === 'string' && data.detail || Array.isArray(data?.detail) && data.detail.map((item)=>item.msg || String(item)).join(', ') || data?.message || typeof data?.raw === 'string' && data.raw.trim() || rawText.trim() || null;
        if (status === 500) {
            if (/python-multipart|multipart/i.test(String(detail))) {
                return 'FastAPI missing python-multipart. Run: pip install python-multipart and restart AI service';
            }
            if (!detail || detail === 'Internal Server Error' || /internal server error/i.test(String(detail))) {
                return `Embedding generation failed: FastAPI internal error on ${path} (HTTP 500). Restart AI service — ensure python-multipart is installed`;
            }
            return `Embedding generation failed: ${detail}`;
        }
        if (status === 401) {
            if (/not recognized/i.test(String(detail))) {
                return 'Face not recognized.';
            }
            return detail || 'Face not recognized.';
        }
        if (status === 409) {
            const detailText = typeof detail === 'string' ? detail : detail?.message || detail?.detail;
            return detailText || 'Face matches an existing registered user.';
        }
        if (status === 400 || status === 422) {
            if (/no face detected/i.test(String(detail))) {
                return 'No face detected.';
            }
            if (/multiple faces/i.test(String(detail))) {
                return 'Multiple faces detected.';
            }
            if (/already associated|face already/i.test(String(detail))) {
                return 'This face is already associated with another account.';
            }
            if (/quality|blur|too dark|too low/i.test(String(detail))) {
                return 'Image quality is too low.';
            }
            if (/verification failed|spoof|photo|screen/i.test(String(detail))) {
                return 'Face verification failed.';
            }
            if (/invalid|decode|corrupt|empty/i.test(String(detail))) {
                return 'Invalid image.';
            }
            return detail || 'Face verification failed.';
        }
        if (status === 503) {
            return `FastAPI unavailable: ${detail || 'service unavailable'}`;
        }
        return detail || `FastAPI returned HTTP ${status} on ${path}`;
    }
    async checkHealth() {
        const config = this.getConfigSummary();
        if (!this.isConfigured()) {
            return {
                status: 'error',
                configured: false,
                message: 'AI_SERVICE_URL is not configured',
                ...config
            };
        }
        const controller = new AbortController();
        const timer = setTimeout(()=>controller.abort(), 5000);
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                signal: controller.signal
            });
            const rawText = await response.text();
            let data = {};
            try {
                data = JSON.parse(rawText);
            } catch  {
                data = {
                    raw: rawText
                };
            }
            if (!response.ok) {
                return {
                    status: 'error',
                    configured: true,
                    reachable: false,
                    message: this.mapResponseError(response.status, data, '/health', rawText),
                    ...config
                };
            }
            return {
                status: 'ok',
                configured: true,
                reachable: true,
                service: data,
                ...config
            };
        } catch (error) {
            return {
                status: 'error',
                configured: true,
                reachable: false,
                message: this.mapConnectionError(error, '/health'),
                ...config
            };
        } finally{
            clearTimeout(timer);
        }
    }
    async post(path, body, headers = {}, meta = {}) {
        if (!this.isConfigured()) {
            throw new _common.ServiceUnavailableException('FastAPI not configured (AI_SERVICE_URL missing)');
        }
        const url = `${this.baseUrl}${path}`;
        const payloadBytes = meta.payloadBytes ?? null;
        this.logger.log(`→ FastAPI POST ${path} | url=${url} | payload=${payloadBytes ?? 'unknown'} bytes`);
        const timeoutMs = meta.timeoutMs ?? AI_TIMEOUT_MS;
        const controller = new AbortController();
        const timer = setTimeout(()=>controller.abort(), timeoutMs);
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body,
                signal: controller.signal
            });
            const rawText = await response.text();
            let data = {};
            try {
                data = rawText ? JSON.parse(rawText) : {};
            } catch  {
                data = {
                    raw: rawText
                };
            }
            this.logger.log(`← FastAPI POST ${path} | status=${response.status} | body=${rawText.slice(0, 500)}`);
            if (!response.ok) {
                const message = this.mapResponseError(response.status, data, path, rawText);
                this.logger.error(`FastAPI error on ${path}: status=${response.status} message=${message}`);
                if (response.status === 400 || response.status === 422) {
                    throw new _common.BadRequestException(message);
                }
                if (response.status === 401) {
                    throw new _common.UnauthorizedException(message);
                }
                if (response.status === 409) {
                    throw new _common.ConflictException(message);
                }
                throw new _common.ServiceUnavailableException(message);
            }
            return data;
        } catch (error) {
            if (error instanceof _common.ServiceUnavailableException || error instanceof _common.BadRequestException || error instanceof _common.UnauthorizedException || error instanceof _common.ConflictException) {
                throw error;
            }
            const message = this.mapConnectionError(error, path);
            this.logger.error(`FastAPI connection error on ${path}: ${message}`, error.stack);
            throw new _common.ServiceUnavailableException(message);
        } finally{
            clearTimeout(timer);
        }
    }
    postJson(path, body) {
        const serialized = JSON.stringify(body);
        return this.post(path, serialized, {
            'Content-Type': 'application/json'
        }, {
            payloadBytes: Buffer.byteLength(serialized)
        });
    }
    buildFaceFormData(buffer, mimeType = 'image/jpeg', extra = {}) {
        const formData = new FormData();
        formData.append('image', new Blob([
            buffer
        ], {
            type: mimeType
        }), 'face.jpg');
        Object.entries(extra).forEach(([key, value])=>{
            formData.append(key, value);
        });
        return formData;
    }
    registerFace(userId, buffer, mimeType = 'image/jpeg') {
        const formData = this.buildFaceFormData(buffer, mimeType, {
            user_id: userId
        });
        return this.post('/face/register', formData, {}, {
            payloadBytes: buffer.length,
            timeoutMs: FACE_AI_TIMEOUT_MS
        });
    }
    loginFace(buffer, mimeType = 'image/jpeg') {
        const formData = this.buildFaceFormData(buffer, mimeType);
        return this.post('/face/login', formData, {}, {
            payloadBytes: buffer.length,
            timeoutMs: FACE_AI_TIMEOUT_MS
        });
    }
    verifyFace(userId, buffer, mimeType = 'image/jpeg') {
        const formData = this.buildFaceFormData(buffer, mimeType, {
            user_id: userId
        });
        return this.post('/face/verify', formData, {}, {
            payloadBytes: buffer.length,
            timeoutMs: FACE_AI_TIMEOUT_MS
        });
    }
    logoutFace(userId, buffer, mimeType = 'image/jpeg') {
        const formData = this.buildFaceFormData(buffer, mimeType, {
            user_id: userId
        });
        return this.post('/face/logout', formData, {}, {
            payloadBytes: buffer.length,
            timeoutMs: FACE_AI_TIMEOUT_MS
        });
    }
    embedFaceFile(buffer, mimeType = 'image/jpeg') {
        const formData = new FormData();
        formData.append('image', new Blob([
            buffer
        ], {
            type: mimeType
        }), 'face.jpg');
        return this.post('/face/embed', formData, {}, {
            payloadBytes: buffer.length
        });
    }
    verifyFaceFile(buffer, storedEmbedding, mimeType = 'image/jpeg') {
        const formData = new FormData();
        formData.append('image', new Blob([
            buffer
        ], {
            type: mimeType
        }), 'face.jpg');
        formData.append('stored_embedding', JSON.stringify(storedEmbedding));
        return this.post('/face/verify', formData, {}, {
            payloadBytes: buffer.length
        });
    }
    embedFace(image) {
        return this.postJson('/face/embed', {
            image
        });
    }
    verifyFaceEmbedding(image, storedEmbedding) {
        return this.postJson('/face/verify', {
            image,
            stored_embedding: storedEmbedding
        });
    }
    analyzeFashionDna(payload) {
        return this.postJson('/fashion-dna/analyze', payload);
    }
    analyzeFaceTraits(buffer, mimeType = 'image/jpeg') {
        const formData = new FormData();
        formData.append('image', new Blob([
            buffer
        ], {
            type: mimeType
        }), 'face.jpg');
        return this.post('/face-analysis/analyze', formData, {}, {
            payloadBytes: buffer.length
        });
    }
    analyzeBodyTraits({ imageBuffer = null, imageMimeType = 'image/jpeg', videoBuffer = null, videoMimeType = null, height = null }) {
        const formData = new FormData();
        if (imageBuffer?.length) {
            formData.append('image', new Blob([
                imageBuffer
            ], {
                type: imageMimeType
            }), 'body.jpg');
        }
        if (videoBuffer?.length) {
            formData.append('video', new Blob([
                videoBuffer
            ], {
                type: videoMimeType || 'video/mp4'
            }), 'walkaround.mp4');
        }
        if (height !== null && height !== undefined) {
            formData.append('height', String(height));
        }
        const payloadBytes = (imageBuffer?.length || 0) + (videoBuffer?.length || 0);
        return this.post('/body-analysis/analyze', formData, {}, {
            payloadBytes
        });
    }
    generateFitProfile({ bodyType, bodyShape, bodyTypeCode = null, bodyShapeCode = null }) {
        return this.postJson('/body-analysis/fit-profile', {
            bodyType,
            bodyShape,
            bodyTypeCode,
            bodyShapeCode
        });
    }
    generateRecommendations(payload) {
        return this.postJson('/recommendations/generate', payload);
    }
    embedProduct(payload) {
        return this.postJson('/products/embed', payload);
    }
    generateAvatar(payload) {
        return this.postJson('/avatar/generate', payload);
    }
    generateDigitalAvatar(payload) {
        return this.generateAvatar(payload);
    }
};
AiService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_config.ConfigService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], AiService);

//# sourceMappingURL=ai.service.js.map