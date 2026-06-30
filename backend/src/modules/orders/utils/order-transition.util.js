import { BadRequestException } from '@nestjs/common';
import { ORDER_STATUS } from '../validators/order.constants';

/** Valid admin-driven status transitions — no skipping stages. */
export const ORDER_STATUS_TRANSITIONS = {
  [ORDER_STATUS.CREATED]: [
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.ON_HOLD,
  ],
  [ORDER_STATUS.CONFIRMED]: [
    ORDER_STATUS.PACKING,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.ON_HOLD,
  ],
  [ORDER_STATUS.PACKING]: [
    ORDER_STATUS.PACKED,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.ON_HOLD,
  ],
  [ORDER_STATUS.PACKED]: [
    ORDER_STATUS.READY_TO_DISPATCH,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.ON_HOLD,
  ],
  [ORDER_STATUS.READY_TO_DISPATCH]: [
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.ON_HOLD,
  ],
  [ORDER_STATUS.READY_FOR_HANDOVER]: [
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.ON_HOLD,
  ],
  [ORDER_STATUS.SHIPPED]: [
    ORDER_STATUS.COMPLETED,
    ORDER_STATUS.CANCELLED,
  ],
  [ORDER_STATUS.DELIVERED]: [
    ORDER_STATUS.COMPLETED,
    ORDER_STATUS.RETURNED,
  ],
  [ORDER_STATUS.COMPLETED]: [
    ORDER_STATUS.ARCHIVED,
    ORDER_STATUS.RETURNED,
  ],
  [ORDER_STATUS.RETURNED]: [
    ORDER_STATUS.REFUNDED,
  ],
  [ORDER_STATUS.REFUNDED]: [
    ORDER_STATUS.ARCHIVED,
  ],
  [ORDER_STATUS.ON_HOLD]: [
    ORDER_STATUS.CREATED,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.CANCELLED,
  ],
  [ORDER_STATUS.CANCELLED]: [],
  [ORDER_STATUS.ARCHIVED]: [],
};

export function assertValidStatusTransition(fromStatus, toStatus) {
  const allowed = ORDER_STATUS_TRANSITIONS[fromStatus] || [];

  if (!allowed.includes(toStatus)) {
    throw new BadRequestException(
      `Invalid status transition from ${fromStatus} to ${toStatus}`,
    );
  }
}

export function canTransition(fromStatus, toStatus) {
  return (ORDER_STATUS_TRANSITIONS[fromStatus] || []).includes(toStatus);
}

export function getOmsFlags(order) {
  const oms = order?.oms_metadata || {};
  return {
    labelGenerated: Boolean(order?.label_generated_at || oms.label_generated),
    invoiceGenerated: Boolean(order?.invoice_generated_at || oms.invoice_generated),
    packingComplete: Boolean(oms.packing_checklist?.seal_package),
  };
}

export function assertCanMoveToPacking(order) {
  const flags = getOmsFlags(order);

  if (!flags.labelGenerated || !flags.invoiceGenerated) {
    throw new BadRequestException(
      'Generate shipping label and invoice before moving to packing',
    );
  }
}

export function assertPackingChecklistComplete(order) {
  const checklist = order?.oms_metadata?.packing_checklist || {};
  const required = [
    'items_verified',
    'packaging_type',
    'quality_check',
    'seal_package',
  ];

  const missing = required.filter((key) => !checklist[key]);

  if (missing.length) {
    throw new BadRequestException(
      `Complete packing checklist before marking packed: ${missing.join(', ')}`,
    );
  }
}
