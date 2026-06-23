"""Direct FastAPI face auth smoke test."""

from __future__ import annotations

import json
import uuid
from pathlib import Path
from urllib import request

BOUNDARY = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
IMAGE_PATH = Path(__file__).resolve().parent.parent / "test_face.jpg"
BASE_URL = "http://localhost:8000"


def multipart_body(fields: dict[str, str], files: dict[str, tuple[str, bytes, str]]) -> bytes:
    parts: list[bytes] = []

    for name, value in fields.items():
        parts.append(
            f"--{BOUNDARY}\r\n"
            f'Content-Disposition: form-data; name="{name}"\r\n\r\n'
            f"{value}\r\n".encode()
        )

    for name, (filename, content, mime) in files.items():
        parts.append(
            f"--{BOUNDARY}\r\n"
            f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'
            f"Content-Type: {mime}\r\n\r\n".encode()
        )
        parts.append(content)
        parts.append(b"\r\n")

    parts.append(f"--{BOUNDARY}--\r\n".encode())
    return b"".join(parts)


def post(path: str, fields: dict[str, str] | None = None, files: dict | None = None) -> tuple[int, str]:
    body = multipart_body(fields or {}, files or {})
    req = request.Request(f"{BASE_URL}{path}", data=body, method="POST")
    req.add_header("Content-Type", f"multipart/form-data; boundary={BOUNDARY}")
    try:
        with request.urlopen(req, timeout=120) as resp:
            return resp.status, resp.read().decode()
    except request.HTTPError as exc:
        return exc.code, exc.read().decode()


def main() -> None:
    image_bytes = IMAGE_PATH.read_bytes()
    user_id = str(uuid.uuid4())

    status, body = post(
        "/face/register",
        {"user_id": user_id},
        {"image": ("test.jpg", image_bytes, "image/jpeg")},
    )
    print("REGISTER", status, body)

    status, body = post(
        "/face/login",
        files={"image": ("test.jpg", image_bytes, "image/jpeg")},
    )
    print("LOGIN", status, body)


if __name__ == "__main__":
    main()
