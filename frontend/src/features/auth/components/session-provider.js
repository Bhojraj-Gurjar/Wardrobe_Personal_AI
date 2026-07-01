'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AUTH_CONTEXT } from '@/features/auth/constants/auth-context';
import {
  clearSessionSlice,
  setSessionSlice,
  useAuthStore,
} from '@/stores/auth-store';
import { useAuthHydrated } from '@/features/auth/hooks/use-auth-hydrated';
import { validateSession } from '@/features/auth/utils/validate-session';
import { invalidateAuthSession } from '@/features/auth/utils/invalidate-auth-session';
import { syncSessionCookies } from '@/features/auth/utils/session-cookie';
import { isAdminRoute } from '@/features/auth/utils/auth-routing';
import { isAdminUser } from '@/features/admin/utils/is-admin-user';
import { ROUTES } from '@/constants/routes';

const PUBLIC_PATHS = new Set([
  ROUTES.HOME,
  ROUTES.AUTH.LOGIN,
  ROUTES.AUTH.REGISTER,
  ROUTES.AUTH.FORGOT_PASSWORD,
  ROUTES.FACE.LOGIN,
]);

function shouldInvalidateRedirect(context, pathname) {
  if (context === AUTH_CONTEXT.ADMIN) {
    return isAdminRoute(pathname);
  }

  return !isAdminRoute(pathname) && !PUBLIC_PATHS.has(pathname);
}

const SessionContext = createContext({
  user: {
    status: 'loading',
    isAuthenticated: false,
    isVerified: false,
    revalidate: () => {},
  },
  admin: {
    status: 'loading',
    isAuthenticated: false,
    isVerified: false,
    revalidate: () => {},
  },
});

const TRANSIENT_RETRY_LIMIT = 3;
const TRANSIENT_RETRY_DELAY_MS = 1200;

function createIdleSessionState() {
  return {
    status: 'loading',
    isAuthenticated: false,
    isVerified: false,
  };
}

function useContextSessionValidation(context) {
  const hydrated = useAuthHydrated();
  const accessToken = useAuthStore((state) => (
    context === AUTH_CONTEXT.ADMIN
      ? state.adminSession.accessToken
      : state.userSession.accessToken
  ));
  const refreshToken = useAuthStore((state) => (
    context === AUTH_CONTEXT.ADMIN
      ? state.adminSession.refreshToken
      : state.userSession.refreshToken
  ));
  const [status, setStatus] = useState('loading');
  const [isVerified, setIsVerified] = useState(false);
  const transientRetriesRef = useRef(0);
  const revalidateInFlightRef = useRef(false);

  const revalidate = useCallback(async () => {
    if (!hydrated) {
      setStatus('loading');
      setIsVerified(false);
      return;
    }

    if (!accessToken) {
      setStatus('unauthenticated');
      setIsVerified(true);
      return;
    }

    if (revalidateInFlightRef.current) {
      return;
    }

    revalidateInFlightRef.current = true;
    setStatus('loading');
    setIsVerified(false);

    const result = await validateSession(accessToken, refreshToken);

    if (!result.valid) {
      if (result.transient && transientRetriesRef.current < TRANSIENT_RETRY_LIMIT) {
        transientRetriesRef.current += 1;
        revalidateInFlightRef.current = false;
        window.setTimeout(() => {
          revalidate();
        }, TRANSIENT_RETRY_DELAY_MS * transientRetriesRef.current);
        return;
      }

      transientRetriesRef.current = 0;
      revalidateInFlightRef.current = false;
      setStatus('unauthenticated');
      setIsVerified(true);
      clearSessionSlice(context);
      if (typeof window !== 'undefined' && shouldInvalidateRedirect(context, window.location.pathname)) {
        invalidateAuthSession({
          context,
          redirect: true,
          preserveReturnPath: true,
          reason: 'session_expired',
        });
      }
      return;
    }

    transientRetriesRef.current = 0;

    const nextUser = result.session?.user || result.user;
    const nextAccessToken = result.session?.accessToken || accessToken;
    const nextRefreshToken = result.session?.refreshToken || refreshToken;

    if (context === AUTH_CONTEXT.ADMIN && !isAdminUser(nextUser)) {
      revalidateInFlightRef.current = false;
      setStatus('unauthenticated');
      setIsVerified(true);
      clearSessionSlice(context);
      if (typeof window !== 'undefined' && shouldInvalidateRedirect(context, window.location.pathname)) {
        invalidateAuthSession({
          context,
          redirect: true,
          preserveReturnPath: true,
          reason: 'forbidden',
        });
      }
      return;
    }

    setSessionSlice(context, {
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
      user: nextUser,
    });
    syncSessionCookies(context, nextUser);

    revalidateInFlightRef.current = false;
    setStatus('authenticated');
    setIsVerified(true);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Session:${context}] verified`, {
        userId: nextUser?.id,
        role: nextUser?.role,
      });
    }
  }, [accessToken, context, hydrated, refreshToken]);

  useEffect(() => {
    if (!hydrated) {
      setStatus('loading');
      setIsVerified(false);
      return;
    }

    revalidate();
  }, [hydrated, revalidate]);

  const resolvedStatus = hydrated ? status : 'loading';
  const resolvedVerified = hydrated ? isVerified : false;

  return useMemo(
    () => ({
      status: resolvedStatus,
      isAuthenticated: resolvedStatus === 'authenticated' && resolvedVerified,
      isVerified: resolvedVerified,
      revalidate,
    }),
    [revalidate, resolvedStatus, resolvedVerified],
  );
}

export function SessionProvider({ children }) {
  const userSession = useContextSessionValidation(AUTH_CONTEXT.USER);
  const adminSession = useContextSessionValidation(AUTH_CONTEXT.ADMIN);

  const value = useMemo(
    () => ({
      user: userSession,
      admin: adminSession,
    }),
    [adminSession, userSession],
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(context = AUTH_CONTEXT.USER) {
  const sessions = useContext(SessionContext);
  return sessions[context] ?? createIdleSessionState();
}
