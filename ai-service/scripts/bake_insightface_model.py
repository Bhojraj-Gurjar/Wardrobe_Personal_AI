#!/usr/bin/env python3
"""Pre-download InsightFace models into the Docker image at build time."""

from __future__ import annotations

import os
import sys
import time


def main() -> int:
    root = os.environ.get("INSIGHTFACE_HOME", "/app/models/insightface")
    model_name = os.environ.get("INSIGHTFACE_MODEL", "buffalo_sc")
    max_attempts = int(os.environ.get("INSIGHTFACE_BAKE_ATTEMPTS", "3"))
    retry_delay_sec = int(os.environ.get("INSIGHTFACE_BAKE_RETRY_SEC", "10"))

    from insightface.app import FaceAnalysis

    providers = ["CPUExecutionProvider"]
    model_dir = os.path.join(root, "models", model_name)

    for attempt in range(1, max_attempts + 1):
        try:
            print(
                f"[bake_insightface] attempt={attempt}/{max_attempts} "
                f"model={model_name} root={root}",
                flush=True,
            )
            app = FaceAnalysis(name=model_name, root=root, providers=providers)
            app.prepare(ctx_id=-1, det_size=(640, 640))

            if not os.path.isdir(model_dir):
                raise RuntimeError(f"model directory missing after prepare: {model_dir}")

            onnx_files = [name for name in os.listdir(model_dir) if name.endswith(".onnx")]
            if not onnx_files:
                raise RuntimeError(f"no ONNX files found in {model_dir}")

            print(
                f"[bake_insightface] OK | dir={model_dir} onnx_files={len(onnx_files)}",
                flush=True,
            )
            return 0
        except Exception as exc:  # noqa: BLE001
            print(f"[bake_insightface] failed: {exc}", flush=True)
            if attempt >= max_attempts:
                raise
            time.sleep(retry_delay_sec * attempt)

    return 1


if __name__ == "__main__":
    sys.exit(main())
