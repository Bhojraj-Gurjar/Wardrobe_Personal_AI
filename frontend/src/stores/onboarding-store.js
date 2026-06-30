import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useOnboardingStore = create(
  persist(
    (set) => ({
      personalDetails: null,
      lifestyle: null,
      style: null,
      completed: false,
      showWelcome: false,
      setPersonalDetails: (personalDetails) => set({ personalDetails }),
      setLifestyle: (lifestyle) => set({ lifestyle }),
      setStyle: (style) => set({ style }),
      markCompleted: () => set({ completed: true, showWelcome: true }),
      clearWelcome: () => set({ showWelcome: false }),
      resetOnboarding: () =>
        set({
          personalDetails: null,
          lifestyle: null,
          style: null,
          completed: false,
          showWelcome: false,
        }),
    }),
    {
      name: 'wardrobe-onboarding',
      partialize: (state) => ({
        personalDetails: state.personalDetails,
        lifestyle: state.lifestyle,
        style: state.style,
        completed: state.completed,
        showWelcome: state.showWelcome,
      }),
    },
  ),
);
