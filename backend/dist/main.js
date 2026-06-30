"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _core = require("@nestjs/core");
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _swagger = require("@nestjs/swagger");
const _nestwinston = require("nest-winston");
const _helmet = /*#__PURE__*/ _interop_require_default(require("helmet"));
const _compression = /*#__PURE__*/ _interop_require_default(require("compression"));
const _path = require("path");
const _fs = require("fs");
const _appmodule = require("./app.module");
const _httpexceptionfilter = require("./common/filters/http-exception.filter");
const _allexceptionsfilter = require("./common/filters/all-exceptions.filter");
const _responseinterceptor = require("./common/interceptors/response.interceptor");
const _logginginterceptor = require("./common/interceptors/logging.interceptor");
const _constants = require("./common/constants");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
async function bootstrap() {
    const app = await _core.NestFactory.create(_appmodule.AppModule, {
        bufferLogs: true
    });
    const configService = app.get(_config.ConfigService);
    const logger = app.get(_nestwinston.WINSTON_MODULE_NEST_PROVIDER);
    app.useLogger(logger);
    app.use((0, _compression.default)());
    app.useBodyParser('json', {
        limit: '20mb'
    });
    app.useBodyParser('urlencoded', {
        extended: true,
        limit: '20mb'
    });
    app.use((0, _helmet.default)({
        crossOriginResourcePolicy: {
            policy: 'cross-origin'
        }
    }));
    const uploadsRoot = (0, _path.join)(process.cwd(), configService.get('storage.local.rootDir') || 'uploads');
    if (!(0, _fs.existsSync)(uploadsRoot)) {
        (0, _fs.mkdirSync)(uploadsRoot, {
            recursive: true
        });
    }
    app.useStaticAssets(uploadsRoot, {
        prefix: configService.get('storage.local.publicPath') || '/uploads'
    });
    const corsOrigins = configService.get('cors.origins') || [];
    const isProduction = configService.get('nodeEnv') === 'production';
    app.enableCors({
        origin: corsOrigins.length ? corsOrigins : isProduction ? false : true,
        credentials: true
    });
    app.setGlobalPrefix(_constants.API_PREFIX);
    app.useGlobalPipes(new _common.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
    }));
    app.useGlobalFilters(new _allexceptionsfilter.AllExceptionsFilter(), new _httpexceptionfilter.HttpExceptionFilter());
    app.useGlobalInterceptors(new _logginginterceptor.LoggingInterceptor(), new _responseinterceptor.ResponseInterceptor());
    const swaggerConfig = new _swagger.DocumentBuilder().setTitle(`${_constants.APP_NAME} API`).setDescription('REST API documentation for Wardrobe AI').setVersion('1.0').addBearerAuth().build();
    const document = _swagger.SwaggerModule.createDocument(app, swaggerConfig);
    _swagger.SwaggerModule.setup('docs', app, document);
    const port = configService.get('port');
    await app.listen(port);
    logger.log(`Application running on port ${port}`, 'Bootstrap');
    logger.log(`Swagger docs available at /docs`, 'Bootstrap');
}
bootstrap();

//# sourceMappingURL=main.js.map