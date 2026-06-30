import numpy as np


def normalize(vector: list[float]) -> list[float]:
    arr = np.asarray(vector, dtype=np.float32)
    magnitude = np.linalg.norm(arr)
    if magnitude == 0:
        return arr.tolist()
    return (arr / magnitude).tolist()


def cosine_similarity(a: list[float], b: list[float]) -> float:
    va = np.asarray(a, dtype=np.float32)
    vb = np.asarray(b, dtype=np.float32)
    denom = np.linalg.norm(va) * np.linalg.norm(vb)
    if denom == 0:
        return 0.0
    return float(np.dot(va, vb) / denom)


def resize_vector(vector: list[float], target_size: int) -> list[float]:
    arr = np.asarray(vector, dtype=np.float32)
    if arr.size == target_size:
        return normalize(arr.tolist())

    if arr.size > target_size:
        resized = arr[:target_size]
    else:
        repeats = int(np.ceil(target_size / arr.size))
        resized = np.tile(arr, repeats)[:target_size]

    return normalize(resized.tolist())
