"""Virtual try-on via Hugging Face Space zhengchong/CatVTON (Gradio Client)."""

from __future__ import annotations

import asyncio
import logging
import os
import shutil
import tempfile
import time
import uuid
from pathlib import Path

import httpx
from gradio_client import Client, file as gradio_file
from PIL import Image

logger = logging.getLogger(__name__)

CATVTON_SPACE = os.getenv("CATVTON_SPACE", "zhengchong/CatVTON")
TRYON_TIMEOUT_SECONDS = int(os.getenv("TRYON_TIMEOUT_SECONDS", "120"))
TRYON_MAX_RETRIES = int(os.getenv("TRYON_MAX_RETRIES", "3"))
TRYON_RETRY_DELAYS_SECONDS = [2, 4, 8]
OUTPUT_DIR = Path(__file__).resolve().parents[1] / "generated" / "tryon"


def _fallback_enabled() -> bool:
    token = _resolve_hf_token()
    configured = os.getenv("TRYON_FALLBACK_ON_QUOTA_EXCEEDED", "").lower()

    if configured in {"0", "false", "no"}:
        return False

    if configured in {"1", "true", "yes"}:
        return True

    # Never silently return overlay results when a HuggingFace token is configured.
    return not bool(token)


class TryOnServiceError(Exception):
    """Base error for virtual try-on failures."""


class TryOnTimeoutError(TryOnServiceError):
    """Raised when CatVTON inference exceeds the allowed window."""


def _resolve_hf_token() -> str | None:
    return (
        os.getenv("HF_TOKEN")
        or os.getenv("HUGGINGFACE_API_TOKEN")
        or os.getenv("HUGGING_FACE_HUB_TOKEN")
        or None
    )


def _configure_hf_auth(token: str | None) -> None:
    if not token:
        return

    os.environ["HF_TOKEN"] = token
    os.environ["HUGGINGFACE_HUB_TOKEN"] = token
    os.environ["HUGGING_FACE_HUB_TOKEN"] = token

    try:
        from huggingface_hub import login

        login(token=token, add_to_git_credential=False)
    except Exception as exc:
        logger.warning("Hugging Face hub login skipped: %s", exc)


def log_tryon_startup_config() -> None:
    token = _resolve_hf_token()

    if not token:
        logger.error(
            "HF_TOKEN is not configured. Virtual try-on requires a Hugging Face token.",
        )
        return

    logger.info(
        "Virtual try-on configured | space=%s | token=present | fallback=%s",
        CATVTON_SPACE,
        _fallback_enabled(),
    )


def _is_model_loading_error(exc: Exception) -> bool:
    message = str(exc).lower()
    return any(
        marker in message
        for marker in (
            "503",
            "model is currently loading",
            "currently loading",
            "loading",
            "model loading",
        )
    )
def _is_quota_error(exc: Exception) -> bool:
    message = str(exc).lower()
    return any(
        marker in message
        for marker in (
            "zerogpu quota",
            "zero gpu quota",
            "exceeded your free zerogpu",
            "exceeded your pro gpu",
            "unlogged user is runnning out of daily zerogpu",
            "rate limit",
        )
    )


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


def _validate_downloaded_image(path: Path, label: str) -> None:
    if not path.exists() or path.stat().st_size < 1024:
        raise TryOnServiceError(f"{label} image is missing or too small.")

    try:
        with Image.open(path) as image:
            image.verify()

        with Image.open(path) as image:
            width, height = image.size
            if width < 128 or height < 128:
                raise TryOnServiceError(f"{label} image resolution is too small.")
    except TryOnServiceError:
        raise
    except Exception as exc:
        raise TryOnServiceError(f"Invalid {label.lower()} image.") from exc


def _invoke_catvton_with_retry(person_path: Path, garment_path: Path) -> str:
    last_error: Exception | None = None

    for attempt in range(TRYON_MAX_RETRIES):
        try:
            return _invoke_catvton(person_path, garment_path)
        except Exception as exc:
            last_error = exc

            if not _is_model_loading_error(exc) or attempt >= TRYON_MAX_RETRIES - 1:
                raise

            delay = TRYON_RETRY_DELAYS_SECONDS[min(attempt, len(TRYON_RETRY_DELAYS_SECONDS) - 1)]
            logger.warning(
                "HuggingFace model loading (attempt %s/%s), retrying in %ss: %s",
                attempt + 1,
                TRYON_MAX_RETRIES,
                delay,
                exc,
            )
            time.sleep(delay)

    if last_error:
        raise last_error

    raise TryOnServiceError("Virtual try-on failed.")


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


def _local_tryon_fallback(person_path: Path, garment_path: Path, output_path: Path) -> None:
    """Lightweight overlay fallback when CatVTON / ZeroGPU is unavailable."""
    with Image.open(person_path).convert("RGBA") as person, Image.open(
        garment_path,
    ).convert("RGBA") as garment:
        person_width, person_height = person.size
        target_width = max(1, int(person_width * 0.58))
        target_height = max(1, int(person_height * 0.42))
        garment = garment.copy()
        garment.thumbnail((target_width, target_height), Image.Resampling.LANCZOS)

        x = (person_width - garment.width) // 2
        y = int(person_height * 0.2)
        composed = person.copy()
        composed.paste(garment, (x, y), garment)
        composed.convert("RGB").save(output_path, format="PNG")


def _invoke_catvton(person_path: Path, garment_path: Path) -> str:
    token = _resolve_hf_token()

    if not token:
        raise TryOnServiceError("HuggingFace token missing.")

    _configure_hf_auth(token)

    client_kwargs: dict = {
        "verbose": False,
    }

    if token:
        client_kwargs["token"] = token
        client_kwargs["httpx_kwargs"] = {
            "headers": {
                "Authorization": f"Bearer {token}",
            },
        }

    client = Client(CATVTON_SPACE, **client_kwargs)
    person_payload = _build_person_editor_payload(person_path)

    logger.info("Calling CatVTON Space for virtual try-on (space=%s)", CATVTON_SPACE)

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
        if not person_image_url:
            raise TryOnServiceError("Person image missing.")
        if not garment_image_url:
            raise TryOnServiceError("Invalid garment image.")

        logger.info("Downloading person and garment images for virtual try-on")

        async with httpx.AsyncClient() as client:
            await asyncio.gather(
                _download_image(person_image_url, person_path, client),
                _download_image(garment_image_url, garment_path, client),
            )

        await asyncio.to_thread(_validate_downloaded_image, person_path, "Person")
        await asyncio.to_thread(_validate_downloaded_image, garment_path, "Garment")

        try:
            result_path = await asyncio.wait_for(
                asyncio.to_thread(_invoke_catvton_with_retry, person_path, garment_path),
                timeout=TRYON_TIMEOUT_SECONDS,
            )
        except Exception as exc:
            if _fallback_enabled() and _is_quota_error(exc):
                logger.warning(
                    "CatVTON ZeroGPU quota unavailable; using local overlay fallback: %s",
                    exc,
                )
                output_path = OUTPUT_DIR / f"{uuid.uuid4().hex}.png"
                await asyncio.to_thread(
                    _local_tryon_fallback,
                    person_path,
                    garment_path,
                    output_path,
                )
                return f"/tryon/results/{output_path.name}"

            if isinstance(exc, asyncio.TimeoutError):
                raise TryOnTimeoutError(
                    f"Virtual try-on timed out after {TRYON_TIMEOUT_SECONDS} seconds",
                ) from exc

            if isinstance(exc, TryOnServiceError):
                raise

            raise TryOnServiceError(f"Virtual try-on failed: {exc}") from exc

        logger.info("Rendering result...")
        output_path = OUTPUT_DIR / f"{uuid.uuid4().hex}.png"
        shutil.copy2(result_path, output_path)

        logger.info("Generation successful | saved=%s", output_path)
        return f"/tryon/results/{output_path.name}"
    except asyncio.TimeoutError as exc:
        raise TryOnTimeoutError(
            f"Virtual try-on timed out after {TRYON_TIMEOUT_SECONDS} seconds",
        ) from exc
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 503:
            raise TryOnServiceError("Model loading. Please retry shortly.") from exc
        raise TryOnServiceError(f"Failed to download input image: {exc}") from exc
    except httpx.HTTPError as exc:
        raise TryOnServiceError(f"Failed to download input image: {exc}") from exc
    except TryOnServiceError:
        raise
    except Exception as exc:
        logger.exception("Virtual try-on failed")
        raise TryOnServiceError(f"Virtual try-on failed: {exc}") from exc
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)
