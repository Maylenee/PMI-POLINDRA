"""RAG tool definitions for OpenAI Agents SDK (Python).

One tool: retrieve — semantic top-K chunk retrieval backed by a blob-stored
vector index. This replaces the old search_document + fetch_pages flow that
handed whole pages to the model. Now the LLM receives only the most relevant
passages (top-K chunks), which is the core token-saving win.

NOTE: the tool is defined as a *synchronous* function. The OpenAI Agents SDK
0.18.x invokes `function_tool` callables synchronously, so an `async def` tool
raises "FunctionTool object is not callable". Internally we still use async
I/O (blob store + embeddings), driven by a loop-safe runner below.
"""

import asyncio
import json
from typing import Annotated

from agents import function_tool

from ._embeddings import embed
from ._vectorstore import (
    configure_store,
    get_document_meta,
    list_documents,
    retrieve as vs_retrieve,
)
from ._logger import create_logger

logger = create_logger("tools")


def _run(coro):
    """Run a coroutine from sync context, reusing the running loop if any."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None
    if loop and loop.is_running():
        # Already inside an event loop (e.g. SDK streaming). Offload to a
        # thread so we don't block/deadlock the loop.
        import concurrent.futures

        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as ex:
            return ex.submit(lambda: asyncio.run(coro)).result()
    return asyncio.run(coro)


@function_tool
def retrieve(
    query: Annotated[str, "The user's question in natural language"],
    doc_id: Annotated[str, "Optional document ID to constrain search. Leave empty to search all documents."] = "",
) -> str:
    """Semantic retrieval: returns the top-K most relevant text chunks for the query.

    Use this FIRST for any knowledge-base question. It embeds the query and
    returns only the most similar passages (with their document + page), so you
    should answer from these chunks rather than asking for whole pages.

    If doc_id is provided the search is limited to that document; otherwise it
    spans the whole knowledge base. Pick doc_id from the catalog when the
    question clearly targets one document, otherwise omit it.
    """

    logger.log(f"retrieve called: query=\"{query}\", doc_id=\"{doc_id}\"")

    async def _do() -> str:
        if doc_id:
            meta = await get_document_meta(doc_id)
            if not meta:
                return json.dumps({"error": f"Document '{doc_id}' not found."}, ensure_ascii=False)

        docs = await list_documents()
        if not docs:
            return json.dumps({
                "error": "Knowledge base is empty. Please run prepare_rag_data.py first.",
            }, ensure_ascii=False)

        query_emb = await embed(query)
        results = await vs_retrieve(query_emb, doc_id=doc_id, top_k=5)

        if not results:
            return json.dumps({
                "query": query,
                "docId": doc_id or None,
                "matches": [],
                "instruction": (
                    "No relevant chunks found. Try rephrasing, or if a doc_id was "
                    "given, retry without it to search the whole knowledge base."
                ),
            }, ensure_ascii=False)

        return json.dumps({
            "query": query,
            "docId": doc_id or None,
            "matchCount": len(results),
            "matches": [
                {
                    "docId": r["doc_id"],
                    "docName": r["doc_name"],
                    "page": r["page"],
                    "score": r["score"],
                    "text": r["text"],
                }
                for r in results
            ],
        }, ensure_ascii=False)

    return _run(_do())


def bind_store(store) -> None:
    """Wire the EdgeOne blob store into the vector store at runtime."""
    configure_store(store)


# Tool collection for RAG agent
RAG_TOOLS = [retrieve]

