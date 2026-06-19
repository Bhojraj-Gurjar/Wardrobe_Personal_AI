"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UsersService", {
    enumerable: true,
    get: function() {
        return UsersService;
    }
});
const _common = require("@nestjs/common");
const _usersrepository = require("../repositories/users.repository");
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
let UsersService = class UsersService {
    constructor(usersRepository){
        this.usersRepository = usersRepository;
    }
    async getProfile(userId) {
        const profile = await this.usersRepository.findProfileByUserId(userId);
        if (!profile) {
            throw new _common.NotFoundException('Profile not found');
        }
        return this.formatProfile(profile);
    }
    async updateProfile(userId, dto) {
        await this.ensureProfileExists(userId);
        const profile = await this.usersRepository.updateProfileByUserId(userId, this.mapDtoToProfileData(dto));
        return this.formatProfile(profile);
    }
    async ensureProfileExists(userId) {
        const profile = await this.usersRepository.findProfileByUserId(userId);
        if (!profile) {
            throw new _common.NotFoundException('Profile not found');
        }
        return profile;
    }
    mapDtoToProfileData(dto) {
        const data = {};
        if (dto.gender !== undefined) {
            data.gender = dto.gender;
        }
        if (dto.age !== undefined) {
            data.age = dto.age;
        }
        if (dto.height !== undefined) {
            data.height = dto.height;
        }
        if (dto.weight !== undefined) {
            data.weight = dto.weight;
        }
        if (dto.body_type !== undefined) {
            data.body_type = dto.body_type;
        }
        if (dto.skin_tone !== undefined) {
            data.skin_tone = dto.skin_tone;
        }
        return data;
    }
    formatProfile(profile) {
        return {
            id: profile.id,
            user_id: profile.user_id,
            gender: profile.gender,
            age: profile.age,
            height: profile.height,
            weight: profile.weight,
            body_type: profile.body_type,
            skin_tone: profile.skin_tone,
            created_at: profile.created_at,
            updated_at: profile.updated_at
        };
    }
};
UsersService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_usersrepository.UsersRepository)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], UsersService);

//# sourceMappingURL=users.service.js.map