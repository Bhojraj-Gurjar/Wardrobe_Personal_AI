'use client';



import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_STALE_TIME } from '@/constants/app';

import {
  analyzeCurrentFace,
  analyzeFaceImage,
  fetchFaceAnalysis,
  updateFaceAnalysis,
} from '@/features/face-analysis/services';

import { getUserAccessToken, useUserAccessToken, useUserProfile, useAuthStore } from '@/stores/auth-store';



export const FACE_ANALYSIS_QUERY_KEY = ['face-analysis'];



export function useFaceAnalysisQuery() {

  const token = useUserAccessToken();



  return useQuery({

    queryKey: FACE_ANALYSIS_QUERY_KEY,

    queryFn: async () => {

      try {

        return await fetchFaceAnalysis(token);

      } catch {

        return null;

      }

    },

    enabled: Boolean(token),

    staleTime: QUERY_STALE_TIME.SHORT,

    retry: false,

    refetchInterval: (query) => {

      const data = query.state.data;



      if (data?.is_face_registered && data?.faceImageUrl && !data?.hasAnalysis) {
        return 4000;
      }



      return false;

    },

  });

}



export function useAnalyzeFaceMutation() {

  const token = useUserAccessToken();

  const queryClient = useQueryClient();



  return useMutation({

    mutationFn: (payload) => {
      const file = payload?.file || (payload instanceof File || payload instanceof Blob ? payload : null);
      const captureSource = payload?.captureSource || 'upload';

      if (file) {
        return analyzeFaceImage(file, token, { captureSource });
      }

      return analyzeCurrentFace(token);
    },

    onSuccess: (data) => {

      queryClient.setQueryData(FACE_ANALYSIS_QUERY_KEY, data);

      queryClient.invalidateQueries({ queryKey: FACE_ANALYSIS_QUERY_KEY });

      queryClient.setQueryData(['profile'], (current) => {

        if (!current) {

          return current;

        }



        return {

          ...current,

          faceImageUrl: data.faceImageUrl,

          face_image_url: data.face_image_url,

          is_face_registered: data.is_face_registered,

        };

      });

      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['fashion-dna'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['virtual-try-on'] });
      queryClient.invalidateQueries({ queryKey: ['digital-avatar'] });
    },

    onError: () => {

      queryClient.invalidateQueries({ queryKey: FACE_ANALYSIS_QUERY_KEY });

    },

  });

}



export function useAnalyzeCurrentFaceMutation() {
  const token = useUserAccessToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => analyzeCurrentFace(token),
    onSuccess: (data) => {
      queryClient.setQueryData(FACE_ANALYSIS_QUERY_KEY, data);
      queryClient.invalidateQueries({ queryKey: FACE_ANALYSIS_QUERY_KEY });
      queryClient.setQueryData(['profile'], (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          faceImageUrl: data.faceImageUrl,
          face_image_url: data.face_image_url,
          is_face_registered: data.is_face_registered,
        };
      });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['fashion-dna'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['virtual-try-on'] });
      queryClient.invalidateQueries({ queryKey: ['digital-avatar'] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: FACE_ANALYSIS_QUERY_KEY });
    },
  });
}

export function useUpdateFaceAnalysisMutation() {

  const token = useUserAccessToken();

  const queryClient = useQueryClient();



  return useMutation({

    mutationFn: (payload) => updateFaceAnalysis(payload, token),

    onSuccess: (data) => {

      queryClient.setQueryData(FACE_ANALYSIS_QUERY_KEY, data);

    },

  });

}


