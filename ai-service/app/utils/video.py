"""OpenCV frame sampling for 360-degree walkaround body analysis."""

import logging
import os
import tempfile
from dataclasses import dataclass

import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

MAX_VIDEO_BYTES = 100 * 1024 * 1024
WALKAROUND_MAX_FRAMES = 36
WALKAROUND_MIN_FRAMES = 8
LEGACY_MAX_FRAMES = 12


class VideoValidationError(ValueError):
    def __init__(self, message: str, code: str = "invalid_video"):
        super().__init__(message)
        self.code = code


@dataclass
class WalkaroundFrame:
    image: Image.Image
    frame_index: int
    timestamp_ms: float
    sample_ratio: float


def _suffix_for_mime(mime_type: str | None) -> str:
    mapping = {
        "video/mp4": ".mp4",
        "video/webm": ".webm",
        "video/quicktime": ".mov",
        "video/x-msvideo": ".avi",
    }
    return mapping.get((mime_type or "").lower(), ".mp4")


def _compute_sample_indices(total_frames: int, max_frames: int) -> list[int]:
    if total_frames <= 0:
        return list(range(max_frames))

    target = min(max_frames, max(WALKAROUND_MIN_FRAMES, total_frames))
    if total_frames <= target:
        return list(range(total_frames))

    indices = np.linspace(0, total_frames - 1, num=target, dtype=int)
    return sorted(set(int(index) for index in indices))


def extract_walkaround_frames(
    video_bytes: bytes,
    mime_type: str | None = None,
    max_frames: int = WALKAROUND_MAX_FRAMES,
) -> list[WalkaroundFrame]:
    """Uniformly sample frames across a 360 walkaround video using OpenCV."""
    if not video_bytes:
        raise VideoValidationError("Video upload is empty.", code="empty_video")

    if len(video_bytes) > MAX_VIDEO_BYTES:
        raise VideoValidationError(
            f"Video exceeds maximum upload size of {MAX_VIDEO_BYTES // (1024 * 1024)}MB.",
            code="video_too_large",
        )

    suffix = _suffix_for_mime(mime_type)
    frames: list[WalkaroundFrame] = []

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(video_bytes)
        tmp_path = tmp.name

    try:
        capture = cv2.VideoCapture(tmp_path)

        if not capture.isOpened():
            raise VideoValidationError(
                "Unable to read walkaround video. Use MP4, WebM, or MOV.",
                code="invalid_video",
            )

        total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        fps = float(capture.get(cv2.CAP_PROP_FPS) or 0)

        if total_frames <= 0:
            index = 0
            step = 4
            while len(frames) < max_frames:
                success, frame = capture.read()
                if not success or frame is None:
                    break
                if index % step == 0:
                    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    frames.append(
                        WalkaroundFrame(
                            image=Image.fromarray(rgb),
                            frame_index=index,
                            timestamp_ms=round(index * 33.3, 1),
                            sample_ratio=round(len(frames) / max(max_frames - 1, 1), 4),
                        )
                    )
                index += 1
        else:
            sample_indices = _compute_sample_indices(total_frames, max_frames)

            for sample_ratio, frame_index in enumerate(sample_indices):
                capture.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
                success, frame = capture.read()
                if not success or frame is None:
                    continue

                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                timestamp_ms = (frame_index / fps * 1000.0) if fps > 0 else float(frame_index)

                frames.append(
                    WalkaroundFrame(
                        image=Image.fromarray(rgb),
                        frame_index=frame_index,
                        timestamp_ms=round(timestamp_ms, 1),
                        sample_ratio=round(sample_ratio / max(len(sample_indices) - 1, 1), 4),
                    )
                )

        capture.release()
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            logger.warning("Failed to remove temporary video file: %s", tmp_path)

    if not frames:
        raise VideoValidationError(
            "No frames could be extracted from the walkaround video.",
            code="no_video_frames",
        )

    logger.info(
        "Walkaround sampling extracted %s frame(s) from %s total frames",
        len(frames),
        total_frames,
    )
    return frames


def extract_video_frames(
    video_bytes: bytes,
    mime_type: str | None = None,
    max_frames: int = LEGACY_MAX_FRAMES,
) -> list[Image.Image]:
    """Backward-compatible helper returning PIL images only."""
    return [
        frame.image
        for frame in extract_walkaround_frames(video_bytes, mime_type, max_frames=max_frames)
    ]
