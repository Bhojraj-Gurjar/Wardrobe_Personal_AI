import { create } from 'zustand';

export const useBodyCaptureStore = create((set) => ({
  bodyImageFile: null,
  videoFile: null,
  setBodyImageFile: (bodyImageFile) => set({ bodyImageFile }),
  setVideoFile: (videoFile) => set({ videoFile }),
  clearBodyCapture: () => set({ bodyImageFile: null, videoFile: null }),
}));
