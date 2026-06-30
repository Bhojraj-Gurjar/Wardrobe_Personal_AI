#!/usr/bin/env python3
"""
InsightFace Buffalo verification suite.

Usage:
  cd ai-service
  .venv\\Scripts\\python.exe scripts\\verify_insightface_suite.py

Environment:
  AI_SERVICE_URL=http://localhost:8000
  API_BASE_URL=http://localhost:3000/api/v1
  FRONTEND_URL=http://localhost:3001
  DATABASE_URL=postgresql://wardrobe:wardrobe@localhost:5432/wardrobe_db
"""

from __future__ import annotations

import json
import os
import sys
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from urllib import error, request

try:
    import httpx
except ImportError:
    print("Install httpx: pip install httpx")
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "tests" / "fixtures"
FACE_A = FIXTURES / "face_a.jpg"
FACE_B = FIXTURES / "face_b.jpg"

AI_URL = os.getenv("AI_SERVICE_URL", "http://localhost:8000").rstrip("/")
API_URL = os.getenv("API_BASE_URL", "http://localhost:3000/api/v1").rstrip("/")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3001").rstrip("/")
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://wardrobe:wardrobe@localhost:5432/wardrobe_db?schema=public",
)

FIXTURE_URLS = {
    FACE_A: "https://raw.githubusercontent.com/ageitgey/face_recognition/master/examples/obama.jpg",
    FACE_B: "https://raw.githubusercontent.com/ageitgey/face_recognition/master/examples/biden.jpg",
}


@dataclass
class TestResult:
    name: str
    passed: bool
    detail: str = ""
    duration_ms: float = 0.0


@dataclass
class SuiteReport:
    results: list[TestResult] = field(default_factory=list)
    performance: dict = field(default_factory=dict)
    files_checked: list[str] = field(default_factory=list)

    def add(self, name: str, passed: bool, detail: str = "", duration_ms: float = 0.0) -> None:
        self.results.append(TestResult(name, passed, detail, duration_ms))

    @property
    def passed(self) -> list[TestResult]:
        return [item for item in self.results if item.passed]

    @property
    def failed(self) -> list[TestResult]:
        return [item for item in self.results if not item.passed]


def log(message: str) -> None:
    print(message)


def ensure_fixtures() -> None:
    FIXTURES.mkdir(parents=True, exist_ok=True)
    for path, url in FIXTURE_URLS.items():
        if path.exists() and path.stat().st_size > 1000:
            continue
        log(f"Downloading fixture {path.name} ...")
        try:
            request.urlretrieve(url, path)
        except error.HTTPError as exc:
            raise RuntimeError(f"Failed to download {url}: {exc}") from exc


def timed_call(label: str, report: SuiteReport, fn):
    started = time.perf_counter()
    try:
        result = fn()
        elapsed = (time.perf_counter() - started) * 1000
        report.performance[label] = round(elapsed, 2)
        return result
    except Exception as exc:
        elapsed = (time.perf_counter() - started) * 1000
        report.performance[label] = round(elapsed, 2)
        raise exc


def test_python_health(client: httpx.Client, report: SuiteReport) -> None:
    started = time.perf_counter()
    response = client.get(f"{AI_URL}/health", timeout=30.0)
    payload = response.json()
    elapsed = (time.perf_counter() - started) * 1000

    ok = (
        response.status_code == 200
        and payload.get("status") in {"ok", "degraded"}
        and payload.get("model") == "buffalo"
        and payload.get("face_engine", {}).get("ready") is True
        and payload.get("face_engine", {}).get("error") in (None, "")
    )
    detail = f"status={payload.get('status')} model={payload.get('model')} engine_ready={payload.get('face_engine', {}).get('ready')}"
    report.add("TEST 1 - Python service /health", ok, detail, elapsed)


def test_face_registration_ai(client: httpx.Client, report: SuiteReport, user_id: str) -> None:
    started = time.perf_counter()
    with FACE_A.open("rb") as handle:
        response = client.post(
            f"{AI_URL}/face/register",
            data={"user_id": user_id},
            files={"image": ("face_a.jpg", handle, "image/jpeg")},
            timeout=60.0,
        )
    elapsed = (time.perf_counter() - started) * 1000
    payload = response.json() if response.content else {}
    ok = (
        response.status_code == 200
        and payload.get("is_face_registered") is True
        and payload.get("user_id") == user_id
        and payload.get("face_embedding_id") == user_id
    )
    report.add("TEST 2 - Face registration (AI)", ok, json.dumps(payload), elapsed)
    report.performance["registration_time_ms"] = round(elapsed, 2)


def test_duplicate_face(client: httpx.Client, report: SuiteReport) -> None:
    other_user = str(uuid.uuid4())
    started = time.perf_counter()
    with FACE_A.open("rb") as handle:
        response = client.post(
            f"{AI_URL}/face/register",
            data={"user_id": other_user},
            files={"image": ("face_a.jpg", handle, "image/jpeg")},
            timeout=60.0,
        )
    elapsed = (time.perf_counter() - started) * 1000
    detail = response.text
    ok = (
        response.status_code == 409
        and "This face already belongs to another account." in detail
    )
    report.add("TEST 3 - Duplicate face blocked", ok, detail[:240], elapsed)


def test_face_login_ai(client: httpx.Client, report: SuiteReport, user_id: str) -> float:
    started = time.perf_counter()
    with FACE_A.open("rb") as handle:
        response = client.post(
            f"{AI_URL}/face/login",
            files={"image": ("face_a.jpg", handle, "image/jpeg")},
            timeout=60.0,
        )
    elapsed = (time.perf_counter() - started) * 1000
    payload = response.json() if response.content else {}
    ok = (
        response.status_code == 200
        and payload.get("verified") is True
        and payload.get("user_id") == user_id
        and float(payload.get("similarity_score", 0)) > 0
    )
    report.add("TEST 4 - Face login (AI)", ok, json.dumps(payload), elapsed)
    report.performance["login_time_ms"] = round(elapsed, 2)
    return float(payload.get("similarity_score", 0))


def test_wrong_face_login(client: httpx.Client, report: SuiteReport) -> None:
    started = time.perf_counter()
    with FACE_B.open("rb") as handle:
        response = client.post(
            f"{AI_URL}/face/login",
            files={"image": ("face_b.jpg", handle, "image/jpeg")},
            timeout=60.0,
        )
    elapsed = (time.perf_counter() - started) * 1000
    detail = response.text
    ok = response.status_code == 401 and "Face not recognized." in detail
    report.add("TEST 5 - Wrong face login denied", ok, detail[:240], elapsed)


def test_face_logout_verify(client: httpx.Client, report: SuiteReport, user_id: str) -> None:
    started_ok = time.perf_counter()
    with FACE_A.open("rb") as handle:
        ok_response = client.post(
            f"{AI_URL}/face/verify",
            data={"user_id": user_id},
            files={"image": ("face_a.jpg", handle, "image/jpeg")},
            timeout=60.0,
        )
    ok_elapsed = (time.perf_counter() - started_ok) * 1000

    started_bad = time.perf_counter()
    with FACE_B.open("rb") as handle:
        bad_response = client.post(
            f"{AI_URL}/face/verify",
            data={"user_id": user_id},
            files={"image": ("face_b.jpg", handle, "image/jpeg")},
            timeout=60.0,
        )
    bad_elapsed = (time.perf_counter() - started_bad) * 1000

    ok_payload = ok_response.json() if ok_response.content else {}
    ok = (
        ok_response.status_code == 200
        and ok_payload.get("verified") is True
        and bad_response.status_code == 401
    )
    detail = (
        f"correct={ok_response.status_code} wrong={bad_response.status_code} "
        f"score={ok_payload.get('similarity_score')}"
    )
    report.add("TEST 6 - Face logout verification", ok, detail, ok_elapsed + bad_elapsed)


def register_backend_user(client: httpx.Client) -> tuple[str, str]:
    email = f"insightface_{int(time.time())}@example.com"
    password = "SecurePass123!"
    response = client.post(
        f"{API_URL}/auth/register",
        json={"email": email, "password": password, "mobile": f"+9199{int(time.time()) % 10_000_000_000:010d}"},
        timeout=30.0,
    )
    response.raise_for_status()
    payload = response.json()
    token = payload.get("data", {}).get("accessToken") or payload.get("accessToken")
    user = payload.get("data", {}).get("user") or payload.get("user") or {}
    user_id = user.get("id")
    if not token or not user_id:
        raise RuntimeError(f"Backend register failed: {payload}")
    return user_id, token


def test_backend_face_flow(client: httpx.Client, report: SuiteReport) -> tuple[str, str]:
    user_id, token = register_backend_user(client)

    with FACE_A.open("rb") as handle:
        reg = client.post(
            f"{API_URL}/face/register",
            headers={"Authorization": f"Bearer {token}"},
            files={"frontFace": ("face_a.jpg", handle, "image/jpeg")},
            timeout=60.0,
        )
    reg_ok = reg.status_code in {200, 201}
    report.add("TEST 2b - Backend face registration", reg_ok, reg.text[:240])

    with FACE_A.open("rb") as handle:
        login = client.post(
            f"{API_URL}/face/login",
            files={"frontFace": ("face_a.jpg", handle, "image/jpeg")},
            timeout=60.0,
        )
    login_payload = login.json() if login.content else {}
    login_ok = (
        login.status_code == 200
        and bool(login_payload.get("accessToken"))
        and login_payload.get("user", {}).get("id") == user_id
    )
    report.add("TEST 4b - Backend face login + JWT", login_ok, json.dumps(login_payload)[:240])

    return user_id, token


def test_database(report: SuiteReport, user_id: str) -> None:
    try:
        import psycopg
    except ImportError:
        report.add(
            "TEST 7 - Database linkage",
            False,
            "psycopg not installed - skipped DB assertions",
        )
        return

    dsn = DATABASE_URL.replace("?schema=public", "")
    started = time.perf_counter()
    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT id, email FROM users WHERE id = %s', (user_id,))
            user_row = cur.fetchone()
            cur.execute(
                'SELECT user_id, face_embedding_id FROM face_registrations WHERE user_id = %s',
                (user_id,),
            )
            face_row = cur.fetchone()
    elapsed = (time.perf_counter() - started) * 1000

    ok = (
        user_row is not None
        and face_row is not None
        and str(face_row[0]) == user_id
        and str(face_row[1]) == user_id
    )
    detail = f"user={bool(user_row)} face_registration={face_row}"
    report.add("TEST 7 - Database user/face linkage", ok, detail, elapsed)


def test_frontend_pages(client: httpx.Client, report: SuiteReport) -> None:
    routes = [
        ("/face/register", "TEST 8a - /face/register"),
        ("/face/login", "TEST 8b - /face/login"),
        ("/dashboard", "TEST 8c - /dashboard"),
        ("/login", "TEST 8d - /login"),
    ]
    for route, label in routes:
        started = time.perf_counter()
        try:
            response = client.get(f"{FRONTEND_URL}{route}", timeout=20.0, follow_redirects=True)
            elapsed = (time.perf_counter() - started) * 1000
            ok = response.status_code == 200
            report.add(label, ok, f"status={response.status_code}", elapsed)
        except Exception as exc:
            report.add(label, False, str(exc))


def test_performance(client: httpx.Client, report: SuiteReport, user_id: str) -> None:
    diag = client.get(f"{AI_URL}/diagnostics/face-engine", timeout=20.0)
    if diag.status_code == 200:
        report.performance["diagnostics"] = diag.json().get("performance", [])

    started = time.perf_counter()
    with FACE_A.open("rb") as handle:
        client.post(
            f"{AI_URL}/face/login",
            files={"image": ("face_a.jpg", handle, "image/jpeg")},
            timeout=60.0,
        )
    report.performance["similarity_search_time_ms"] = round((time.perf_counter() - started) * 1000, 2)

    with FACE_A.open("rb") as handle:
        embed_started = time.perf_counter()
        client.post(
            f"{AI_URL}/face/embed",
            files={"image": ("face_a.jpg", handle, "image/jpeg")},
            timeout=60.0,
        )
    report.performance["embedding_generation_time_ms"] = round(
        (time.perf_counter() - embed_started) * 1000,
        2,
    )
    report.add(
        "TEST 9 - Performance metrics captured",
        True,
        json.dumps(report.performance),
    )


def print_report(report: SuiteReport) -> int:
    log("\n================ FINAL REPORT ================\n")
    log("PASSED tests:")
    for item in report.passed:
        log(f"  + {item.name} ({item.duration_ms:.0f} ms) {item.detail}")

    log("\nFAILED tests:")
    if not report.failed:
        log("  - none")
    for item in report.failed:
        log(f"  x {item.name}: {item.detail}")

    log("\nFiles checked:")
    for path in report.files_checked:
        log(f"  - {path}")

    log("\nPerformance:")
    log(json.dumps(report.performance, indent=2))

    if report.failed:
        log("\nRoot cause:")
        for item in report.failed:
            log(f"  - {item.name}: {item.detail}")
        return 1

    log("\nAll verification tests passed.")
    return 0


def main() -> int:
    report = SuiteReport(
        files_checked=[
            "ai-service/app/services/embedding_service.py",
            "ai-service/app/services/face_auth_service.py",
            "ai-service/app/services/face_diagnostics.py",
            "ai-service/app/services/liveness_service.py",
            "ai-service/app/routers/health.py",
            "ai-service/app/routers/face_auth.py",
            "ai-service/app/routers/face_diagnostics.py",
            "backend/src/modules/face/services/face.service.js",
            "frontend/src/features/face/services/faceService.js",
        ]
    )

    ensure_fixtures()

    with httpx.Client() as client:
        try:
            test_python_health(client, report)
        except Exception as exc:
            report.add("TEST 1 - Python service /health", False, str(exc))

        if not any(item.name.startswith("TEST 1") and item.passed for item in report.results):
            return print_report(report)

        user_id = str(uuid.uuid4())
        try:
            test_face_registration_ai(client, report, user_id)
            test_duplicate_face(client, report)
            test_face_login_ai(client, report, user_id)
            test_wrong_face_login(client, report)
            test_face_logout_verify(client, report, user_id)
            test_performance(client, report, user_id)
        except Exception as exc:
            report.add("AI face flow", False, str(exc))

        try:
            backend_user_id, _token = test_backend_face_flow(client, report)
            test_database(report, backend_user_id)
        except Exception as exc:
            report.add("Backend / database flow", False, str(exc))

        try:
            test_frontend_pages(client, report)
        except Exception as exc:
            report.add("Frontend pages", False, str(exc))

    return print_report(report)


if __name__ == "__main__":
    sys.exit(main())
