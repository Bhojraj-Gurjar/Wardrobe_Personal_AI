import { API_BASE_URL } from '@/constants/api';

export const AVATAR_API = {
  ME: '/avatar/me',
  GENERATE: '/avatar/generate',
  UPDATE: '/avatar',
  OUTFIT: '/avatar/outfit',
  GENERATION_PROFILE: '/avatar/generation-profile',
  SAVE_LOOK: '/avatar/outfit/save-look',
};

export async function fetchAvatar(token) {
  const response = await fetch(`${API_BASE_URL}${AVATAR_API.ME}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to load avatar');
  }

  return response.json();
}

export async function generateAvatar(token, payload = {}) {
  const response = await fetch(`${API_BASE_URL}${AVATAR_API.GENERATE}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to generate avatar');
  }

  return response.json();
}

export async function updateAvatar(token, payload) {
  const response = await fetch(`${API_BASE_URL}${AVATAR_API.UPDATE}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to update avatar');
  }

  return response.json();
}

export async function saveAvatarOutfit(token, payload) {
  const response = await fetch(`${API_BASE_URL}${AVATAR_API.OUTFIT}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to save outfit');
  }

  return response.json();
}

export async function fetchAvatarGenerationProfile(token) {
  const response = await fetch(`${API_BASE_URL}${AVATAR_API.GENERATION_PROFILE}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to load avatar generation profile');
  }

  return response.json();
}

export async function saveAvatarLookToCloset(token, payload) {
  const response = await fetch(`${API_BASE_URL}${AVATAR_API.SAVE_LOOK}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to save look to closet');
  }

  return response.json();
}
