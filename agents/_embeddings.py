"""Embeddings client (OpenAI-compatible) with a deterministic local fallback.

Best practice: embeddings are produced by the same OpenAI-compatible gateway
that already serves the LLM (`AI_GATEWAY_BASE_URL`). If that endpoint does not
expose an embeddings route (or no key is configured), we fall back to a cheap
local hashing embedder so the pipeline still runs offline — the semantic
quality degrades but retrieval + the rest of the RAG flow keep working.
"""

import hashlib
import math
import os
from typing import List

from ._logger import create_logger

logger = create_logger("embeddings")

_DIM = 256  # local fallback dimension

_api_key = os.getenv("AI_GATEWAY_API_KEY", "")
_base_url = os.getenv("AI_GATEWAY_BASE_URL", "")
_embed_model = os.getenv("AI_GATEWAY_EMBED_MODEL", "text-embedding-3-small")

_client = None


def _get_client():
    global _client
    if _client is not None:
        return _client
    if not _api_key or not _base_url:
        logger.warn("AI_GATEWAY not configured; using local fallback embedder")
        _client = False
        return _client
    try:
        from openai import AsyncOpenAI

        _client = AsyncOpenAI(api_key=_api_key, base_url=_base_url)
    except Exception as e:  # pragma: no cover - defensive
        logger.error(f"Failed to init embeddings client: {e}; using fallback")
        _client = False
    return _client


def _local_embed(text: str) -> List[float]:
    """Deterministic bag-of-words hashing embedder (fallback only)."""
    vec = [0.0] * _DIM
    # tokenize on word boundaries, keep unicode word chars
    tokens = []
    for chunk in text.lower().split():
        # strip light punctuation
        tok = "".join(ch for ch in chunk if ch.isalnum())
        if tok:
            tokens.append(tok)
    if not tokens:
        return vec
    for tok in tokens:
        h = int(hashlib.md5(tok.encode("utf-8")).hexdigest(), 16)
        idx = h % _DIM
        sign = 1.0 if (h >> 8) & 1 else -1.0
        vec[idx] += sign
    # L2 normalize
    norm = math.sqrt(sum(v * v for v in vec))
    if norm > 0:
        vec = [v / norm for v in vec]
    return vec


async def embed(text: str) -> List[float]:
    """Embed a single string. Async to match the gateway call path."""
    client = _get_client()
    if client is False:
        return _local_embed(text)
    try:
        resp = await client.embeddings.create(model=_embed_model, input=text)
        return list(resp.data[0].embedding)
    except Exception as e:
        logger.warn(f"Embeddings API failed ({e}); using local fallback")
        _client = False
        return _local_embed(text)


async def embed_batch(texts: List[str]) -> List[List[float]]:
    """Embed many strings. Falls back to per-item local embed on any error."""
    client = _get_client()
    if client is False or not texts:
        return [_local_embed(t) for t in texts]
    try:
        resp = await client.embeddings.create(model=_embed_model, input=texts)
        return [list(d.embedding) for d in resp.data]
    except Exception as e:
        logger.warn(f"Batch embeddings failed ({e}); local fallback")
        _client = False
        return [_local_embed(t) for t in texts]
