import { analyzeBodyImage } from '@/features/body-analysis/services';
import { BODY_ANALYSIS_QUERY_KEY } from '@/features/body-analysis/hooks/use-body-analysis';
import { useBodyCaptureStore } from '@/stores/body-capture-store';

export async function runBodyAnalysis({
  token,
  queryClient,
  imageFile = null,
  videoFile = null,
  height = null,
} = {}) {
  if (!token) {
    return null;
  }

  const capture = useBodyCaptureStore.getState();
  const resolvedImage = imageFile ?? capture.bodyImageFile;
  const resolvedVideo = videoFile ?? capture.videoFile;

  if (!resolvedImage && !resolvedVideo) {
    return null;
  }

  try {
    const data = await analyzeBodyImage(token, {
      imageFile: resolvedImage,
      videoFile: resolvedVideo,
      height: height ?? undefined,
    });

    if (queryClient) {
      queryClient.setQueryData(BODY_ANALYSIS_QUERY_KEY, data);
      queryClient.invalidateQueries({ queryKey: BODY_ANALYSIS_QUERY_KEY });
    }

    if (resolvedImage) {
      capture.setBodyImageFile(resolvedImage);
    }

    if (resolvedVideo) {
      capture.setVideoFile(resolvedVideo);
    }

    return data;
  } catch (error) {
    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: BODY_ANALYSIS_QUERY_KEY });
    }

    throw error;
  }
}
