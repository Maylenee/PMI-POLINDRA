"""POST /rag-files - List source documents in the knowledge base.

The frontend expects { status: "ok", dir, files: [{name, size}] }.
public/prepare-rag/files/ is not shipped to the agent runtime, so the list
is derived from the generated agents/_data/index.json manifest.
"""

from typing import Any

from .._loader import get_rag_index
from .._logger import create_logger

logger = create_logger("rag-files")


async def handler(context: Any):
    try:
        idx = get_rag_index()
        docs = idx.get("documents", []) if idx else []
        files = [
            {
                "name": (d.get("meta") or {}).get("doc_name") or d.get("docId", ""),
                "size": d.get("totalBytes", 0),
            }
            for d in docs
        ]
        return {"status": "ok", "dir": "public/prepare-rag/files/", "files": files}
    except Exception as e:
        logger.error(f"Failed to list files: {e}")
        return {"status": "error", "error": str(e)}
