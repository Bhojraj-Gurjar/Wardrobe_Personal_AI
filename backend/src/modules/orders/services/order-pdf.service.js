import { Inject, Injectable } from '@nestjs/common';
import { StoragePathResolver } from '../../../storage/services/storage-path-resolver.service';
import { StorageService } from '../../../storage/services/storage.service';
import { ORDER_DOCUMENT_TYPE } from '../validators/order.constants';

function escapePdfText(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildSimplePdf(lines) {
  const content = lines.map((line, index) => {
    const y = 780 - index * 18;
    return `BT /F1 11 Tf 50 ${y} Td (${escapePdfText(line)}) Tj ET`;
  }).join('\n');

  const stream = `stream\n${content}\nendstream`;
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
    `4 0 obj << /Length ${Buffer.byteLength(content, 'utf8')} >> ${stream} endobj`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((obj) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${obj}\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';

  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });

  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
}

export @Injectable()
class OrderPdfService {
  constructor(
    @Inject(StorageService) storageService,
    @Inject(StoragePathResolver) storagePathResolver,
  ) {
    this.storageService = storageService;
    this.storagePathResolver = storagePathResolver;
  }

  buildInvoiceLines(order, formatted) {
    const address = formatted.shipping_address || {};
    const lines = [
      'WARDROBE AI — TAX INVOICE',
      `Invoice: ${formatted.invoice_number || 'PENDING'}`,
      `Order: ${formatted.order_number}`,
      `Date: ${new Date(formatted.created_at).toLocaleDateString('en-IN')}`,
      '',
      'Bill To:',
      `${address.full_name || formatted.user?.name || 'Customer'}`,
      `${address.house_no || ''}, ${address.city || ''}, ${address.state || ''} ${address.pincode || ''}`,
      `Phone: ${address.phone || '—'}`,
      '',
      'Items:',
    ];

    (formatted.items || []).forEach((item) => {
      lines.push(
        `- ${item.product?.name || 'Product'} x${item.quantity} @ ₹${item.price}`,
      );
    });

    lines.push(
      '',
      `Subtotal: ₹${formatted.subtotal ?? 0}`,
      `Discount: ₹${formatted.discount ?? 0}`,
      `Shipping: ₹${formatted.shipping ?? 0}`,
      `Tax (GST placeholder): ₹${formatted.tax ?? 0}`,
      `Grand Total: ₹${formatted.total_amount}`,
      `Payment: ${formatted.payment_method || 'COD'} (${formatted.payment_status || 'pending'})`,
      '',
      'Terms: Goods once sold are subject to return policy.',
      'Authorized Signatory — Wardrobe AI',
    );

    return lines;
  }

  buildLabelLines(order, formatted) {
    const address = formatted.shipping_address || {};
    return [
      'WARDROBE AI — SHIPPING LABEL',
      `Order: ${formatted.order_number}`,
      `Package ID: ${formatted.package_id || formatted.id.slice(0, 8).toUpperCase()}`,
      `Tracking: ${formatted.tracking_number || 'Assign at handover'}`,
      '',
      'Ship To:',
      `${address.full_name || formatted.user?.name || 'Customer'}`,
      `${address.house_no || ''}`,
      `${address.landmark ? `${address.landmark}, ` : ''}${address.city || ''}`,
      `${address.state || ''} — ${address.pincode || ''}`,
      `Phone: ${address.phone || '—'}`,
      '',
      `Weight: ${formatted.package_weight ? `${formatted.package_weight} kg` : 'TBD'}`,
      `Courier: ${formatted.courier_name || 'TBD'}`,
      '',
      `[QR:${formatted.order_number}]`,
    ];
  }

  async generateAndStore(order, formatted, documentType, adminId = null) {
    const lines = documentType === ORDER_DOCUMENT_TYPE.INVOICE
      ? this.buildInvoiceLines(order, formatted)
      : this.buildLabelLines(order, formatted);

    const buffer = buildSimplePdf(lines);
    const fileId = `${documentType.toLowerCase()}-${Date.now()}`;
    const fileName = `${fileId}.pdf`;

    const upload = await this.storageService.uploadOrderDocument({
      orderId: order.id,
      fileId,
      buffer,
      mimeType: 'application/pdf',
    });

    return {
      document_type: documentType,
      file_name: fileName,
      storage_path: upload.storagePath,
      public_url: this.storagePathResolver.toPublicUrl(upload.storagePath),
      mime_type: 'application/pdf',
      generated_by: adminId,
      buffer,
    };
  }
}
