import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { OrdersRepository } from '../repositories/orders.repository';

export @Injectable()
class OrdersService {
  constructor(@Inject(OrdersRepository) ordersRepository) {
    this.ordersRepository = ordersRepository;
  }

  async create(userId, dto) {
    const order = await this.ordersRepository.create(userId, dto.total_amount);

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
      total_amount: order.total_amount,
      status: order.status,
      created_at: order.created_at,
      updated_at: order.updated_at,
    };
  }
}
