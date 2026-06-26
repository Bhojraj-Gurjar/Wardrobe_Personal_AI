import { Inject, Injectable } from '@nestjs/common';
import { BodyPhotoProcessingService } from '../../body-analysis/services/body-photo-processing.service';

export @Injectable()
class BackgroundRemovalService {
  constructor(@Inject(BodyPhotoProcessingService) bodyPhotoProcessingService) {
    this.bodyPhotoProcessingService = bodyPhotoProcessingService;
  }

  getTransparentPngPath(userId) {
    return this.bodyPhotoProcessingService.getTransparentPngPath(userId);
  }

  transparentPngExists(userId) {
    return this.bodyPhotoProcessingService.transparentPngExists(userId);
  }

  ensureTransparentPng(userId, bodyImagePath) {
    return this.bodyPhotoProcessingService.ensureTransparentPng(userId, bodyImagePath);
  }
}
