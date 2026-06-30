"""Structured diagnostic log events for InsightFace face auth."""

from __future__ import annotations

import logging
import time
from contextlib import contextmanager
from dataclasses import dataclass, field

logger = logging.getLogger("wardrobe.face.diagnostics")

FACE_REGISTER_SUCCESS = "FACE_REGISTER_SUCCESS"
DUPLICATE_FACE_BLOCKED = "DUPLICATE_FACE_BLOCKED"
FACE_LOGIN_SUCCESS = "FACE_LOGIN_SUCCESS"
FACE_LOGIN_FAILED = "FACE_LOGIN_FAILED"
FACE_VERIFY_SUCCESS = "FACE_VERIFY_SUCCESS"
FACE_VERIFY_FAILED = "FACE_VERIFY_FAILED"
FACE_LOGOUT_VERIFY_SUCCESS = "FACE_LOGOUT_VERIFY_SUCCESS"
FACE_LOGOUT_VERIFY_FAILED = "FACE_LOGOUT_VERIFY_FAILED"


@dataclass
class TimingRecord:
    label: str
    elapsed_ms: float
    metadata: dict = field(default_factory=dict)


class FaceDiagnostics:
    def __init__(self) -> None:
        self.timings: list[TimingRecord] = []

    def log_event(self, event: str, **metadata) -> None:
        payload = " ".join(f"{key}={value}" for key, value in metadata.items())
        logger.info("%s %s", event, payload.strip())

    @contextmanager
    def measure(self, label: str, **metadata):
        started = time.perf_counter()
        try:
            yield
        finally:
            elapsed_ms = (time.perf_counter() - started) * 1000
            record = TimingRecord(label=label, elapsed_ms=elapsed_ms, metadata=metadata)
            self.timings.append(record)
            logger.info(
                "FACE_PERF | label=%s | elapsed_ms=%.2f %s",
                label,
                elapsed_ms,
                " ".join(f"{key}={value}" for key, value in metadata.items()),
            )

    def summary(self) -> list[dict]:
        return [
            {
                "label": record.label,
                "elapsed_ms": round(record.elapsed_ms, 2),
                **record.metadata,
            }
            for record in self.timings
        ]


face_diagnostics = FaceDiagnostics()


def resolve_buffalo_model_label(model_name: str | None) -> str:
    if not model_name:
        return "unknown"
    normalized = model_name.lower()
    if "buffalo" in normalized:
        return "buffalo"
    return model_name
