import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { normalizeOutfitSlots } from '@/features/virtual-try-on/utils/outfit-selection.util';

const EMPTY_IDS = Object.freeze({});

const EMPTY_SESSION = {
  temporaryBodyPhotoUrl: null,
  useSessionPhoto: false,
  sessionPhotoRevision: null,
  selectedProductId: null,
  selectedOutfitSlots: {
    pants: null,
    tshirt: null,
    shirt: null,
    jacket: null,
    dress: null,
  },
  activeCategory: '',
  search: '',
  compatibleOnly: true,
  latestResult: null,
  savedResultIds: EMPTY_IDS,
  closetResultIds: EMPTY_IDS,
  pendingProductId: null,
  tryOnMode: null,
  tryOnModeLabel: null,
};

function coerceResultIdMap(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }

  return EMPTY_IDS;
}

function normalizeSession(session = {}) {
  return {
    ...EMPTY_SESSION,
    ...session,
    selectedOutfitSlots: normalizeOutfitSlots(session.selectedOutfitSlots),
    savedResultIds: coerceResultIdMap(session.savedResultIds),
    closetResultIds: coerceResultIdMap(session.closetResultIds),
  };
}

export function normalizeSessionForUser(session) {
  return normalizeSession(session);
}

export const NO_USER_SESSION = Object.freeze(normalizeSession({}));

export const useVirtualTryOnSessionStore = create(
  persist(
    (set, get) => ({
      sessionsByUserId: {},

      getSession(userId) {
        if (!userId) {
          return NO_USER_SESSION;
        }

        return normalizeSession(get().sessionsByUserId[userId]);
      },

      patchSession(userId, patch) {
        if (!userId) {
          return;
        }

        set((state) => ({
          sessionsByUserId: {
            ...state.sessionsByUserId,
            [userId]: normalizeSession({
              ...state.sessionsByUserId[userId],
              ...patch,
            }),
          },
        }));
      },

      resetSession(userId) {
        if (!userId) {
          return;
        }

        set((state) => {
          const next = { ...state.sessionsByUserId };
          delete next[userId];
          return { sessionsByUserId: next };
        });
      },

      clearUserSessions() {
        set({ sessionsByUserId: {} });
      },
    }),
    {
      name: 'wardrobe-vto-session',
      partialize: (state) => ({
        sessionsByUserId: state.sessionsByUserId,
      }),
    },
  ),
);
