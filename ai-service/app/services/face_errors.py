"""Shared face validation errors."""

from __future__ import annotations


class FaceValidationError(ValueError):
    def __init__(self, message: str, code: str = "validation_failed") -> None:
        super().__init__(message)
        self.code = code
