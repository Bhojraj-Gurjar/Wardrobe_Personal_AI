"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DigitalAvatarRepository", {
    enumerable: true,
    get: function() {
        return DigitalAvatarRepository;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../../database/prisma.service");
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
let DigitalAvatarRepository = class DigitalAvatarRepository {
    constructor(prismaService){
        this.prisma = prismaService;
    }
    findActiveByUserId(userId) {
        return this.prisma.digitalAvatar.findFirst({
            where: {
                user_id: userId,
                is_active: true
            },
            orderBy: {
                version: 'desc'
            }
        });
    }
    findHistoryByUserId(userId) {
        return this.prisma.digitalAvatar.findMany({
            where: {
                user_id: userId
            },
            orderBy: {
                version: 'asc'
            }
        });
    }
    findByIdAndUserId(userId, avatarId) {
        return this.prisma.digitalAvatar.findFirst({
            where: {
                id: avatarId,
                user_id: userId
            }
        });
    }
    findById(avatarId) {
        return this.prisma.digitalAvatar.findUnique({
            where: {
                id: avatarId
            }
        });
    }
    getLatestVersion(userId) {
        return this.prisma.digitalAvatar.findFirst({
            where: {
                user_id: userId
            },
            orderBy: {
                version: 'desc'
            },
            select: {
                version: true
            }
        });
    }
    findByUserIdAndVersion(userId, version) {
        return this.prisma.digitalAvatar.findFirst({
            where: {
                user_id: userId,
                version
            }
        });
    }
    deactivateAllForUser(userId, tx = this.prisma) {
        return tx.digitalAvatar.updateMany({
            where: {
                user_id: userId,
                is_active: true
            },
            data: {
                is_active: false
            }
        });
    }
    createAvatar(data, tx = this.prisma) {
        return tx.digitalAvatar.create({
            data
        });
    }
    updateAvatar(id, data, tx = this.prisma) {
        return tx.digitalAvatar.update({
            where: {
                id
            },
            data
        });
    }
    activateAvatar(userId, avatarId) {
        return this.prisma.$transaction(async (tx)=>{
            const avatar = await tx.digitalAvatar.findFirst({
                where: {
                    id: avatarId,
                    user_id: userId
                }
            });
            if (!avatar) {
                return null;
            }
            await this.deactivateAllForUser(userId, tx);
            return tx.digitalAvatar.update({
                where: {
                    id: avatarId
                },
                data: {
                    is_active: true
                }
            });
        });
    }
    createAndActivateAvatar(userId, data) {
        return this.prisma.$transaction(async (tx)=>{
            await this.deactivateAllForUser(userId, tx);
            return tx.digitalAvatar.create({
                data: {
                    ...data,
                    is_active: true
                }
            });
        });
    }
};
DigitalAvatarRepository = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_prismaservice.PrismaService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], DigitalAvatarRepository);

//# sourceMappingURL=digital-avatar.repository.js.map