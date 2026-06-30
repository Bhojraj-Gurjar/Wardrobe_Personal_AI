"""End-to-end face auth test via NestJS API."""

from __future__ import annotations

import json
import sys
import uuid
from pathlib import Path
from urllib import request

BOUNDARY = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
IMAGE_CANDIDATES = [
    Path(__file__).resolve().parent.parent / "test_face_extra.jpg",
    Path(__file__).resolve().parent.parent / "test_face_biden.jpg",
    Path(__file__).resolve().parent.parent / "test_face.jpg",
]
BASE_URL = "http://localhost:3000/api/v1"
AI_BASE_URL = "http://localhost:8000"


def pick_image() -> Path:
    for candidate in IMAGE_CANDIDATES:
        if candidate.exists():
            return candidate
    raise FileNotFoundError("No test face image found")


IMAGE_PATH = pick_image()


def json_request(method: str, path: str, body: dict | None = None, token: str | None = None) -> tuple[int, dict]:
    data = json.dumps(body).encode() if body is not None else None
    req = request.Request(f"{BASE_URL}{path}", data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with request.urlopen(req, timeout=60) as resp:
            return resp.status, json.loads(resp.read().decode())
    except request.HTTPError as exc:
        raw = exc.read().decode()
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            payload = {"raw": raw}
        return exc.code, payload


def multipart_face(path: str, field_name: str = "frontFace", token: str | None = None) -> tuple[int, dict]:
    image_bytes = IMAGE_PATH.read_bytes()
    parts = [
        (
            f"--{BOUNDARY}\r\n"
            f'Content-Disposition: form-data; name="{field_name}"; filename="test.jpg"\r\n'
            f"Content-Type: image/jpeg\r\n\r\n"
        ).encode(),
        image_bytes,
        b"\r\n",
        f"--{BOUNDARY}--\r\n".encode(),
    ]
    body = b"".join(parts)
    req = request.Request(f"{BASE_URL}{path}", data=body, method="POST")
    req.add_header("Content-Type", f"multipart/form-data; boundary={BOUNDARY}")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with request.urlopen(req, timeout=120) as resp:
            return resp.status, json.loads(resp.read().decode())
    except request.HTTPError as exc:
        raw = exc.read().decode()
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            payload = {"raw": raw}
        return exc.code, payload


def reset_face_vectors() -> None:
    req = request.Request(f"{AI_BASE_URL}/face/debug/reset", method="DELETE")
    try:
        with request.urlopen(req, timeout=30) as resp:
            payload = json.loads(resp.read().decode())
            print("FACE RESET", resp.status, payload.get("message"))
    except request.HTTPError as exc:
        raw = exc.read().decode()
        print("FACE RESET SKIPPED", exc.code, raw)


def main() -> None:
    reset_face_vectors()

    email = f"face_e2e_{uuid.uuid4().hex[:8]}@example.com"
    mobile = f"+9198{uuid.uuid4().int % 10**8:08d}"

    status, auth = json_request(
        "POST",
        "/auth/register",
        {"email": email, "password": "SecurePass123!", "mobile": mobile},
    )
    print("AUTH REGISTER", status, auth.get("data", {}).get("user", {}).get("email"))
    token = auth.get("data", {}).get("accessToken")
    if not token:
        sys.exit(1)

    for image_path in IMAGE_CANDIDATES:
        if not image_path.exists():
            continue

        global IMAGE_PATH
        IMAGE_PATH = image_path
        status, face_reg = multipart_face("/face/register", token=token)
        print("NEST FACE REGISTER", image_path.name, status, face_reg.get("message") or face_reg)
        if status not in (200, 201):
            continue

        status, face_login = multipart_face("/face/login")
        print("NEST FACE LOGIN", image_path.name, status, face_login.get("data", {}).get("user", {}).get("email") if face_login.get("success") else face_login)
        if status != 200 or not face_login.get("success"):
            continue

        status, face_verify = multipart_face("/face/verify", token=token)
        print("NEST FACE VERIFY", image_path.name, status, face_verify.get("data") if face_verify.get("success") else face_verify)
        if status == 200 and face_verify.get("success") and face_verify.get("data", {}).get("verified"):
            print("E2E PASS")
            return

    print("E2E FAIL — no unused test face image available")
    sys.exit(1)


if __name__ == "__main__":
    main()
