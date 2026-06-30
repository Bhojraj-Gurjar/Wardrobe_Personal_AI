import { Inject, Injectable, Logger } from '@nestjs/common';

import { ModuleRef } from '@nestjs/core';

import { AvatarRepository } from './avatar.repository';

import { AvatarOutfitService } from './avatar-outfit.service';

import {

  formatAvatarRecord,

  formatAvatarVersionRecord,

} from './utils/avatar.mapper';

import {

  normalizeHairColor,

  normalizeSkinTone,

  resolveBaseAvatarUrl,

} from './constants/avatar-base.constants';

import { resolveTraitsFromModules } from './utils/avatar-trait.resolver';
import { buildAvatarGenerationProfile } from './utils/avatar-parameter-engine';
import {
  buildRpmModelUrl,
  buildRpmEditorConfig,
  extractRpmAvatarId,
  isReadyPlayerMeUrl,
} from './utils/rpm-avatar.util';
import {
  hasCustom3dAvatar as hasCustom3dAvatarUrl,
  normalizeHostedModelUrl,
} from './utils/avatar-model.util';



function resolveBodyAnalysisService(moduleRef) {

  const { BodyAnalysisService } = require('../body-analysis/body-analysis.service');

  return moduleRef.get(BodyAnalysisService, { strict: false });

}



function resolveFaceAnalysisService(moduleRef) {

  const { FaceAnalysisService } = require('../face-analysis/face-analysis.service');

  return moduleRef.get(FaceAnalysisService, { strict: false });

}



function resolveFashionDnaService(moduleRef) {

  const { FashionDnaService } = require('../fashion-dna/services/fashion-dna.service');

  return moduleRef.get(FashionDnaService, { strict: false });

}



function resolveUsersService(moduleRef) {

  const { UsersService } = require('../users/services/users.service');

  return moduleRef.get(UsersService, { strict: false });

}

function resolvePersonalClosetService(moduleRef) {
  const { PersonalClosetService } = require('../personal-closet/personal-closet.service');

  return moduleRef.get(PersonalClosetService, { strict: false });
}



export @Injectable()

class AvatarService {

  constructor(

    @Inject(AvatarRepository) avatarRepository,

    @Inject(AvatarOutfitService) avatarOutfitService,

    @Inject(ModuleRef) moduleRef,

  ) {

    this.avatarRepository = avatarRepository;

    this.avatarOutfitService = avatarOutfitService;

    this.moduleRef = moduleRef;

    this.logger = new Logger(AvatarService.name);

  }



  async collectTraitContext(userId) {

    const [bodyAnalysis, faceAnalysis, fashionDna, profile] = await Promise.all([

      resolveBodyAnalysisService(this.moduleRef)

        .getMyBodyAnalysis(userId)

        .catch(() => null),

      resolveFaceAnalysisService(this.moduleRef)

        .getMyFaceAnalysis(userId)

        .catch(() => null),

      resolveFashionDnaService(this.moduleRef)

        .getFashionDna(userId)

        .catch(() => null),

      resolveUsersService(this.moduleRef)

        .getProfile(userId)

        .catch(() => null),

    ]);



    const traits = resolveTraitsFromModules({

      bodyAnalysis,

      faceAnalysis,

      fashionDna,

      profile,

    });

    const generationProfile = buildAvatarGenerationProfile({

      bodyAnalysis,

      faceAnalysis,

      fashionDna,

      profile,

      traits,

    });

    return {

      ...traits,

      generationProfile,

      rpmEditorConfig: buildRpmEditorConfig(generationProfile),

    };

  }



  async createAvatarFromTraits(userId, traits, versionName = 'auto-generated') {

    const avatar = await this.avatarRepository.createAvatar({

      user_id: userId,

      body_type: traits.bodyType,

      skin_tone: traits.skinTone,

      hair_color: traits.hairColor,

      base_avatar_url: traits.baseAvatarUrl,

    });



    await this.avatarRepository.createVersion({

      avatar_id: avatar.id,

      version_name: versionName,

      image_url: traits.baseAvatarUrl,

    });



    await this.avatarRepository.upsertOutfit(avatar.id, {

      total_price: 0,

    });



    this.logger.log(

      `Avatar auto-generated for user ${userId} (body=${traits.bodyType || 'default'})`,

    );



    return this.avatarRepository.findByUserId(userId);

  }



  async ensureAvatar(userId) {

    const avatar = await this.avatarRepository.findByUserId(userId);



    if (avatar) {

      return avatar;

    }



    const traits = await this.collectTraitContext(userId);

    return this.createAvatarFromTraits(userId, traits);

  }



  async generateAvatar(userId, options = {}) {

    const traits = await this.collectTraitContext(userId);

    const versionName = options.versionName || 'generated';

    const baseAvatarUrl = options.baseAvatarUrl || traits.baseAvatarUrl;



    const avatar = await this.avatarRepository.upsertAvatar(userId, {

      body_type: traits.bodyType,

      skin_tone: traits.skinTone,

      hair_color: traits.hairColor,

      base_avatar_url: baseAvatarUrl,

    });



    await this.avatarRepository.createVersion({

      avatar_id: avatar.id,

      version_name: versionName,

      image_url: baseAvatarUrl,

    });



    await this.avatarRepository.upsertOutfit(avatar.id, {

      total_price: 0,

    });



    this.logger.log(`Avatar generated for user ${userId}`);



    return this.getAvatar(userId);

  }



  async getAvatar(userId) {

    const existing = await this.avatarRepository.findByUserId(userId);

    const wasAutoGenerated = !existing;

    const avatar = await this.ensureAvatar(userId);

    const traits = await this.collectTraitContext(userId);

    const outfit = await this.avatarOutfitService.loadOutfit(avatar.id);

    const rpmAvatarId = extractRpmAvatarId(avatar.model_3d_url);

    return {

      ...formatAvatarRecord(avatar, outfit, {

        stylePreferences: traits.stylePreferences,

        traitSources: traits.traitSources,

        wasAutoGenerated,

        generationProfile: traits.generationProfile,

        rpmEditorConfig: traits.rpmEditorConfig,

        rpmAvatarId,

        hasCustom3dAvatar: hasCustom3dAvatarUrl(avatar.model_3d_url),

        hasReadyPlayerMeAvatar: isReadyPlayerMeUrl(avatar.model_3d_url),

      }),

      versions: (avatar.versions || []).map(formatAvatarVersionRecord),

    };

  }



  async updateAvatar(userId, dto = {}) {

    await this.ensureAvatar(userId);



    const data = {};



    if (dto.bodyType !== undefined) {

      data.body_type = dto.bodyType;

      data.base_avatar_url = resolveBaseAvatarUrl(dto.bodyType);

    }



    if (dto.skinTone !== undefined) {

      data.skin_tone = normalizeSkinTone(dto.skinTone);

    }



    if (dto.hairColor !== undefined) {

      data.hair_color = normalizeHairColor(dto.hairColor);

    }



    if (dto.baseAvatarUrl !== undefined) {

      data.base_avatar_url = dto.baseAvatarUrl;

    }



    if (dto.model3dUrl !== undefined) {
      data.model_3d_url = dto.model3dUrl
        ? normalizeHostedModelUrl(dto.model3dUrl) || dto.model3dUrl
        : null;
    }



    if (dto.rpmAvatarId !== undefined) {

      data.model_3d_url = dto.rpmAvatarId
        ? buildRpmModelUrl(dto.rpmAvatarId)
        : data.model_3d_url;

    }



    if (!Object.keys(data).length) {

      return this.getAvatar(userId);

    }



    await this.avatarRepository.updateAvatar(userId, data);



    if (data.base_avatar_url) {

      const avatar = await this.avatarRepository.findByUserId(userId);



      await this.avatarRepository.createVersion({

        avatar_id: avatar.id,

        version_name: 'updated',

        image_url: data.base_avatar_url,

      });

    }



    return this.getAvatar(userId);

  }



  async getGenerationProfile(userId) {

    await this.ensureAvatar(userId);

    const traits = await this.collectTraitContext(userId);

    const avatar = await this.avatarRepository.findByUserId(userId);

    const rpmAvatarId = extractRpmAvatarId(avatar?.model_3d_url);

    return {

      generationProfile: traits.generationProfile,

      rpmEditorConfig: traits.rpmEditorConfig,

      rpmAvatarId,

      model3dUrl: avatar?.model_3d_url || null,

      hasCustom3dAvatar: hasCustom3dAvatarUrl(avatar?.model_3d_url),

      hasReadyPlayerMeAvatar: isReadyPlayerMeUrl(avatar?.model_3d_url),

    };

  }



  async saveLookToCloset(userId, payload = {}) {

    const avatar = await this.ensureAvatar(userId);

    const outfit = await this.avatarOutfitService.saveOutfit(avatar.id, payload.outfit || {});

    const products = Object.values(outfit?.products || {}).filter(Boolean);

    const closetService = resolvePersonalClosetService(this.moduleRef);

    const saved = await closetService.createSavedOutfitFromAvatar(userId, {

      name: payload.name || `Avatar Look · ${new Date().toLocaleDateString()}`,

      products: products.map((product) => ({

        id: product.id,

        name: product.name,

        brand: product.brand,

        price: product.price,

        imageUrl: product.images?.[0]?.url || product.imageUrl || null,

        category: product.category,

      })),

      items: products.map((product) => product.id),

      previewImage: payload.thumbnail || payload.previewImage || null,

      thumbnail: payload.thumbnail || payload.previewImage || null,

      totalPrice: outfit?.totalPrice ?? payload.totalPrice ?? 0,

      source: 'digital-avatar',

    });

    return {

      outfit,

      savedOutfit: saved,

    };

  }

}


