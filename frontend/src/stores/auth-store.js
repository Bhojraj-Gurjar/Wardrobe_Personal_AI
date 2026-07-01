import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AUTH_CONTEXT } from '@/features/auth/constants/auth-context';

const LEGACY_STORAGE_KEY = 'wardrobe-auth';
const STORAGE_KEY = 'wardrobe-auth-sessions';
const STORAGE_VERSION = 1;

const emptySession = () => ({
  accessToken: null,
  refreshToken: null,
  user: null,
});

function normalizeSession(session) {
  if (!session || typeof session !== 'object') {
    return emptySession();
  }

  return {
    accessToken: session.accessToken ?? null,
    refreshToken: session.refreshToken ?? null,
    user: session.user ?? null,
  };
}

function readLegacyPersistedSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    const session = normalizeSession(parsed?.state ?? parsed);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);

    if (!session.accessToken) {
      return null;
    }

    return session;
  } catch {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return null;
  }
}


export const useAuthStore = create(
  persist(
    (set) => ({
      userSession: emptySession(),
      adminSession: emptySession(),
      setUserSession: (session) =>
        set({ userSession: normalizeSession(session) }),
      setAdminSession: (session) =>
        set({ adminSession: normalizeSession(session) }),
      clearUserSession: () => set({ userSession: emptySession() }),
      clearAdminSession: () => set({ adminSession: emptySession() }),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      partialize: (state) => ({
        userSession: state.userSession,
        adminSession: state.adminSession,
      }),
      migrate: (persistedState, version) => {
        const legacy = readLegacyPersistedSession();
        if (legacy) {
          if (legacy.user?.role === 'ADMIN') {
            return {
              userSession: emptySession(),
              adminSession: legacy,
            };
          }

          return {
            userSession: legacy,
            adminSession: emptySession(),
          };
        }

        return persistedState;
      },
      onRehydrateStorage: () => () => {
        const legacy = readLegacyPersistedSession();
        if (!legacy) {
          return;
        }

        if (legacy.user?.role === 'ADMIN') {
          useAuthStore.getState().setAdminSession(legacy);
          return;
        }

        useAuthStore.getState().setUserSession(legacy);
      },
    },
  ),
);

export function getSessionSlice(context) {
  const state = useAuthStore.getState();
  return context === AUTH_CONTEXT.ADMIN ? state.adminSession : state.userSession;
}

export function setSessionSlice(context, session) {
  if (context === AUTH_CONTEXT.ADMIN) {
    useAuthStore.getState().setAdminSession(session);
    return;
  }

  useAuthStore.getState().setUserSession(session);
}

export function clearSessionSlice(context) {
  if (context === AUTH_CONTEXT.ADMIN) {
    useAuthStore.getState().clearAdminSession();
    return;
  }

  useAuthStore.getState().clearUserSession();
}

export function getUserAccessToken() {
  return getSessionSlice(AUTH_CONTEXT.USER).accessToken;
}

export function getAdminAccessToken() {
  return getSessionSlice(AUTH_CONTEXT.ADMIN).accessToken;
}

export function useUserAccessToken() {
  return useAuthStore((state) => state.userSession.accessToken);
}

export function useUserRefreshToken() {
  return useAuthStore((state) => state.userSession.refreshToken);
}

export function useUserProfile() {
  return useAuthStore((state) => state.userSession.user);
}

export function useAdminAccessToken() {
  return useAuthStore((state) => state.adminSession.accessToken);
}

export function useAdminRefreshToken() {
  return useAuthStore((state) => state.adminSession.refreshToken);
}

export function useAdminProfile() {
  return useAuthStore((state) => state.adminSession.user);
}

export function useSetUserSession() {
  return useAuthStore((state) => state.setUserSession);
}

export function useSetAdminSession() {
  return useAuthStore((state) => state.setAdminSession);
}
