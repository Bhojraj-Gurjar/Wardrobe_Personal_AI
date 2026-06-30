"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _appcontroller = require("./app.controller");
const _appservice = require("./app.service");
describe('AppController', ()=>{
    let appController;
    const mockAppService = {
        getHealth: jest.fn(()=>({
                status: 'ok',
                service: 'Wardrobe AI API',
                layer: 'nestjs',
                uptime: 42
            })),
        getMetrics: jest.fn(),
        getAiHealth: jest.fn(),
        getQdrantHealth: jest.fn(),
        getDiagnostics: jest.fn()
    };
    beforeEach(async ()=>{
        jest.clearAllMocks();
        const app = await _testing.Test.createTestingModule({
            controllers: [
                _appcontroller.AppController
            ],
            providers: [
                {
                    provide: _appservice.AppService,
                    useValue: mockAppService
                }
            ]
        }).compile();
        appController = app.get(_appcontroller.AppController);
    });
    describe('getHealth', ()=>{
        it('returns the health payload from AppService', ()=>{
            expect(appController.getHealth()).toEqual({
                status: 'ok',
                service: 'Wardrobe AI API',
                layer: 'nestjs',
                uptime: 42
            });
            expect(mockAppService.getHealth).toHaveBeenCalledTimes(1);
        });
    });
});

//# sourceMappingURL=app.controller.spec.js.map