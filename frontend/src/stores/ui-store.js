import { create } from 'zustand';

export const useUiStore = create((set) => ({
  isMobileSidebarOpen: false,
  isDashboardSidebarCollapsed: false,
  setMobileSidebarOpen: (isMobileSidebarOpen) => set({ isMobileSidebarOpen }),
  toggleMobileSidebar: () =>
    set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
  toggleDashboardSidebarCollapsed: () =>
    set((state) => ({
      isDashboardSidebarCollapsed: !state.isDashboardSidebarCollapsed,
    })),
  setDashboardSidebarCollapsed: (isDashboardSidebarCollapsed) =>
    set({ isDashboardSidebarCollapsed }),
}));
