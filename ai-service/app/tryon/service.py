"""Virtual try-on via Hugging Face Space zhengchong/CatVTON (Gradio Client)."""

from __future__ import annotations

import asyncio
import logging
import os
import shutil
import tempfile
import uuid
from pathlib import Path

import httpx
from gradio_client import Client, file as gradio_file
from PIL import Image

logger = logging.getLogger(__name__)

CATVTON_SPACE = "zhengchong/CatVTON"
TRYON_TIMEOUT_SECONDS = 60
OUTPUT_DIR = Path(__file__).resolve().parents[1] / "generated" / "tryon"


class TryOnServiceError(Exception):
    """Base error for virtual try-on failures."""


class TryOnTimeoutError(TryOnServiceError):
    """Raised when CatVTON inference exceeds the allowed window."""


def _resolve_hf_token() -> str | None:
    return os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACE_API_TOKEN")


def _resolve_result_path(result: object) -> str:
    if isinstance(result, str):
        return result

    if isinstance(result, dict):
        for key in ("path", "url", "name"):
            value = result.get(key)
            if isinstance(value, str) and value:
                return value

    if isinstance(result, (list, tuple)) and result:
        return _resolve_result_path(result[0])

    raise TryOnServiceError(f"Unexpected CatVTON response payload: {type(result)!r}")


def _build_person_editor_payload(person_path: Path) -> dict:
    """CatVTON expects an ImageEditor dict; uniform mask triggers auto-segmentation."""
    with Image.open(person_path) as person_image:
        width, height = person_image.size

    mask_path = person_path.with_name("person_mask.png")
    Image.new("L", (width, height), color=0).save(mask_path)

    return {
        "background": gradio_file(str(person_path)),
        "layers": [gradio_file(str(mask_path))],
    }


def _invoke_catvton(person_path: Path, garment_path: Path) -> str:
    token = _resolve_hf_token()
    client_kwargs: dict = {}

    if token:
        client_kwargs["token"] = token

    client = Client(CATVTON_SPACE, **client_kwargs)
    person_payload = _build_person_editor_payload(person_path)

    logger.info("Calling CatVTON Space for virtual try-on")

    result = client.predict(
        person_payload,
        gradio_file(str(garment_path)),
        "upper",
        50,
        2.5,
        42,
        "result only",
        api_name="/submit_function",
    )

    return _resolve_result_path(result)


async def _download_image(url: str, destination: Path, client: httpx.AsyncClient) -> None:
    response = await client.get(url, timeout=30.0, follow_redirects=True)
    response.raise_for_status()
    destination.write_bytes(response.content)


async def run_virtual_tryon(person_image_url: str, garment_image_url: str) -> str:
    """
    Download person + garment images, run CatVTON, persist output under
    app/generated/tryon/, and return the absolute file path.
    """
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    work_dir = Path(tempfile.mkdtemp(prefix="wardrobe_tryon_"))

    person_path = work_dir / "person.png"
    garment_path = work_dir / "garment.png"

    try:
        async with httpx.AsyncClient() as client:
            await asyncio.gather(
                _download_image(person_image_url, person_path, client),
                _download_image(garment_image_url, garment_path, client),
            )

        result_path = await asyncio.wait_for(
            asyncio.to_thread(_invoke_catvton, person_path, garment_path),
            timeout=TRYON_TIMEOUT_SECONDS,
        )

        output_path = OUTPUT_DIR / f"{uuid.uuid4().hex}.png"
        shutil.copy2(result_path, output_path)

        logger.info("Virtual try-on saved to %s", output_path)
        return f"/tryon/results/{output_path.name}"
    except asyncio.TimeoutError as exc:
        raise TryOnTimeoutError(
            f"Virtual try-on timed out after {TRYON_TIMEOUT_SECONDS} seconds",
        ) from exc
    except httpx.HTTPError as exc:
        raise TryOnServiceError(f"Failed to download input image: {exc}") from exc
    except TryOnServiceError:
        raise
    except Exception as exc:
        logger.exception("Virtual try-on failed")
        raise TryOnServiceError(f"Virtual try-on failed: {exc}") from exc
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)
