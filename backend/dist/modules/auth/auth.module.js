"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuthModule", {
    enumerable: true,
    get: function() {
        return AuthModule;
    }
});
const _common = require("@nestjs/common");
const _passport = require("@nestjs/passport");
const _jwt = require("@nestjs/jwt");
const _config = require("@nestjs/config");
const _userpipelinemodule = require("../user-pipeline/user-pipeline.module");
const _authcontroller = require("./controllers/auth.controller");
const _authservice = require("./services/auth.service");
const _authrepository = require("./repositories/auth.repository");
const _jwtstrategy = require("./strategies/jwt.strategy");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let AuthModule = class AuthModule {
};
AuthModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            (0, _common.forwardRef)(()=>_userpipelinemodule.UserPipelineModule),
            _passport.PassportModule.register({
                defaultStrategy: 'jwt'
            }),
            _jwt.JwtModule.registerAsync({
                imports: [
                    _config.ConfigModule
                ],
                inject: [
                    _config.ConfigService
                ],
                useFactory: (configService)=>({
                        secret: configService.get('jwt.secret'),
                        signOptions: {
                            expiresIn: configService.get('jwt.expiresIn')
                        }
                    })
            })
        ],
        controllers: [
            _authcontroller.AuthController
        ],
        providers: [
            _authservice.AuthService,
            _authrepository.AuthRepository,
            _jwtstrategy.JwtStrategy
        ],
        exports: [
            _authservice.AuthService,
            _jwt.JwtModule,
            _passport.PassportModule
        ]
    })
], AuthModule);

//# sourceMappingURL=auth.module.js.map