import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FaceRepository } from '../../face/repositories/face.repository';
import {
  FACE_TRAIT_SOURCE,
  FACE_VECTOR_SIZE,
} from '../constants/face-analysis.constants';

export @Injectable()
class FaceBiometricTraitsService {
  constructor(
    @Inject(FaceRepository) faceRepository,
    @Inject(ConfigService) configService,
  ) {
    this.faceRepository = faceRepository;
    this.vectorSize = configService.get('face.vectorSize') || FACE_VECTOR_SIZE;
  }

  async collectBiometricTraits(userId) {
    const [registration, faceVector] = await Promise.all([
      this.faceRepository.findFaceRegistration(userId),
      this.faceRepository.getFaceVector(userId).catch(() => null),
    ]);

    const isRegistered = Boolean(registration?.is_face_registered);
    const hasVector = Array.isArray(faceVector) && faceVector.length > 0;

    return {
      is_face_registered: isRegistered,
      registered_at: registration?.registered_at || null,
      face_embedding_id: registration?.face_embedding_id || null,
      biometric_enabled: isRegistered && hasVector,
      has_face_vector: hasVector,
      embedding_dimensions: hasVector ? faceVector.length : this.vectorSize,
      quality_score: hasVector ? 1 : isRegistered ? 0.6 : null,
      analysis_source: FACE_TRAIT_SOURCE,
      analyzed_at: new Date().toISOString(),
    };
  }
}
