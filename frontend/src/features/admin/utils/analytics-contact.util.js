export function buildMailtoLink(emails, subject = 'Message from Wardrobe AI') {
  const list = (emails || []).map((email) => String(email || '').trim()).filter(Boolean);

  if (!list.length) {
    return null;
  }

  const params = new URLSearchParams({ subject });

  if (list.length === 1) {
    return `mailto:${encodeURIComponent(list[0])}?${params.toString()}`;
  }

  params.set('bcc', list.join(','));
  return `mailto:?${params.toString()}`;
}

export function buildTelLink(phone) {
  if (!phone) {
    return null;
  }

  const normalized = String(phone).replace(/[^\d+]/g, '');

  if (!normalized) {
    return null;
  }

  return `tel:${normalized}`;
}
