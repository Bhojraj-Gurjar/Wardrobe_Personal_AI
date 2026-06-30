import { fetchMe, refreshRequest } from '@/features/auth/services/auth.service';

function logSession(message, detail) {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  if (detail !== undefined) {
    console.log(`[Session] ${message}`, detail);
  } else {
    console.log(`[Session] ${message}`);
  }
}

export async function validateSession(accessToken, refreshToken) {
  if (!accessToken) {
    return { valid: false };
  }

  try {
    const user = await fetchMe(accessToken, { skipSessionInvalidation: true });
    logSession('✔ auth/me verified', { role: user?.role, status: user?.status });
    return { valid: true, user };
  } catch (error) {
    if (error?.status === 401) {
      logSession('access token expired — attempting refresh');

      if (!refreshToken) {
        return { valid: false };
      }

      try {
        const data = await refreshRequest(refreshToken);
        logSession('✔ token refreshed', { role: data?.user?.role });
        return {
          valid: true,
          session: {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            user: data.user,
          },
        };
      } catch (refreshError) {
        logSession('refresh failed', refreshError?.message);
        return { valid: false };
      }
    }

    if (error?.status === 403) {
      logSession('account forbidden', error?.message);
      return { valid: false };
    }

    // Network / unreachable API — do not mark session valid (prevents false-positive auth)
    if (!error?.status) {
      logSession('API unreachable during session check', error?.message);
      return { valid: false, transient: true };
    }

    logSession('session check failed', { status: error.status, message: error?.message });
    return { valid: false };
  }
}
