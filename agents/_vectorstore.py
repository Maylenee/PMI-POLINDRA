"""Blob-backed vector store for RAG.

Best practice for token efficiency:
  * Documents are split into small overlapping chunks (~400 tokens) once, at
    prepare time, and each chunk is embedded.
  * At query time we embed the query and return ONLY the top-K most similar
    chunks (cosine similarity) instead of dumping whole pages into the prompt.
    This is the single biggest token saving: the LLM sees relevant passages,
    not an entire document.

Storage backend (blob):
  * In the EdgeOne Makers runtime we persist the index under `context.store`
    (a KV-style blob store) so it survives across invocations and is shared by
    every instance — no local-disk coupling.
  * `context` is injected via `configure_store()`. When it is not available
    (local dev / the prepare script), we transparently fall back to the
    `agents/_data/` directory on disk, keeping the same JSON shape.

Layout (one blob key per document):
  rag:index        -> { "documents": [ {docId, doc_name, chunk_count, dim}, ... ] }
  rag:doc:{docId}  -> { "docId", "doc_name", "dim", "chunks": [ {id, doc_id, page,
                       text, embedding} ] }
"""

import json
from pathlib import Path
from typing import List, Optional

from ._logger import create_logger

logger = create_logger("vectorstore")

RAG_ROOT = Path(__file__).parent / "_data"

# Chunking parameters (best-practice defaults)
_CHUNK_TOKENS = 400      # ~400 words per chunk
_CHUNK_OVERLAP = 80      # overlap to avoid splitting context at boundaries
_TOP_K = 5               # number of chunks returned per retrieve()

_INDEX_KEY = "rag:index"
_DOC_KEY_PREFIX = "rag:doc:"

_store = None  # EdgeOne context.store, injected at runtime


def configure_store(store) -> None:
    """Inject the EdgeOne blob store (context.store) for runtime use."""
    global _store
    _store = store


# ── Text chunking ─────────────────────────────────────────────────────────────

def chunk_text(text: str, page: int) -> List[dict]:
    """Split page text into overlapping token chunks.

    Returns a list of {page, offset, text}. We chunk on whitespace tokens
    which is a robust approximation across languages; 1 token ≈ 1 word here.
    """
    text = (text or "").strip()
    if not text:
        return []
    # Normalize whitespace
    words = text.split()
    if not words:
        return []

    step = max(1, _CHUNK_TOKENS - _CHUNK_OVERLAP)
    chunks: List[dict] = []
    offset = 0
    i = 0
    while i < len(words):
        slice_words = words[i : i + _CHUNK_TOKENS]
        chunk_text_str = " ".join(slice_words)
        chunks.append({"page": page, "offset": offset, "text": chunk_text_str})
        offset += len(slice_words)
        i += step
    return chunks


# ── Cosine similarity ──────────────────────────────────────────────────────────

def cosine(a: List[float], b: List[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math_hypot(a)
    nb = math_hypot(b)
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


def math_hypot(v: List[float]) -> float:
    return sum(x * x for x in v) ** 0.5


# ── Blob I/O (store with disk fallback) ─────────────────────────────────────────

def _disk_path(key: str) -> Path:
    return RAG_ROOT / f"{key.replace(':', '_')}.json"


async def _blob_get(key: str) -> Optional[dict]:
    """Read from the blob store first, then fall back to the on-disk index.

    The prepare-rag script writes the vector index to disk (no EdgeOne
    `context.store` available at build time). At runtime the same index may not
    yet be mirrored into the blob store, so we transparently fall back to disk
    — this guarantees the knowledge base is never reported empty just because
    the blob store hasn't been seeded.
    """
    if _store is not None:
        try:
            raw = await _store.get(key)
            if raw is not None:
                if isinstance(raw, bytes):
                    raw = raw.decode("utf-8")
                return json.loads(raw)
        except Exception as e:  # pragma: no cover - defensive
            logger.error(f"blob get {key} failed: {e}")

    # disk fallback
    path = _disk_path(key)
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return None
    return None


async def _blob_put(key: str, payload: dict) -> None:
    """Write to the blob store (if present) and always to disk as a backup."""
    text = json.dumps(payload, ensure_ascii=False)
    if _store is not None:
        try:
            await _store.set(key, text)
        except Exception as e:  # pragma: no cover - defensive
            logger.error(f"blob set {key} failed: {e}")
    # disk backup (also the source the prepare script seeds)
    RAG_ROOT.mkdir(parents=True, exist_ok=True)
    _disk_path(key).write_text(text, encoding="utf-8")


# ── Index management ────────────────────────────────────────────────────────────

async def list_documents() -> List[dict]:
    """Catalog of documents available in the vector store."""
    idx = await _blob_get(_INDEX_KEY)
    if not idx or not idx.get("documents"):
        return []
    return [
        {"docId": d["docId"], "meta": {"doc_name": d.get("doc_name", d["docId"])}}
        for d in idx["documents"]
    ]


async def get_document_meta(doc_id: str) -> Optional[dict]:
    idx = await _blob_get(_INDEX_KEY)
    if not idx:
        return None
    for d in idx.get("documents", []):
        if d["docId"] == doc_id:
            return {
                "doc_name": d.get("doc_name", doc_id),
                "chunk_count": d.get("chunk_count", 0),
                "dim": d.get("dim", 0),
            }
    return None


# ── Retrieval (the token-saving path) ──────────────────────────────────────────

async def retrieve(query_embedding: List[float], doc_id: str = "", top_k: int = _TOP_K) -> List[dict]:
    """Return top-K relevant chunks across all docs (or one doc).

    Each returned chunk: {doc_id, doc_name, page, score, text}. Only the
    `text` (and a short page reference) is sent to the LLM — never full pages.
    """
    idx = await _blob_get(_INDEX_KEY)
    if not idx:
        return []

    docs = idx["documents"]
    if doc_id:
        docs = [d for d in docs if d["docId"] == doc_id]

    scored: List[dict] = []
    for d in docs:
        doc_obj = await _blob_get(_DOC_KEY_PREFIX + d["docId"])
        if not doc_obj:
            continue
        doc_name = doc_obj.get("doc_name", d["docId"])
        for ch in doc_obj.get("chunks", []):
            emb = ch.get("embedding")
            if not emb:
                continue
            score = cosine(query_embedding, emb)
            scored.append({
                "doc_id": d["docId"],
                "doc_name": doc_name,
                "page": ch.get("page"),
                "score": round(score, 4),
                "text": ch.get("text", ""),
            })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_k]
