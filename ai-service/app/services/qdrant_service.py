from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

import logging

from app.config import get_settings

logger = logging.getLogger(__name__)


class QdrantStore:
    def __init__(self) -> None:
        settings = get_settings()
        self._settings = settings
        self._client = None
        self._enabled = bool(settings.qdrant_url)
        self._ensured_collections: set[str] = set()

    @property
    def enabled(self) -> bool:
        return self._enabled

    def _get_client(self) -> QdrantClient | None:
        if not self._enabled:
            return None
        if self._client is None:
            self._client = QdrantClient(
                url=self._settings.qdrant_url,
                api_key=self._settings.qdrant_api_key,
                check_compatibility=False,
            )
        return self._client

    def ensure_collection(self, name: str, size: int) -> None:
        cache_key = f"{name}:{size}"
        if cache_key in self._ensured_collections:
            return

        client = self._get_client()
        if not client:
            return

        collections = client.get_collections().collections
        exists = any(item.name == name for item in collections)
        if exists:
            info = client.get_collection(name)
            current_size = info.config.params.vectors.size
            if current_size != size:
                logger.warning(
                    "Recreating Qdrant collection %s | vector size %s -> %s",
                    name,
                    current_size,
                    size,
                )
                client.delete_collection(name)
                exists = False

        if not exists:
            client.create_collection(
                collection_name=name,
                vectors_config=qmodels.VectorParams(size=size, distance=qmodels.Distance.COSINE),
            )

        self._ensured_collections.add(cache_key)

    def upsert_vector(
        self,
        collection: str,
        point_id: str,
        vector: list[float],
        payload: dict,
        size: int,
    ) -> None:
        client = self._get_client()
        if not client:
            raise RuntimeError("Qdrant is not configured")

        self.ensure_collection(collection, size)
        client.upsert(
            collection_name=collection,
            wait=True,
            points=[
                qmodels.PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=payload,
                )
            ],
        )
        logger.info(
            "Qdrant upsert | collection=%s | point_id=%s | dimensions=%s",
            collection,
            point_id,
            len(vector),
        )

    def search_vectors(
        self,
        collection: str,
        vector: list[float],
        limit: int,
        size: int,
    ) -> list[dict]:
        client = self._get_client()
        if not client:
            raise RuntimeError("Qdrant is not configured")

        self.ensure_collection(collection, size)
        response = client.query_points(
            collection_name=collection,
            query=vector,
            limit=limit,
            with_payload=True,
        )

        return [
            {
                "id": str(item.id),
                "score": float(item.score),
                "payload": item.payload or {},
            }
            for item in response.points
        ]

    def delete_vector(self, collection: str, point_id: str) -> bool:
        client = self._get_client()
        if not client:
            raise RuntimeError("Qdrant is not configured")

        client.delete(
            collection_name=collection,
            wait=True,
            points_selector=qmodels.PointIdsList(points=[point_id]),
        )
        logger.info(
            "Qdrant delete | collection=%s | point_id=%s",
            collection,
            point_id,
        )
        return True

    def delete_vectors_by_user_id(self, collection: str, user_id: str) -> int:
        client = self._get_client()
        if not client:
            raise RuntimeError("Qdrant is not configured")

        deleted = 0
        point_ids = {str(user_id)}

        try:
            self.delete_vector(collection, str(user_id))
            deleted += 1
        except Exception:
            pass

        offset = None
        while True:
            records, offset = client.scroll(
                collection_name=collection,
                limit=100,
                offset=offset,
                with_payload=True,
                with_vectors=False,
            )

            for record in records:
                payload_user_id = str((record.payload or {}).get("user_id") or "")
                record_id = str(record.id)

                if payload_user_id == str(user_id) and record_id not in point_ids:
                    client.delete(
                        collection_name=collection,
                        wait=True,
                        points_selector=qmodels.PointIdsList(points=[record.id]),
                    )
                    point_ids.add(record_id)
                    deleted += 1

            if offset is None:
                break

        logger.info(
            "Qdrant delete by user | collection=%s | user_id=%s | deleted=%s",
            collection,
            user_id,
            deleted,
        )
        return deleted

    def scroll_points(
        self,
        collection: str,
        limit: int = 100,
        offset=None,
    ) -> tuple[list[dict], object | None]:
        client = self._get_client()
        if not client:
            raise RuntimeError("Qdrant is not configured")

        records, next_offset = client.scroll(
            collection_name=collection,
            limit=limit,
            offset=offset,
            with_payload=True,
            with_vectors=False,
        )

        points = [
            {
                "id": str(record.id),
                "payload": record.payload or {},
            }
            for record in records
        ]

        return points, next_offset

    def get_vector(self, collection: str, point_id: str) -> list[float] | None:
        client = self._get_client()
        if not client:
            raise RuntimeError("Qdrant is not configured")

        records = client.retrieve(
            collection_name=collection,
            ids=[point_id],
            with_vectors=True,
        )

        if not records:
            return None

        vector = records[0].vector
        if vector is None:
            return None

        if isinstance(vector, dict):
            return list(next(iter(vector.values())))

        return list(vector)

    def count_points(self, collection: str) -> int:
        client = self._get_client()
        if not client:
            return 0

        info = client.get_collection(collection_name=collection)
        return int(info.points_count or 0)

    def clear_collection(self, collection: str, size: int) -> int:
        client = self._get_client()
        if not client:
            raise RuntimeError("Qdrant is not configured")

        before = self.count_points(collection)
        collections = client.get_collections().collections
        exists = any(item.name == collection for item in collections)

        if exists:
            client.delete_collection(collection_name=collection)

        client.create_collection(
            collection_name=collection,
            vectors_config=qmodels.VectorParams(size=size, distance=qmodels.Distance.COSINE),
        )
        logger.info(
            "Qdrant collection reset | collection=%s | deleted_points=%s",
            collection,
            before,
        )
        return before

    def face_collection(self) -> str:
        return self._settings.qdrant_face_collection

    def product_collection(self) -> str:
        return self._settings.qdrant_product_collection

    def dna_collection(self) -> str:
        return self._settings.qdrant_dna_collection

    def upsert_fashion_dna(
        self,
        user_id: str,
        vector: list[float],
        payload: dict,
    ) -> None:
        self.upsert_vector(
            self.dna_collection(),
            user_id,
            vector,
            payload,
            self._settings.dna_vector_size,
        )

    def search_fashion_dna(
        self,
        vector: list[float],
        limit: int = 10,
    ) -> list[dict]:
        return self.search_vectors(
            self.dna_collection(),
            vector,
            limit,
            self._settings.dna_vector_size,
        )

    def get_fashion_dna_vector(self, user_id: str) -> list[float] | None:
        return self.get_vector(self.dna_collection(), user_id)

    def count_fashion_dna_points(self) -> int:
        return self.count_points(self.dna_collection())
