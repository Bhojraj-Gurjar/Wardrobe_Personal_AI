import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';

export @Injectable()
class UsersService {
  constructor(@Inject(UsersRepository) usersRepository) {
    this.usersRepository = usersRepository;
  }

  async getProfile(userId) {
    const profile = await this.usersRepository.findProfileByUserId(userId);

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return this.formatProfile(profile);
  }

  async updateProfile(userId, dto) {
    await this.ensureProfileExists(userId);

    const profile = await this.usersRepository.updateProfileByUserId(
      userId,
      this.mapDtoToProfileData(dto),
    );

    return this.formatProfile(profile);
  }

  async ensureProfileExists(userId) {
    const profile = await this.usersRepository.findProfileByUserId(userId);

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  mapDtoToProfileData(dto) {
    const data = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.gender !== undefined) {
      data.gender = dto.gender;
    }

    if (dto.age !== undefined) {
      data.age = dto.age;
    }

    if (dto.height !== undefined) {
      data.height = dto.height;
    }

    if (dto.weight !== undefined) {
      data.weight = dto.weight;
    }

    if (dto.country !== undefined) {
      data.country = dto.country;
    }

    if (dto.language !== undefined) {
      data.language = dto.language;
    }

    if (dto.body_type !== undefined) {
      data.body_type = dto.body_type;
    }

    if (dto.skin_tone !== undefined) {
      data.skin_tone = dto.skin_tone;
    }

    if (dto.preferences !== undefined) {
      data.preferences = dto.preferences;
    }

    return data;
  }

  formatProfile(profile) {
    return {
      id: profile.id,
      user_id: profile.user_id,
      name: profile.name,
      gender: profile.gender,
      age: profile.age,
      height: profile.height,
      weight: profile.weight,
      country: profile.country,
      language: profile.language,
      body_type: profile.body_type,
      skin_tone: profile.skin_tone,
      preferences: profile.preferences,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  }
}
