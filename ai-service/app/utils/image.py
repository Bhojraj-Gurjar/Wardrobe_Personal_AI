import base64
import io
import re

import numpy as np
from PIL import Image
from fastapi import UploadFile


DATA_URL_PATTERN = re.compile(r"^data:image/[\w+.-]+;base64,")
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


def decode_image_base64(image_data: str) -> Image.Image:
    payload = image_data.strip()
    if DATA_URL_PATTERN.match(payload):
        payload = payload.split(",", 1)[1]

    raw = base64.b64decode(payload)
    return decode_image_bytes(raw)


def decode_image_bytes(raw: bytes) -> Image.Image:
    if len(raw) > MAX_UPLOAD_BYTES:
        raise ValueError(
            f"Image exceeds maximum upload size of {MAX_UPLOAD_BYTES // (1024 * 1024)}MB"
        )

    image = Image.open(io.BytesIO(raw)).convert("RGB")
    return image


async def decode_upload_file(upload: UploadFile) -> Image.Image:
    raw = await upload.read()
    if not raw:
        raise ValueError("Uploaded image is empty")

    return decode_image_bytes(raw)


def image_to_numpy(image: Image.Image) -> np.ndarray:
    return np.array(image)
