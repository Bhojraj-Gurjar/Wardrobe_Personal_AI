"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
function parseCorsOrigins(value) {
    if (!value) return [];
    return value.split(',').map((origin)=>origin.trim()).filter(Boolean);
}
const _default = ()=>({
        nodeEnv: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.PORT, 10) || 3000,
        cors: {
            origins: parseCorsOrigins(process.env.CORS_ORIGINS)
        },
        database: {
            url: process.env.DATABASE_URL
        },
        jwt: {
            secret: process.env.JWT_SECRET,
            expiresIn: process.env.JWT_EXPIRES_IN || '7d',
            refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
        },
        redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT, 10) || 6379
        },
        qdrant: {
            url: process.env.QDRANT_URL,
            apiKey: process.env.QDRANT_API_KEY,
            collection: process.env.QDRANT_COLLECTION || 'products',
            vectorSize: parseInt(process.env.QDRANT_VECTOR_SIZE, 10) || 128
        },
        openai: {
            apiKey: process.env.OPENAI_API_KEY
        },
        face: {
            collection: process.env.QDRANT_FACE_COLLECTION || 'users_face_vectors',
            vectorSize: parseInt(process.env.FACE_VECTOR_SIZE, 10) || 512,
            similarityThreshold: parseFloat(process.env.FACE_SIMILARITY_THRESHOLD) || 0.42,
            registrationDuplicateThreshold: parseFloat(process.env.FACE_REGISTRATION_DUPLICATE_THRESHOLD) || 0.45,
            similarityUncertain: parseFloat(process.env.FACE_SIMILARITY_UNCERTAIN) || 0.32,
            livenessRequired: process.env.FACE_LIVENESS_REQUIRED !== 'false',
            minLivenessFrames: parseInt(process.env.FACE_MIN_LIVENESS_FRAMES, 10) || 3,
            maxFailedAttempts: parseInt(process.env.FACE_MAX_FAILED_ATTEMPTS, 10) || 5,
            lockoutSeconds: parseInt(process.env.FACE_LOCKOUT_SECONDS, 10) || 900,
            attemptWindowSeconds: parseInt(process.env.FACE_ATTEMPT_WINDOW_SECONDS, 10) || 3600
        },
        fashionDna: {
            collection: process.env.QDRANT_DNA_COLLECTION || 'fashion_dna_vectors',
            vectorSize: parseInt(process.env.DNA_VECTOR_SIZE, 10) || 384
        },
        faceAnalysis: {
            collection: process.env.QDRANT_FACE_ANALYSIS_COLLECTION || 'face_analysis_vectors',
            vectorSize: parseInt(process.env.FACE_ANALYSIS_VECTOR_SIZE, 10) || parseInt(process.env.DNA_VECTOR_SIZE, 10) || 384
        },
        bodyAnalysis: {
            collection: process.env.QDRANT_BODY_ANALYSIS_COLLECTION || 'body_analysis_vectors',
            vectorSize: parseInt(process.env.BODY_ANALYSIS_VECTOR_SIZE, 10) || parseInt(process.env.DNA_VECTOR_SIZE, 10) || 384
        },
        digitalAvatar: {
            collection: process.env.QDRANT_DIGITAL_AVATAR_COLLECTION || 'digital_avatar_vectors',
            vectorSize: parseInt(process.env.DIGITAL_AVATAR_VECTOR_SIZE, 10) || parseInt(process.env.DNA_VECTOR_SIZE, 10) || 384
        },
        aiService: {
            url: process.env.AI_SERVICE_URL || 'http://localhost:8000',
            publicUrl: process.env.AI_SERVICE_PUBLIC_URL || 'http://localhost:8000'
        },
        storage: {
            provider: process.env.STORAGE_PROVIDER || 'local',
            local: {
                rootDir: process.env.STORAGE_LOCAL_ROOT || 'uploads',
                publicBaseUrl: process.env.STORAGE_PUBLIC_BASE_URL || 'http://localhost:3000',
                publicPath: process.env.STORAGE_PUBLIC_PATH || '/uploads'
            },
            internalBaseUrl: process.env.STORAGE_INTERNAL_BASE_URL || process.env.STORAGE_PUBLIC_BASE_URL || 'http://localhost:3000'
        }
    });

//# sourceMappingURL=configuration.js.map