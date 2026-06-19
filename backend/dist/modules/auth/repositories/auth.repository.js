"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuthRepository", {
    enumerable: true,
    get: function() {
        return AuthRepository;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../../../database/prisma.service");
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
let AuthRepository = class AuthRepository {
    constructor(prismaService){
        this.prisma = prismaService;
    }
    findByEmail(email) {
        return this.prisma.user.findUnique({
            where: {
                email
            }
        });
    }
    findByMobile(mobile) {
        return this.prisma.user.findUnique({
            where: {
                mobile
            }
        });
    }
    findById(id) {
        return this.prisma.user.findUnique({
            where: {
                id
            }
        });
    }
    createUserWithProfile({ email, mobile, passwordHash }) {
        return this.prisma.user.create({
            data: {
                email,
                mobile: mobile || null,
                password_hash: passwordHash,
                profile: {
                    create: {}
                }
            },
            include: {
                profile: true
            }
        });
    }
};
AuthRepository = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_prismaservice.PrismaService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], AuthRepository);

//# sourceMappingURL=auth.repository.js.map