import { formatEnumLabel } from '@/features/profile/constants/profile-options';
import { toPreferencesPayload } from '@/features/onboarding/schemas/onboarding.schema';
import { resolveStorageOrigin } from '@/constants/api';

export { formatEnumLabel };

export function resolveProfileImageUrl(value) {
  if (!value) {
    return null;
  }

  const raw = String(value).trim();

  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:')) {
    return raw;
  }

  const origin = resolveStorageOrigin();
  const path = raw.startsWith('/') ? raw : `/${raw}`;

  return `${origin}${path}`;
}

export function splitName(fullName = '') {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return { firstName: '', lastName: '' };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

export function joinName(firstName, lastName) {
  return [firstName, lastName].map((part) => part?.trim()).filter(Boolean).join(' ');
}

export function stripUndefinedValues(values = {}) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined && value !== null),
  );
}

export function mergePreferences(existing = {}, patch = {}) {
  const next = {
    ...(existing && typeof existing === 'object' ? existing : {}),
  };

  Object.entries(patch).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      next[key] = value;
    }
  });

  return next;
}

export function preferencesToLifestyleStyle(preferences = {}) {
  return {
    lifestyle: {
      occupation: preferences.occupation || '',
      shopping_frequency: preferences.shopping_frequency || '',
      budget_preference: preferences.budget_preference || '',
      preferred_categories: preferences.preferred_categories || [],
    },
    style: {
      favorite_colors: preferences.favorite_colors || [],
      favorite_brands: preferences.favorite_brands || [],
      fashion_influencers: preferences.fashion_influencers || [],
      style_inspiration: preferences.style_inspiration || [],
      preferred_outfit_types: preferences.preferred_outfit_types || [],
    },
  };
}

export function buildPreferencesUpdate(existing = {}, lifestyle = {}, style = {}, extras = {}) {
  const base = toPreferencesPayload(lifestyle, style);
  return mergePreferences(existing, stripUndefinedValues({ ...base, ...extras }));
}

/** Build a partial profile PATCH payload — omits undefined/null top-level fields. */
export function buildProfilePatch(patch = {}) {
  return stripUndefinedValues(patch);
}

export function withCacheBust(url, version) {
  if (!url) return null;
  if (!version) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(version)}`;
}

export function formatProfileDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}
