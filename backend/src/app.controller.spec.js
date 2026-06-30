import { Test } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController;
  const mockAppService = {
    getHealth: jest.fn(() => ({
      status: 'ok',
      service: 'Wardrobe AI API',
      layer: 'nestjs',
      uptime: 42,
    })),
    getMetrics: jest.fn(),
    getAiHealth: jest.fn(),
    getQdrantHealth: jest.fn(),
    getDiagnostics: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: mockAppService }],
    }).compile();

    appController = app.get(AppController);
  });

  describe('getHealth', () => {
    it('returns the health payload from AppService', () => {
      expect(appController.getHealth()).toEqual({
        status: 'ok',
        service: 'Wardrobe AI API',
        layer: 'nestjs',
        uptime: 42,
      });
      expect(mockAppService.getHealth).toHaveBeenCalledTimes(1);
    });
  });
});
