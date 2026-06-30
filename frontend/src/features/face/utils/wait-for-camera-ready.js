/**
 * Poll until the camera preview is actually producing frames.
 * Avoids fixed warm-up delays that race with React remounts or slow devices.
 */
export async function waitForCameraReady(
  videoRef,
  {
    timeoutMs = 15_000,
    pollMs = 100,
    isCancelled = () => false,
  } = {},
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (isCancelled()) {
      return false;
    }

    const video = videoRef?.current;

    if (
      video
      && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
      && video.videoWidth > 0
      && video.videoHeight > 0
      && !video.paused
      && !video.ended
    ) {
      return true;
    }

     
    await new Promise((resolve) => {
      setTimeout(resolve, pollMs);
    });
  }

  return false;
}
