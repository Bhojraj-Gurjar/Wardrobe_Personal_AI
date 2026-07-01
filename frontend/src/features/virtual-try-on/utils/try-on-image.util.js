import { resolveStorageOrigin } from '@/constants/api';

const STORAGE_ORIGIN = resolveStorageOrigin();

function browserOrigin() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return STORAGE_ORIGIN;
}



/** Rewrite backend/ai-service absolute URLs to same-origin paths proxied by Next.js. */

function rewriteAssetUrlForBrowser(url) {

  const origin = browserOrigin();



  return String(url)

    .replace(/^https?:\/\/localhost:3000/i, origin)

    .replace(/^https?:\/\/127\.0\.0\.1:3000/i, origin)

    .replace(/^https?:\/\/localhost:8000/i, origin)

    .replace(/^https?:\/\/127\.0\.0\.1:8000/i, origin)

    .replace(/^https?:\/\/ai-service:8000/i, origin);

}



/** Strip cache-busting query/hash so API calls receive a stable storage URL. */

export function stripSessionPhotoCacheParams(url) {

  if (!url || typeof url !== 'string') {

    return null;

  }



  return url.split('?')[0].split('#')[0];

}



export function resolveTryOnResultImageUrl(value) {

  if (!value) {

    return null;

  }



  const trimmed = String(value).trim();



  if (/^https?:\/\//i.test(trimmed)) {

    return rewriteAssetUrlForBrowser(trimmed);

  }



  if (trimmed.startsWith('/tryon/') || trimmed.startsWith('/uploads/')) {

    return `${browserOrigin()}${trimmed}`;

  }



  if (trimmed.startsWith('/')) {

    return `${STORAGE_ORIGIN}${trimmed}`;

  }



  return `${browserOrigin()}/uploads/${trimmed.replace(/^\/?uploads\//, '')}`;

}



export function areTryOnImageUrlsEquivalent(left, right) {

  if (!left && !right) {

    return true;

  }



  if (!left || !right) {

    return false;

  }



  return resolveTryOnResultImageUrl(left) === resolveTryOnResultImageUrl(right);

}



export function normalizeTryOnHistoryResult(result) {

  if (!result || typeof result !== 'object') {

    return result;

  }



  const generatedImageUrl = resolveTryOnResultImageUrl(

    result.generatedImageUrl || result.generatedImage,

  );



  return {

    ...result,

    generatedImageUrl,

    generatedImage: generatedImageUrl,

  };

}



export function mapVirtualTryOnClientError(error) {

  const status = error?.status;

  const payload = error?.payload;

  const payloadMessage = extractPayloadErrorMessage(payload);

  const message = String(payloadMessage || error?.message || '').trim();



  if (!message && status === 408) {

    return 'AI generation timed out.';

  }



  if (!message && status === 504) {

    return 'AI generation timed out.';

  }



  if (!message && status === 0) {

    return 'Network error. Unable to reach the server.';

  }



  if (message) {

    const normalized = message.toLowerCase();



    if (normalized === 'request failed') {

      return status

        ? `Virtual try-on failed (HTTP ${status}). The server may still be processing — check history and retry.`

        : 'Virtual try-on failed. Check your connection and retry.';

    }



    if (normalized.includes('invalid token') || normalized.includes('hugging face token')) {

      return 'Invalid Hugging Face token.';

    }



    if (normalized.includes('model loading')) {

      return 'Model loading. Please retry in a few seconds.';

    }



    if (normalized.includes('permission denied') || normalized.includes('storage upload failed')) {

      return 'Storage upload failed.';

    }



    if (normalized.includes('unable to reach') || normalized.includes('econnrefused')) {

      return 'Unable to reach AI service.';

    }



    if (normalized.includes('authentication') || status === 401) {

      return 'Authentication failed.';

    }



    if (normalized.includes('quota') || normalized.includes('rate limit')) {

      return 'Hugging Face quota exceeded.';

    }



    if (normalized.includes('timed out') || status === 408 || status === 504) {

      return 'AI generation timed out.';

    }



    if (normalized.includes('upload') && normalized.includes('fail')) {

      return 'Image upload failed.';

    }



    return message;

  }



  return 'Virtual try-on generation failed.';

}



function extractPayloadErrorMessage(payload) {

  if (!payload || typeof payload !== 'object') {

    return null;

  }



  if (Array.isArray(payload.message) && payload.message.length) {

    return payload.message.filter(Boolean).join(', ');

  }



  if (typeof payload.message === 'string' && payload.message.trim()) {

    return payload.message.trim();

  }



  if (typeof payload.detail === 'string' && payload.detail.trim()) {

    return payload.detail.trim();

  }



  return null;

}



export async function downloadTryOnImage(url, filename = 'virtual-try-on.png') {

  const resolved = resolveTryOnResultImageUrl(url);



  if (!resolved) {

    throw new Error('No generated image available to download.');

  }



  const response = await fetch(resolved);



  if (!response.ok) {

    throw new Error('Unable to download the generated image.');

  }



  const blob = await response.blob();

  const objectUrl = URL.createObjectURL(blob);

  const anchor = document.createElement('a');

  anchor.href = objectUrl;

  anchor.download = filename;

  document.body.appendChild(anchor);

  anchor.click();

  document.body.removeChild(anchor);

  URL.revokeObjectURL(objectUrl);

}


