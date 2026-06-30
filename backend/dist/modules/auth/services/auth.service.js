"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuthService", {
    enumerable: true,
    get: function() {
        return AuthService;
    }
});
const _common = require("@nestjs/common");
const _jwt = require("@nestjs/jwt");
const _config = require("@nestjs/config");
const _bcryptjs = /*#__PURE__*/ _interop_require_wildcard(require("bcryptjs"));
const _crypto = require("crypto");
const _authrepository = require("../repositories/auth.repository");
const _redisservice = require("../../../database/redis.service");
const _userpipelineservice = require("../../user-pipeline/user-pipeline.service");
const _userartifactsservice = require("../../user-artifacts/user-artifacts.service");
const _userstatus = require("../../../common/constants/user-status");
const _parseduration = require("../../../common/utils/parse-duration");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
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
const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_PREFIX = 'auth:refresh:';
const TOKEN_INVALID_AFTER_PREFIX = 'auth:token-invalid-after:';
const PASSWORD_CHANGE_ATTEMPT_PREFIX = 'auth:password-change:attempts:';
const PASSWORD_CHANGE_LOCK_PREFIX = 'auth:password-change:lock:';
const PASSWORD_CHANGE_MAX_ATTEMPTS = 5;
const PASSWORD_CHANGE_LOCK_SECONDS = 900;
const PASSWORD_CHANGE_ATTEMPT_WINDOW_SECONDS = 3600;
let AuthService = class AuthService {
    constructor(authRepository, jwtService, configService, redisService, userPipelineService, userArtifactsService){
        this.authRepository = authRepository;
        this.jwtService = jwtService;
        this.configService = configService;
        this.redisService = redisService;
        this.userPipelineService = userPipelineService;
        this.userArtifactsService = userArtifactsService;
        this.logger = new _common.Logger(AuthService.name);
        this.refreshTtlSeconds = (0, _parseduration.parseDurationToSeconds)(this.configService.get('jwt.refreshExpiresIn'));
    }
    async register(dto) {
        await this.ensureUniqueCredentials(dto.email, dto.mobile);
        const passwordHash = await _bcryptjs.hash(dto.password, BCRYPT_ROUNDS);
        const user = await this.authRepository.createUserWithProfile({
            email: dto.email,
            mobile: dto.mobile,
            passwordHash
        });
        this.userPipelineService.onUserCreated(user.id);
        const response = await this.buildAuthResponse(user);
        this.scheduleArtifactEnsure(user.id);
        return response;
    }
    async login(dto) {
        const user = dto.email ? await this.authRepository.findByEmail(dto.email) : await this.authRepository.findByMobile(dto.mobile);
        if (!user) {
            throw new _common.UnauthorizedException('Invalid credentials');
        }
        await this.ensureActiveUser(user);
        const isPasswordValid = await _bcryptjs.compare(dto.password, user.password_hash);
        if (!isPasswordValid) {
            throw new _common.UnauthorizedException('Invalid credentials');
        }
        const response = await this.buildAuthResponse(user);
        this.scheduleArtifactEnsure(user.id);
        return response;
    }
    async refresh(dto) {
        const userId = await this.getUserIdFromRefreshToken(dto.refreshToken);
        if (!userId) {
            throw new _common.UnauthorizedException('Invalid or expired refresh token');
        }
        const user = await this.authRepository.findById(userId);
        if (!user) {
            await this.revokeRefreshToken(dto.refreshToken);
            throw new _common.UnauthorizedException('Invalid or expired refresh token');
        }
        await this.ensureActiveUser(user);
        await this.revokeRefreshToken(dto.refreshToken);
        const response = await this.buildAuthResponse(user);
        this.scheduleArtifactEnsure(user.id);
        return response;
    }
    async logout(dto) {
        await this.revokeRefreshToken(dto.refreshToken);
        return {
            message: 'Logged out successfully'
        };
    }
    async getMe(userId) {
        const user = await this.authRepository.findById(userId);
        if (!user) {
            throw new _common.UnauthorizedException('User not found');
        }
        await this.ensureActiveUser(user);
        return this.sanitizeUser(user);
    }
    async changePassword(userId, dto) {
        await this.assertPasswordChangeNotLocked(userId);
        if (dto.newPassword !== dto.confirmPassword) {
            throw new _common.BadRequestException('New password and confirmation do not match');
        }
        if (dto.newPassword === dto.currentPassword) {
            throw new _common.BadRequestException('New password must be different from your current password');
        }
        const user = await this.authRepository.findById(userId);
        if (!user) {
            throw new _common.UnauthorizedException('User not found');
        }
        await this.ensureActiveUser(user);
        const isCurrentPasswordValid = await _bcryptjs.compare(dto.currentPassword, user.password_hash);
        if (!isCurrentPasswordValid) {
            await this.recordPasswordChangeFailure(userId);
            throw new _common.UnauthorizedException('Current password is incorrect');
        }
        await this.recordPasswordChangeSuccess(userId);
        const passwordHash = await _bcryptjs.hash(dto.newPassword, BCRYPT_ROUNDS);
        await this.authRepository.updatePassword(userId, passwordHash);
        await this.invalidateUserSessions(userId);
        const updatedUser = await this.authRepository.findById(userId);
        const tokens = await this.generateTokens(updatedUser);
        return {
            message: 'Password updated successfully',
            ...tokens
        };
    }
    async assertPasswordChangeNotLocked(userId) {
        const lockKey = `${PASSWORD_CHANGE_LOCK_PREFIX}${userId}`;
        const locked = await this.redisService.get(lockKey);
        if (locked) {
            throw new _common.TooManyRequestsException('Too many failed password change attempts. Try again later.');
        }
    }
    async recordPasswordChangeFailure(userId) {
        const attemptKey = `${PASSWORD_CHANGE_ATTEMPT_PREFIX}${userId}`;
        const attempts = await this.redisService.incr(attemptKey);
        if (attempts === 1) {
            await this.redisService.expire(attemptKey, PASSWORD_CHANGE_ATTEMPT_WINDOW_SECONDS);
        }
        if (attempts >= PASSWORD_CHANGE_MAX_ATTEMPTS) {
            const lockKey = `${PASSWORD_CHANGE_LOCK_PREFIX}${userId}`;
            await this.redisService.setex(lockKey, PASSWORD_CHANGE_LOCK_SECONDS, '1');
            await this.redisService.del(attemptKey);
            throw new _common.TooManyRequestsException('Too many failed password change attempts. Try again later.');
        }
    }
    recordPasswordChangeSuccess(userId) {
        return this.redisService.del(`${PASSWORD_CHANGE_ATTEMPT_PREFIX}${userId}`);
    }
    async invalidateUserSessions(userId) {
        const invalidAfter = Math.floor(Date.now() / 1000);
        await this.redisService.set(`${TOKEN_INVALID_AFTER_PREFIX}${userId}`, String(invalidAfter));
        await this.revokeAllRefreshTokensForUser(userId);
    }
    async revokeAllRefreshTokensForUser(userId) {
        let cursor = '0';
        do {
            const [nextCursor, keys] = await this.redisService.scan(cursor, 'MATCH', `${REFRESH_TOKEN_PREFIX}*`, 'COUNT', 100);
            cursor = nextCursor;
            for (const key of keys){
                const storedUserId = await this.redisService.get(key);
                if (storedUserId === userId) {
                    await this.redisService.del(key);
                }
            }
        }while (cursor !== '0')
    }
    async ensureUniqueCredentials(email, mobile) {
        const existingEmail = await this.authRepository.findByEmail(email);
        if (existingEmail) {
            throw new _common.ConflictException('Email is already registered');
        }
        if (!mobile) {
            return;
        }
        const existingMobile = await this.authRepository.findByMobile(mobile);
        if (existingMobile) {
            throw new _common.ConflictException('Mobile number is already registered');
        }
    }
    async ensureActiveUser(user) {
        if (user.status !== _userstatus.USER_STATUS.ACTIVE) {
            throw new _common.ForbiddenException('Account is not active');
        }
    }
    async buildAuthResponse(user) {
        const tokens = await this.generateTokens(user);
        return {
            user: this.sanitizeUser(user),
            ...tokens
        };
    }
    sanitizeUser(user) {
        return {
            id: user.id,
            email: user.email,
            mobile: user.mobile,
            role: user.role || 'USER',
            status: user.status,
            created_at: user.created_at,
            updated_at: user.updated_at
        };
    }
    async generateTokens(user) {
        const payload = {
            sub: user.id,
            email: user.email
        };
        const accessToken = await this.jwtService.signAsync(payload);
        const refreshToken = (0, _crypto.randomUUID)();
        await this.storeRefreshToken(refreshToken, user.id);
        return {
            accessToken,
            refreshToken,
            expiresIn: this.configService.get('jwt.expiresIn')
        };
    }
    storeRefreshToken(refreshToken, userId) {
        return this.redisService.setex(`${REFRESH_TOKEN_PREFIX}${refreshToken}`, this.refreshTtlSeconds, userId);
    }
    async getUserIdFromRefreshToken(refreshToken) {
        return this.redisService.get(`${REFRESH_TOKEN_PREFIX}${refreshToken}`);
    }
    revokeRefreshToken(refreshToken) {
        return this.redisService.del(`${REFRESH_TOKEN_PREFIX}${refreshToken}`);
    }
    scheduleArtifactEnsure(userId) {
        setImmediate(()=>{
            this.userArtifactsService.ensureAllUserArtifacts(userId).catch((error)=>{
                this.logger.warn(`Artifact ensure failed for user ${userId}: ${error.message}`);
            });
        });
    }
};
AuthService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_authrepository.AuthRepository)),
    _ts_param(1, (0, _common.Inject)(_jwt.JwtService)),
    _ts_param(2, (0, _common.Inject)(_config.ConfigService)),
    _ts_param(3, (0, _common.Inject)(_redisservice.RedisService)),
    _ts_param(4, (0, _common.Inject)((0, _common.forwardRef)(()=>_userpipelineservice.UserPipelineService))),
    _ts_param(5, (0, _common.Inject)(_userartifactsservice.UserArtifactsService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0,
        void 0,
        void 0,
        void 0,
        void 0
    ])
], AuthService);

//# sourceMappingURL=auth.service.js.map