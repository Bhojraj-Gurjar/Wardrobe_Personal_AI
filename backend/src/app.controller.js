import { Inject, Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

export @ApiTags('health')
@Controller()
class AppController {
  constructor(@Inject(AppService) appService) {
    this.appService = appService;
  }

  @Get('health')
  @ApiOperation({ summary: 'API health check' })
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('ai/health')
  @ApiOperation({ summary: 'FastAPI AI service health check' })
  getAiHealth() {
    return this.appService.getAiHealth();
  }

  @Get('qdrant/health')
  @ApiOperation({ summary: 'Qdrant vector database health check' })
  getQdrantHealth() {
    return this.appService.getQdrantHealth();
  }

  @Get('health/diagnostics')
  @ApiOperation({ summary: 'Face pipeline diagnostics (AI + Qdrant)' })
  getDiagnostics() {
    return this.appService.getDiagnostics();
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Runtime metrics (memory, uptime)' })
  getMetrics() {
    return this.appService.getMetrics();
  }
}
