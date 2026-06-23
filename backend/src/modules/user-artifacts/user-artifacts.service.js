import { Inject, Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { PrismaService } from '../../database/prisma.service';

import { StorageService } from '../../storage/services/storage.service';

import { formatFaceAnalysisRecord } from '../face-analysis/utils/face-analysis.mapper';

import { formatBodyAnalysisRecord } from '../body-analysis/utils/body-analysis.mapper';

import { formatDigitalAvatarRecord } from '../digital-avatar/utils/digital-avatar.mapper';

import { StoragePathResolver } from '../../storage/services/storage-path-resolver.service';

import { BASIC_AVATAR_TYPE } from '../digital-avatar/constants/digital-avatar.constants';

import {

  DEFAULT_BODY_ANALYSIS,

  DEFAULT_FACE_ANALYSIS,

  DEFAULT_FASHION_DNA,

  DEFAULT_AVATAR_METADATA,

  buildDefaultAvatarSvg,

} from './constants/default-artifacts.constants';



function isDefaultRecord(raw) {

  return Boolean(raw && typeof raw === 'object' && raw.isDefault === true);

}



function hasRealFaceRecord(record) {

  return Boolean(record?.face_shape && !isDefaultRecord(record?.raw_ai_response));

}



function hasRealBodyRecord(record) {

  return Boolean(record?.body_type && !isDefaultRecord(record?.raw_ai_response));

}



function hasRealAvatarRecord(record) {

  return Boolean(record && !isDefaultRecord(record?.raw_ai_response));

}



function hasRealFashionDnaRecord(record) {

  return Boolean(record?.style_type && !isDefaultRecord(record?.preference_traits));

}



export @Injectable()

class UserArtifactsService {

  constructor(

    @Inject(PrismaService) prisma,

    @Inject(StorageService) storageService,

    @Inject(StoragePathResolver) storagePathResolver,

    @Inject(ModuleRef) moduleRef,

  ) {

    this.prisma = prisma;

    this.storageService = storageService;

    this.storagePathResolver = storagePathResolver;

    this.moduleRef = moduleRef;

    this.logger = new Logger(UserArtifactsService.name);

  }



  resolveFashionDnaService() {

    const { FashionDnaService } = require('../fashion-dna/services/fashion-dna.service');

    return this.moduleRef.get(FashionDnaService, { strict: false });

  }



  resolveFashionDnaCacheService() {

    const { FashionDnaCacheService } = require('../fashion-dna/services/fashion-dna-cache.service');

    return this.moduleRef.get(FashionDnaCacheService, { strict: false });

  }



  async ensureFaceAnalysis(userId) {

    const existing = await this.prisma.faceAnalysis.findUnique({

      where: { user_id: userId },

    });



    if (existing) {

      return formatFaceAnalysisRecord(existing);

    }



    const record = await this.prisma.faceAnalysis.create({

      data: {

        user_id: userId,

        ...DEFAULT_FACE_ANALYSIS,

      },

    });



    this.logger.log(`Default face_analysis created | userId=${userId}`);

    return formatFaceAnalysisRecord(record);

  }



  async ensureBodyAnalysis(userId) {

    const existing = await this.prisma.bodyAnalysis.findUnique({

      where: { user_id: userId },

    });



    if (existing) {

      return formatBodyAnalysisRecord(existing);

    }



    const record = await this.prisma.bodyAnalysis.create({

      data: {

        user_id: userId,

        ...DEFAULT_BODY_ANALYSIS,

      },

    });



    this.logger.log(`Default body_analysis created | userId=${userId}`);

    return formatBodyAnalysisRecord(record);

  }



  async ensureDigitalAvatar(userId) {

    const existing = await this.prisma.digitalAvatar.findFirst({

      where: { user_id: userId, is_active: true },

      orderBy: { version: 'desc' },

    });



    if (existing) {

      return formatDigitalAvatarRecord(

        existing,

        this.storagePathResolver.toPublicUrl.bind(this.storagePathResolver),

      );

    }



    const svg = buildDefaultAvatarSvg();

    const buffer = Buffer.from(svg, 'utf-8');

    const upload = await this.storageService.uploadAvatarImage({

      userId,

      version: 1,

      buffer,

      mimeType: 'image/svg+xml',

    });



    const record = await this.prisma.digitalAvatar.create({

      data: {

        user_id: userId,

        avatar_type: BASIC_AVATAR_TYPE,

        avatar_image: upload.storagePath,

        version: 1,

        is_active: true,

        raw_ai_response: {

          isDefault: true,

          avatarType: BASIC_AVATAR_TYPE,

          avatarImage: upload.storagePath,

          metadata: DEFAULT_AVATAR_METADATA,

          confidence: 85,

        },

      },

    });



    this.logger.log(`Default digital_avatar created | userId=${userId}`);

    return formatDigitalAvatarRecord(

      record,

      this.storagePathResolver.toPublicUrl.bind(this.storagePathResolver),

    );

  }



  async ensureFashionDna(userId) {

    const existing = await this.prisma.fashionDna.findUnique({

      where: { user_id: userId },

    });



    const fashionDnaService = this.resolveFashionDnaService();

    const fashionDnaCacheService = this.resolveFashionDnaCacheService();



    if (existing) {

      return fashionDnaService.formatFashionDna(existing, userId);

    }



    const record = await this.prisma.fashionDna.create({

      data: {

        user_id: userId,

        ...DEFAULT_FASHION_DNA,

        preference_traits: {

          ...DEFAULT_FASHION_DNA.preference_traits,

          isDefault: true,

        },

      },

    });



    const formatted = await fashionDnaService.formatFashionDna(record, userId);

    await fashionDnaCacheService.set(userId, formatted);



    this.logger.log(`Default fashion_dna created | userId=${userId}`);

    return formatted;

  }



  async ensureAllUserArtifacts(userId) {

    const [face, body, avatar, fashionDna] = await Promise.all([

      this.ensureFaceAnalysis(userId),

      this.ensureBodyAnalysis(userId),

      this.ensureDigitalAvatar(userId),

      this.ensureFashionDna(userId),

    ]);



    return { face, body, avatar, fashionDna };

  }



  async upgradeDefaultsIfNeeded(userId) {

    await this.ensureAllUserArtifacts(userId);



    const [face, body, avatar, dna] = await Promise.all([

      this.prisma.faceAnalysis.findUnique({ where: { user_id: userId } }),

      this.prisma.bodyAnalysis.findUnique({ where: { user_id: userId } }),

      this.prisma.digitalAvatar.findFirst({

        where: { user_id: userId, is_active: true },

        orderBy: { version: 'desc' },

      }),

      this.prisma.fashionDna.findUnique({ where: { user_id: userId } }),

    ]);



    return {

      faceAnalysis: hasRealFaceRecord(face),

      bodyAnalysis: hasRealBodyRecord(body),

      digitalAvatar: hasRealAvatarRecord(avatar),

      fashionDna: hasRealFashionDnaRecord(dna),

    };

  }

}

