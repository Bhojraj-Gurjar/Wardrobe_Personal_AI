import { API_BASE_URL, API_TIMEOUT_MS } from '@/constants/api';
import { invalidateAuthSession } from '@/features/auth/utils/invalidate-auth-session';

function extractApiErrorMessage(payload) {
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

  if (Array.isArray(payload.detail) && payload.detail.length) {
    return payload.detail
      .map((item) => (typeof item === 'string' ? item : item?.msg || String(item)))
      .filter(Boolean)
      .join(', ');
  }

  if (typeof payload.error === 'string' && payload.error.trim()) {
    return payload.error.trim();
  }

  return null;
}

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

function mergeAbortSignals(timeoutMs, externalSignal) {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

  const cleanup = () => clearTimeout(timeoutId);

  if (!externalSignal) {
    return { signal: timeoutController.signal, cleanup };
  }

  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.any === 'function') {
    return {
      signal: AbortSignal.any([timeoutController.signal, externalSignal]),
      cleanup,
    };
  }

  const composite = new AbortController();
  const onAbort = () => {
    if (!composite.signal.aborted) {
      composite.abort();
    }
  };

  timeoutController.signal.addEventListener('abort', onAbort, { once: true });
  externalSignal.addEventListener('abort', onAbort, { once: true });

  return { signal: composite.signal, cleanup };
}

export async function apiClient(path, options = {}) {
  const {
    method = 'GET',
    body,
    token,
    headers = {},
    signal,
    timeoutMs = API_TIMEOUT_MS,
    skipSessionInvalidation = false,
  } = options;

  const { signal: mergedSignal, cleanup } = mergeAbortSignals(timeoutMs, signal);

  const isFormData = Boolean(
    body
    && typeof FormData === 'function'
    && body instanceof FormData,
  );

  try {
    let response;

    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: {
          ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
        body: isFormData ? body : body ? JSON.stringify(body) : undefined,
        signal: mergedSignal,
      });
    } catch (error) {
      if (error?.name === 'AbortError') {
        if (signal?.aborted) {
          throw error;
        }

        throw new ApiError('Request timed out. Please try again.', 408);
      }

      throw new ApiError(
        'Unable to reach the server. Check that the API is running and try again.',
        0,
      );
    }

    const contentType = response.headers.get('content-type') || '';
    let payload = {};

    if (contentType.includes('application/json')) {
      payload = await response.json().catch(() => ({}));
    } else if (!response.ok) {
      const text = await response.text().catch(() => '');
      if (text.trim()) {
        payload = { message: text.trim().slice(0, 500) };
      }
    } else {
      payload = await response.json().catch(() => ({}));
    }

    if (!response.ok) {
      const message = extractApiErrorMessage(payload)
        || (response.status ? `Request failed (HTTP ${response.status})` : 'Request failed');

      if (process.env.NODE_ENV === 'development') {
        console.error('[api-client] request failed', {
          path,
          method,
          status: response.status,
          payload,
        });
      }


      if (
        response.status === 401
        && token
        && !skipSessionInvalidation
      ) {
        invalidateAuthSession({
          redirect: true,
          preserveReturnPath: true,
          reason: 'session_expired',
        });
      }

      throw new ApiError(message, response.status, payload);
    }

    return payload?.data ?? payload;
  } finally {
    cleanup();
  }
}
