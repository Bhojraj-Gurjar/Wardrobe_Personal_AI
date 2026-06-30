import * as XLSX from 'xlsx';

function normalizeHeader(header: string) {
  return String(header || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/^./, (char) => char.toLowerCase());
}

const HEADER_ALIASES: Record<string, string> = {
  producttype: 'productType',
  sellingprice: 'sellingPrice',
  stockquantity: 'stockQuantity',
  variantcolor: 'variantColor',
  variantsize: 'variantSize',
  variantstock: 'variantStock',
  variantsku: 'variantSku',
};

function mapRow(raw: Record<string, unknown>) {
  const mapped: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(raw)) {
    const normalized = normalizeHeader(key);
    const field = HEADER_ALIASES[normalized] || normalized;
    mapped[field] = typeof value === 'string' ? value.trim() : value;
  }

  return mapped;
}

export async function parseBulkImportFile(file: File): Promise<Record<string, unknown>[]> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    const text = await file.text();
    const workbook = XLSX.read(text, { type: 'string' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    return rows.map(mapRow);
  }

  if (extension === 'xlsx' || extension === 'xls') {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    return rows.map(mapRow);
  }

  throw new Error('Unsupported file format. Use CSV or Excel (.xlsx).');
}
