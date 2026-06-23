import { Inject, Injectable } from '@nestjs/common';
import { FashionDnaRefreshService } from './fashion-dna-refresh.service';

export @Injectable()
class FashionDnaRegenerationService {
  constructor(@Inject(FashionDnaRefreshService) refreshService) {
    this.refreshService = refreshService;
  }

  trigger(userId, source) {
    this.refreshService.scheduleRegeneration(userId, source);
  }
}
