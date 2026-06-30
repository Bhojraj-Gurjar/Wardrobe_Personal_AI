import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrdersRepository } from '../repositories/orders.repository';

export @Injectable()
class OrderAddressService {
  constructor(@Inject(OrdersRepository) ordersRepository) {
    this.ordersRepository = ordersRepository;
  }

  list(userId) {
    return this.ordersRepository.findAddressesByUserId(userId);
  }

  async create(userId, dto) {
    this.validateAddress(dto);

    return this.ordersRepository.createAddress(userId, {
      full_name: dto.full_name,
      phone: dto.phone,
      alternate_phone: dto.alternate_phone || null,
      country: dto.country || 'India',
      state: dto.state,
      city: dto.city,
      pincode: dto.pincode,
      house_no: dto.house_no,
      landmark: dto.landmark || null,
      address_type: dto.address_type || 'HOME',
      is_default: Boolean(dto.is_default),
    });
  }

  async update(userId, id, dto) {
    const existing = await this.ordersRepository.findAddressByIdAndUserId(id, userId);

    if (!existing) {
      throw new NotFoundException('Address not found');
    }

    if (dto.full_name || dto.phone || dto.pincode) {
      this.validateAddress({ ...existing, ...dto });
    }

    return this.ordersRepository.updateAddress(id, userId, {
      ...(dto.full_name ? { full_name: dto.full_name } : {}),
      ...(dto.phone ? { phone: dto.phone } : {}),
      ...(dto.alternate_phone !== undefined ? { alternate_phone: dto.alternate_phone } : {}),
      ...(dto.country ? { country: dto.country } : {}),
      ...(dto.state ? { state: dto.state } : {}),
      ...(dto.city ? { city: dto.city } : {}),
      ...(dto.pincode ? { pincode: dto.pincode } : {}),
      ...(dto.house_no ? { house_no: dto.house_no } : {}),
      ...(dto.landmark !== undefined ? { landmark: dto.landmark } : {}),
      ...(dto.address_type ? { address_type: dto.address_type } : {}),
      ...(dto.is_default !== undefined ? { is_default: Boolean(dto.is_default) } : {}),
    });
  }

  async remove(userId, id) {
    const result = await this.ordersRepository.deleteAddress(id, userId);

    if (!result.count) {
      throw new NotFoundException('Address not found');
    }

    return { deleted: true };
  }

  validateAddress(dto) {
    const required = ['full_name', 'phone', 'state', 'city', 'pincode', 'house_no'];
    const missing = required.filter((field) => !String(dto[field] || '').trim());

    if (missing.length) {
      throw new BadRequestException(`Missing address fields: ${missing.join(', ')}`);
    }

    if (!/^\d{6}$/.test(String(dto.pincode).trim())) {
      throw new BadRequestException('Pincode must be a 6-digit Indian postal code');
    }
  }

  toOrderAddressSnapshot(address) {
    if (!address) {
      return null;
    }

    return {
      full_name: address.full_name,
      phone: address.phone,
      alternate_phone: address.alternate_phone,
      country: address.country,
      state: address.state,
      city: address.city,
      pincode: address.pincode,
      house_no: address.house_no,
      landmark: address.landmark,
      address_type: address.address_type,
      address_id: address.id,
    };
  }
}
