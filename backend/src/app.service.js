import { Injectable } from '@nestjs/common';

export @Injectable()
class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'Wardrobe AI API',
    };
  }
}
