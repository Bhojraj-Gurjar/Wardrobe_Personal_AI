import hashlib
import json
from typing import Any

import redis

from app.config import get_settings


class CacheService:
    def __init__(self) -> None:
        settings = get_settings()
        self._ttl = settings.redis_cache_ttl
        try:
            self._client = redis.Redis(
                host=settings.redis_host,
                port=settings.redis_port,
                decode_responses=True,
            )
            self._client.ping()
            self._available = True
        except redis.RedisError:
            self._client = None
            self._available = False

    def _key(self, prefix: str, payload: Any) -> str:
        digest = hashlib.sha256(
            json.dumps(payload, sort_keys=True, default=str).encode()
        ).hexdigest()
        return f"ai:{prefix}:{digest}"

    def get_json(self, prefix: str, payload: Any) -> dict | None:
        if not self._available:
            return None
        try:
            raw = self._client.get(self._key(prefix, payload))
            return json.loads(raw) if raw else None
        except redis.RedisError:
            return None

    def set_json(self, prefix: str, payload: Any, value: dict) -> None:
        if not self._available:
            return
        try:
            self._client.setex(
                self._key(prefix, payload),
                self._ttl,
                json.dumps(value),
            )
        except redis.RedisError:
            return None
