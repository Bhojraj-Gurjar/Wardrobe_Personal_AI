import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

function normalizeSku(sku) {
  return String(sku || '').trim().toUpperCase();
}

export @Injectable()
class SeedSuppressionService {
  constructor(@Inject(PrismaService) prisma) {
    this.prisma = prisma;
    this.logger = new Logger(SeedSuppressionService.name);
  }

  async isSkuSuppressed(sku) {
    const normalized = normalizeSku(sku);

    if (!normalized) {
      return false;
    }

    const row = await this.prisma.seedSuppressedSku.findUnique({
      where: { sku: normalized },
      select: { sku: true },
    });

    return Boolean(row);
  }

  async recordSuppression(sku) {
    const normalized = normalizeSku(sku);

    if (!normalized) {
      return;
    }

    try {
      await this.prisma.seedSuppressedSku.upsert({
        where: { sku: normalized },
        update: {},
        create: { sku: normalized },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to record seed suppression for SKU ${normalized}: ${error?.message || 'Unknown error'}`,
      );
    }
  }
}
