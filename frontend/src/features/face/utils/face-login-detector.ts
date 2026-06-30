import { FaceLoginError } from '@/features/face/types/face-login.types';
import type { FaceAnalysisResult } from '@/features/face/types/face-login.types';

const MIN_FACE_AREA_RATIO = 0.08;
const MAX_FACE_AREA_RATIO = 0.55;
const MIN_AVERAGE_LUMINANCE = 28;

type BrowserFaceDetector = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
};

/**
 * Client-side pre-checks before capture.
 * Uses the Shape Detection API when available; always checks lighting via canvas sampling.
 */
export class FaceLoginDetector {
  private detector: BrowserFaceDetector | null = null;

  private canvas: HTMLCanvasElement | null = null;

  private ctx: CanvasRenderingContext2D | null = null;

  private warmedUp = false;

  async init(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    const FaceDetectorCtor = (window as Window & {
      FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => BrowserFaceDetector;
    }).FaceDetector;

    if (FaceDetectorCtor) {
      try {
        this.detector = new FaceDetectorCtor({
          fastMode: true,
          maxDetectedFaces: 3,
        });
      } catch {
        this.detector = null;
      }
    }
  }

  destroy(): void {
    this.detector = null;
    this.canvas = null;
    this.ctx = null;
    this.warmedUp = false;
  }

  /** Prime Shape Detection / canvas sampling so the first user-facing pass is fast. */
  async warmUp(video: HTMLVideoElement, timeoutMs = 3_000): Promise<void> {
    if (this.warmedUp || video.videoWidth <= 0 || video.videoHeight <= 0) {
      return;
    }

    try {
      await this.analyze(video, timeoutMs);
    } catch {
      // Best-effort warm-up — backend liveness still validates frames.
    }

    this.warmedUp = true;
  }

  get isSupported(): boolean {
    return Boolean(this.detector);
  }

  private ensureCanvas(width: number, height: number): CanvasRenderingContext2D | null {
    if (typeof document === 'undefined') {
      return null;
    }

    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    }

    if (!this.ctx || !this.canvas) {
      return null;
    }

    this.canvas.width = width;
    this.canvas.height = height;
    return this.ctx;
  }

  private lightingFrameSkip = 0;

  /** Sample frame luminance on a downscaled canvas — works in all browsers. */
  analyzeLighting(video: HTMLVideoElement): FaceLoginError | null {
    if (video.videoWidth <= 0 || video.videoHeight <= 0) {
      return null;
    }

    this.lightingFrameSkip += 1;
    if (this.lightingFrameSkip % 2 !== 0) {
      return null;
    }

    const sampleWidth = Math.min(160, video.videoWidth);
    const sampleHeight = Math.max(1, Math.round((video.videoHeight / video.videoWidth) * sampleWidth));
    const ctx = this.ensureCanvas(sampleWidth, sampleHeight);
    if (!ctx || !this.canvas) {
      return null;
    }

    ctx.drawImage(video, 0, 0, sampleWidth, sampleHeight);
    const { data } = ctx.getImageData(0, 0, sampleWidth, sampleHeight);

    let luminanceSum = 0;
    const pixelCount = data.length / 4;

    for (let index = 0; index < data.length; index += 4) {
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      luminanceSum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    const average = luminanceSum / pixelCount;
    return average < MIN_AVERAGE_LUMINANCE ? FaceLoginError.POOR_LIGHTING : null;
  }

  async analyze(video: HTMLVideoElement, timeoutMs = 8_000): Promise<FaceAnalysisResult> {
    try {
      return await Promise.race([
        this.analyzeFrame(video),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('face_analyze_timeout')), timeoutMs);
        }),
      ]);
    } catch (error) {
      if (String((error as Error)?.message || '').includes('face_analyze_timeout')) {
        // Slow Shape Detection API — defer geometry checks to the backend liveness pipeline.
        return { issue: null, ready: true, faceCount: 1 };
      }

      return { issue: FaceLoginError.FACE_NOT_DETECTED, ready: false, faceCount: 0 };
    }
  }

  private async analyzeFrame(video: HTMLVideoElement): Promise<FaceAnalysisResult> {
    const lightingIssue = this.analyzeLighting(video);
    if (lightingIssue) {
      return { issue: lightingIssue, ready: false, faceCount: 0 };
    }

    if (!this.detector || video.videoWidth <= 0 || video.videoHeight <= 0) {
      // Without Shape Detection API we defer geometry checks to the backend.
      return { issue: null, ready: true, faceCount: 1 };
    }

    try {
      const faces = await this.detector.detect(video);
      const faceCount = faces.length;

      if (faceCount === 0) {
        return { issue: FaceLoginError.FACE_NOT_DETECTED, ready: false, faceCount: 0 };
      }

      if (faceCount > 1) {
        return { issue: FaceLoginError.MULTIPLE_FACES, ready: false, faceCount };
      }

      const box = faces[0].boundingBox;
      const faceArea = box.width * box.height;
      const frameArea = video.videoWidth * video.videoHeight;
      const ratio = faceArea / frameArea;

      if (ratio < MIN_FACE_AREA_RATIO) {
        return { issue: FaceLoginError.FACE_TOO_FAR, ready: false, faceCount: 1 };
      }

      if (ratio > MAX_FACE_AREA_RATIO) {
        return { issue: FaceLoginError.FACE_TOO_CLOSE, ready: false, faceCount: 1 };
      }

      return { issue: null, ready: true, faceCount: 1 };
    } catch {
      return { issue: null, ready: true, faceCount: 1 };
    }
  }
}

export function mapCameraStartError(err: unknown): FaceLoginError {
  const error = err as DOMException & { message?: string };
  const name = String(error?.name || '');
  const message = String(error?.message || '').toLowerCase();

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || message.includes('permission')) {
    return FaceLoginError.CAMERA_PERMISSION_DENIED;
  }

  if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || message.includes('not found')) {
    return FaceLoginError.CAMERA_NOT_FOUND;
  }

  return FaceLoginError.CAMERA_UNAVAILABLE;
}
