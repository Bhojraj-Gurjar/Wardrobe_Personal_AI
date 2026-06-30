'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '@/constants/app';
import { useSession } from '@/features/auth/components/session-provider';
import { isAdminUser } from '@/features/admin/utils/is-admin-user';
import { establishSession } from '@/features/auth/utils/establish-session';
import { useAuthStore } from '@/stores/auth-store';
import {
  adminFaceLogin,
  adminLogin,
  adminRegisterFace,
  adjustAdminProductInventory,
  cancelAdminOrder,
  changeAdminPassword,
  createAdminCmsProduct,
  deactivateAdminUser,
  deleteAdminProduct,
  deleteAdminUser,
  fetchAdminAnalytics,
  fetchAdminAnalyticsCategories,
  fetchAdminAnalyticsCustomers,
  fetchAdminAnalyticsDevices,
  fetchAdminAnalyticsOrdersDetail,
  fetchAdminAnalyticsProducts,
  fetchAdminAnalyticsUserGrowth,
  fetchAdminDashboard,
  fetchAdminOrders,
  fetchAdminOrdersAnalytics,
  fetchAdminOrdersByUser,
  fetchAdminOrdersSummary,
  fetchAdminProductById,
  fetchAdminProducts,
  fetchAdminProfile,
  fetchAdminUsers,
  importAdminBulkProducts,
  toggleAdminProductStatus,
  updateAdminOrderStatus,
  updateAdminProduct,
  updateAdminProfile,
  updateAdminUser,
  uploadAdminProductImages,
  validateAdminBulkProducts,
} from '@/features/admin/services/admin.service';

export function useAdminToken() {
  const token = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const { isAuthenticated, isVerified } = useSession();

  if (!token || !isVerified || !isAuthenticated || !isAdminUser(user)) {
    return null;
  }

  return token;
}

function invalidateUserCatalogQueries(queryClient) {
  ['products', 'recommendations', 'cart', 'wishlist'].forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey: [queryKey], refetchType: 'active' });
  });
}

function invalidateAdminProductQueries(queryClient, productId = null) {
  queryClient.invalidateQueries({ queryKey: ['admin-products'], refetchType: 'active' });

  if (productId) {
    queryClient.invalidateQueries({
      queryKey: ['admin-product', productId],
      refetchType: 'active',
    });
    queryClient.invalidateQueries({
      queryKey: ['products', productId],
      refetchType: 'active',
    });
  }

  invalidateUserCatalogQueries(queryClient);
}

function invalidateAdminOrderQueries(queryClient) {
  queryClient.invalidateQueries({ queryKey: ['admin-orders'], refetchType: 'active' });
  queryClient.invalidateQueries({ queryKey: ['admin-orders-summary'], refetchType: 'active' });
  queryClient.invalidateQueries({ queryKey: ['admin-oms-summary'], refetchType: 'active' });
}

export function useAdminLoginMutation() {
  return useMutation({
    mutationFn: adminLogin,
    onSuccess: (data) => {
      establishSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
    },
  });
}

export function useAdminFaceLoginMutation(options = {}) {
  return useMutation({
    mutationFn: adminFaceLogin,
    onSuccess: (data, ...args) => {
      establishSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
      options.onSuccess?.(data, ...args);
    },
  });
}

export function useAdminDashboardQuery() {
  const token = useAdminToken();

  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => fetchAdminDashboard(token),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.SHORT,
  });
}

export function useAdminAnalyticsQuery(params = {}) {
  const token = useAdminToken();

  return useQuery({
    queryKey: ['admin-analytics', params],
    queryFn: () => fetchAdminAnalytics(token, params),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.SHORT,
  });
}

export function useAdminAnalyticsUserGrowthQuery(params = {}) {
  const token = useAdminToken();

  return useQuery({
    queryKey: ['admin-analytics-user-growth', params],
    queryFn: () => fetchAdminAnalyticsUserGrowth(params, token),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.SHORT,
  });
}

export function useAdminAnalyticsDevicesQuery(params = {}) {
  const token = useAdminToken();

  return useQuery({
    queryKey: ['admin-analytics-devices', params],
    queryFn: () => fetchAdminAnalyticsDevices(params, token),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.SHORT,
  });
}

export function useAdminAnalyticsOrdersDetailQuery(params = {}) {
  const token = useAdminToken();

  return useQuery({
    queryKey: ['admin-analytics-orders-detail', params],
    queryFn: () => fetchAdminAnalyticsOrdersDetail(params, token),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.SHORT,
  });
}

export function useAdminAnalyticsCategoriesQuery(params = {}) {
  const token = useAdminToken();

  return useQuery({
    queryKey: ['admin-analytics-categories', params],
    queryFn: () => fetchAdminAnalyticsCategories(params, token),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.SHORT,
  });
}

export function useAdminOrdersAnalyticsQuery() {
  const token = useAdminToken();

  return useQuery({
    queryKey: ['admin-orders-analytics'],
    queryFn: () => fetchAdminOrdersAnalytics(token),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.SHORT,
  });
}

export function useAdminAnalyticsCustomersQuery(params = {}) {
  const token = useAdminToken();

  return useQuery({
    queryKey: ['admin-analytics-customers', params],
    queryFn: () => fetchAdminAnalyticsCustomers(params, token),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.SHORT,
  });
}

export function useAdminAnalyticsProductsQuery(params = {}) {
  const token = useAdminToken();

  return useQuery({
    queryKey: ['admin-analytics-products', params],
    queryFn: () => fetchAdminAnalyticsProducts(params, token),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.SHORT,
  });
}

export function useAdminProfileQuery() {
  const token = useAdminToken();

  return useQuery({
    queryKey: ['admin-profile'],
    queryFn: () => fetchAdminProfile(token),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.SHORT,
  });
}

export function useAdminUpdateProfileMutation() {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => updateAdminProfile(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profile'], refetchType: 'active' });
    },
  });
}

export function useAdminChangePasswordMutation() {
  const token = useAdminToken();

  return useMutation({
    mutationFn: (payload) => changeAdminPassword(payload, token),
  });
}

export function useAdminRegisterFaceMutation() {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageFile) => adminRegisterFace(imageFile, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profile'], refetchType: 'active' });
    },
  });
}

export function useAdminUsersQuery(params = {}) {
  const token = useAdminToken();

  return useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => fetchAdminUsers(params, token),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.SHORT,
  });
}

export function useAdminUpdateUserMutation() {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => updateAdminUser(id, payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'], refetchType: 'active' });
    },
  });
}

export function useAdminDeactivateUserMutation() {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deactivateAdminUser(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'], refetchType: 'active' });
    },
  });
}

export function useAdminDeleteUserMutation() {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deleteAdminUser(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'], refetchType: 'active' });
    },
  });
}

export function useAdminProductsQuery(params = {}) {
  const token = useAdminToken();

  return useQuery({
    queryKey: ['admin-products', params],
    queryFn: () => fetchAdminProducts(params, token),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.SHORT,
  });
}

export function useAdminProductDetailQuery(id) {
  const token = useAdminToken();
  const normalizedId = id != null ? String(id).trim() : '';

  return useQuery({
    queryKey: ['admin-product', normalizedId],
    queryFn: () => fetchAdminProductById(normalizedId, token),
    enabled: Boolean(token && normalizedId),
    staleTime: QUERY_STALE_TIME.SHORT,
  });
}

export function useAdminCreateCmsProductMutation() {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => createAdminCmsProduct(payload, token),
    onSuccess: () => {
      invalidateAdminProductQueries(queryClient);
    },
  });
}

export function useAdminUpdateProductMutation() {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => updateAdminProduct(id, payload, token),
    onSuccess: (_data, variables) => {
      invalidateAdminProductQueries(queryClient, variables?.id);
    },
  });
}

export function useAdminUploadProductImagesMutation() {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, files }) => uploadAdminProductImages(productId, files, token),
    onSuccess: (_data, variables) => {
      invalidateAdminProductQueries(queryClient, variables?.productId);
    },
  });
}

export function useAdminDeleteProductMutation() {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deleteAdminProduct(id, token),
    onSuccess: (_data, productId) => {
      invalidateAdminProductQueries(queryClient, productId);
    },
  });
}

export function useAdminToggleProductMutation() {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => toggleAdminProductStatus(id, token),
    onSuccess: (_data, productId) => {
      invalidateAdminProductQueries(queryClient, productId);
    },
  });
}

export function useAdminAdjustInventoryMutation() {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, payload }) => adjustAdminProductInventory(productId, payload, token),
    onSuccess: (_data, variables) => {
      invalidateAdminProductQueries(queryClient, variables?.productId);
    },
  });
}

export function useAdminValidateBulkProductsMutation() {
  const token = useAdminToken();

  return useMutation({
    mutationFn: (rows) => validateAdminBulkProducts(rows, token),
  });
}

export function useAdminImportBulkProductsMutation() {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rows) => importAdminBulkProducts(rows, token),
    onSuccess: () => {
      invalidateAdminProductQueries(queryClient);
    },
  });
}

export function useAdminOrdersSummaryQuery() {
  const token = useAdminToken();

  return useQuery({
    queryKey: ['admin-orders-summary'],
    queryFn: () => fetchAdminOrdersSummary(token),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.SHORT,
  });
}

export function useAdminOrdersQuery(params = {}) {
  const token = useAdminToken();

  return useQuery({
    queryKey: ['admin-orders', params],
    queryFn: () => fetchAdminOrders(params, token),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.SHORT,
  });
}

export function useAdminOrdersByUserQuery(params = {}) {
  const token = useAdminToken();

  return useQuery({
    queryKey: ['admin-orders-users', params],
    queryFn: () => fetchAdminOrdersByUser(params, token),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.SHORT,
  });
}

export function useAdminUpdateOrderStatusMutation() {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) => updateAdminOrderStatus(id, status, token),
    onSuccess: () => {
      invalidateAdminOrderQueries(queryClient);
    },
  });
}

export function useAdminCancelOrderMutation() {
  const token = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId) => cancelAdminOrder(orderId, token),
    onSuccess: () => {
      invalidateAdminOrderQueries(queryClient);
    },
  });
}
