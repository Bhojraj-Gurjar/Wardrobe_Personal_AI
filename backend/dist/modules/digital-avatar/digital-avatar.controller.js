"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DigitalAvatarController", {
    enumerable: true,
    get: function() {
        return DigitalAvatarController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _jwtauthguard = require("../../guards/jwt-auth.guard");
const _currentuserdecorator = require("../../common/decorators/current-user.decorator");
const _digitalavatardto = require("./dto/digital-avatar.dto");
const _digitalavatarservice = require("./digital-avatar.service");
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
let DigitalAvatarController = class DigitalAvatarController {
    constructor(digitalAvatarService){
        this.digitalAvatarService = digitalAvatarService;
    }
    getMyAvatar(user) {
        return this.digitalAvatarService.getMyAvatar(user.userId);
    }
    getAvatarHistory(user) {
        return this.digitalAvatarService.getAvatarHistory(user.userId);
    }
    generatePremiumAvatar(user) {
        return this.digitalAvatarService.generatePremiumAvatar(user.userId);
    }
    generateDigitalTwinAvatar(user) {
        return this.digitalAvatarService.generateDigitalTwinAvatar(user.userId);
    }
    generateBasicAvatar(user) {
        return this.digitalAvatarService.generateBasicAvatar(user.userId);
    }
    generateAvatar(user, dto) {
        return this.digitalAvatarService.generateAvatar(user.userId, dto);
    }
    activateAvatar(user, avatarId) {
        return this.digitalAvatarService.activateAvatarById(user.userId, avatarId);
    }
    updateAvatar(user, dto) {
        return this.digitalAvatarService.updateAvatar(user.userId, dto);
    }
};
_ts_decorate([
    (0, _common.Get)('me'),
    (0, _swagger.ApiOperation)({
        summary: 'Get active digital avatar for authenticated user'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Active avatar retrieved successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Unauthorized'
    }),
    (0, _swagger.ApiResponse)({
        status: 404,
        description: 'No active avatar found'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], DigitalAvatarController.prototype, "getMyAvatar", null);
_ts_decorate([
    (0, _common.Get)('history'),
    (0, _swagger.ApiOperation)({
        summary: 'List versioned digital avatar history'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Avatar version history retrieved successfully',
        schema: {
            example: [
                {
                    version: 1,
                    type: 'BASIC_2D',
                    avatarType: 'BASIC_2D',
                    avatarImagePath: '/uploads/avatars/user-id/avatar-v1.png',
                    avatarImage: 'http://localhost:3000/uploads/avatars/user-id/avatar-v1.png',
                    createdAt: '2026-06-22T08:00:00.000Z'
                },
                {
                    version: 2,
                    type: 'PREMIUM_PHOTOREALISTIC',
                    avatarType: 'PREMIUM_PHOTOREALISTIC',
                    avatarImagePath: '/uploads/avatars/user-id/avatar-v1.png',
                    avatarImage: 'http://localhost:3000/uploads/avatars/user-id/avatar-v1.png',
                    createdAt: '2026-06-22T09:00:00.000Z'
                }
            ]
        }
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Unauthorized'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], DigitalAvatarController.prototype, "getAvatarHistory", null);
_ts_decorate([
    (0, _common.Post)('generate/premium'),
    (0, _common.HttpCode)(200),
    (0, _swagger.ApiOperation)({
        summary: 'Generate a PREMIUM_PHOTOREALISTIC avatar from face and body analysis traits'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Premium avatar generated and activated successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 400,
        description: 'Insufficient trait data'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Unauthorized'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], DigitalAvatarController.prototype, "generatePremiumAvatar", null);
_ts_decorate([
    (0, _common.Post)('generate/digital-twin'),
    (0, _swagger.ApiOperation)({
        summary: 'Generate a DIGITAL_TWIN_3D avatar (reserved — not implemented yet)'
    }),
    (0, _swagger.ApiResponse)({
        status: 501,
        description: '3D Digital Twin generation not available yet'
    }),
    (0, _swagger.ApiResponse)({
        status: 400,
        description: 'Insufficient trait data'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Unauthorized'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], DigitalAvatarController.prototype, "generateDigitalTwinAvatar", null);
_ts_decorate([
    (0, _common.Post)('generate/basic'),
    (0, _common.HttpCode)(200),
    (0, _swagger.ApiOperation)({
        summary: 'Generate a new BASIC_2D avatar version from profile and analysis traits'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Basic avatar generated and activated successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 400,
        description: 'Insufficient trait data'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Unauthorized'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], DigitalAvatarController.prototype, "generateBasicAvatar", null);
_ts_decorate([
    (0, _common.Post)('generate'),
    (0, _common.HttpCode)(200),
    (0, _swagger.ApiOperation)({
        summary: 'Generate a new digital avatar version from user traits'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Avatar generated and activated successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 400,
        description: 'Insufficient trait data'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Unauthorized'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], DigitalAvatarController.prototype, "generateAvatar", null);
_ts_decorate([
    (0, _common.Put)('activate/:id'),
    (0, _swagger.ApiOperation)({
        summary: 'Activate a specific avatar version (only one active per user)'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Avatar activated successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Unauthorized'
    }),
    (0, _swagger.ApiResponse)({
        status: 403,
        description: 'Cannot activate another user\'s avatar'
    }),
    (0, _swagger.ApiResponse)({
        status: 404,
        description: 'Avatar not found'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], DigitalAvatarController.prototype, "activateAvatar", null);
_ts_decorate([
    (0, _common.Put)('update'),
    (0, _swagger.ApiOperation)({
        summary: 'Create a new avatar version from an update (version +1) or activate a historical version'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Avatar updated successfully'
    }),
    (0, _swagger.ApiResponse)({
        status: 400,
        description: 'Invalid update payload'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Unauthorized'
    }),
    (0, _swagger.ApiResponse)({
        status: 404,
        description: 'Avatar not found'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], DigitalAvatarController.prototype, "updateAvatar", null);
DigitalAvatarController = _ts_decorate([
    (0, _swagger.ApiTags)('digital-avatar'),
    (0, _swagger.ApiBearerAuth)(),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Controller)('digital-avatar'),
    _ts_param(0, (0, _common.Inject)(_digitalavatarservice.DigitalAvatarService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], DigitalAvatarController);

//# sourceMappingURL=digital-avatar.controller.js.map