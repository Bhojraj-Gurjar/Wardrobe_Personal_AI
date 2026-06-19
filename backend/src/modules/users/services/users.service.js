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

    if (dto.body_type !== undefined) {
      data.body_type = dto.body_type;
    }

    if (dto.skin_tone !== undefined) {
      data.skin_tone = dto.skin_tone;
    }

    return data;
  }

  formatProfile(profile) {
    return {
      id: profile.id,
      user_id: profile.user_id,
      gender: profile.gender,
      age: profile.age,
      height: profile.height,
      weight: profile.weight,
      body_type: profile.body_type,
      skin_tone: profile.skin_tone,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  }
}
