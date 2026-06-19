import { Inject, Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

export @ApiTags('health')
@Controller()
class AppController {
  constructor(@Inject(AppService) appService) {
    this.appService = appService;
  }

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }
}
