export function slugifySkuPart(value: string) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 12);
}

export function buildVariantSku(baseSku: string, color: string, size: string) {
  const slug = `${color}-${size}`.replace(/\s+/g, '').toUpperCase();
  return baseSku ? `${baseSku}-${slug}` : undefined;
}

export function buildColorVariantSku(baseSku: string, color: string) {
  return baseSku ? `${baseSku}-${slugifySkuPart(color)}` : undefined;
}

export function buildSizeVariantSku(baseSku: string, size: string) {
  return baseSku ? `${baseSku}-${slugifySkuPart(size)}` : undefined;
}
