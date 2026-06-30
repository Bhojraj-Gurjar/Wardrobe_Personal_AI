"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "sanitizeAiResponseForDatabase", {
    enumerable: true,
    get: function() {
        return sanitizeAiResponseForDatabase;
    }
});
function sanitizeAiResponseForDatabase(aiResponse, storagePath) {
    if (!aiResponse || typeof aiResponse !== 'object') {
        return {
            avatarImagePath: storagePath
        };
    }
    const sanitized = {
        ...aiResponse
    };
    delete sanitized.avatarImage;
    delete sanitized.avatar_image;
    delete sanitized.avatarImageUrl;
    return {
        ...sanitized,
        avatarImagePath: storagePath
    };
}

//# sourceMappingURL=avatar-image.util.js.map