import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { REFRESH_SOURCES } from '../../fashion-dna/constants/fashion-dna-regeneration.constants';
import { FashionDnaRegenerationService } from '../../fashion-dna/services/fashion-dna-regeneration.service';
import { OrdersRepository } from '../repositories/orders.repository';

export @Injectable()
class OrdersService {
  constructor(
    @Inject(OrdersRepository) ordersRepository,
    @Inject(FashionDnaRegenerationService) fashionDnaRegenerationService,
  ) {
    this.ordersRepository = ordersRepository;
    this.fashionDnaRegenerationService = fashionDnaRegenerationService;
  }

  async create(userId, dto) {
    if (dto.product_id) {
      const productExists = await this.ordersRepository.productExists(dto.product_id);

      if (!productExists) {
        throw new NotFoundException('Product not found');
      }
    }

    const order = await this.ordersRepository.create(userId, dto);

    this.fashionDnaRegenerationService.trigger(userId, REFRESH_SOURCES.PURCHASE);

    return this.formatOrder(order);
  }

  async findAll(userId, query) {
    const [orders, total] = await this.ordersRepository.findManyByUserId(
      userId,
      query,
    );

    return {
      items: orders.map((order) => this.formatOrder(order)),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }

  async findOne(userId, id) {
    const order = await this.ordersRepository.findByIdAndUserId(id, userId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.formatOrder(order);
  }

  formatOrder(order) {
    return {
      id: order.id,
      user_id: order.user_id,
      product_id: order.product_id ?? null,
      brand_id: order.product?.brand_id ?? null,
      total_amount: order.total_amount,
      status: order.status,
      created_at: order.created_at,
      updated_at: order.updated_at,
    };
  }
}
