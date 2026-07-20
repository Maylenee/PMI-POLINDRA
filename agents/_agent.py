"""Agent definition: RAG Assistant."""

from agents import Agent

from ._loader import get_document_meta, list_documents
from ._logger import create_logger
from ._model import llm_model
from ._tools import RAG_TOOLS

logger = create_logger("agent")


def _build_document_catalog() -> str:
    """Render the knowledge base inventory into the system prompt.

    The catalog lists every document so the model can pick a target doc_id
    before calling `retrieve`. It uses the synchronous legacy `index.json`
    loader (written by prepare-rag) so it can be built at module import time
    without awaiting the async vector store. It is refreshed on process
    restart, consistent with the one-shot prepare-rag pipeline.
    """
    docs = list_documents()
    if not docs:
        logger.warn("Knowledge base is empty; agent prompt will say so.")
        return (
            "Available documents: (the knowledge base is currently empty — "
            "tell the user to run `npm run prepare-rag` and try again)."
        )

    lines = ["Available documents in the knowledge base:"]
    for d in docs:
        doc_id = d.get("docId", "")
        meta = get_document_meta(doc_id) or {}
        name = meta.get("doc_name") or doc_id
        lines.append(f"- doc_id={doc_id!r}: {name}")
    return "\n".join(lines)


_DOCUMENT_CATALOG = _build_document_catalog()


RAG_SYSTEM_PROMPT = (
    "You are an enterprise knowledge base assistant running inside an EdgeOne Makers environment. "
    "Answer questions using only retrieved knowledge base content.\n\n"
    f"{_DOCUMENT_CATALOG}\n\n"
    "Intent recognition:\n"
    "- First determine whether the user's question is about EdgeOne Makers, its templates, runtime, deployment, "
    "tools, knowledge base, or related platform capabilities.\n"
    "- If the question is unrelated to EdgeOne Makers, do not answer it and do not search the corpus. "
    "Instead, briefly guide the user to ask questions about EdgeOne Makers.\n"
    "- If the question is related to EdgeOne Makers or ambiguous but potentially relevant, continue with the retrieval workflow.\n\n"
    "Retrieval workflow (semantic, token-efficient):\n"
    "1. Call `retrieve(query, doc_id?)` with the user's question phrased as a natural-language query.\n"
    "   The tool returns the top-K most relevant text chunks (with docId, docName, page, score) "
    "and NOT whole pages — this keeps context small and latency low.\n"
    "2. If the question clearly targets one document, pass its doc_id from the catalog to narrow the search; "
    "otherwise omit doc_id to search across the whole knowledge base.\n"
    "3. Read the returned `matches` and answer strictly from those chunks. If they are insufficient, "
    "rephrase the query or retry `retrieve` without a doc_id rather than giving up.\n"
    "4. Never fetch or paste full pages; the retrieved chunks are already the most relevant passages.\n\n"
    "Answering rules:\n"
    "- Respond in the same language as the user's question.\n"
    "- Do NOT add inline citations such as [DocumentName, p.3] in the answer text. "
    "The platform renders source cards separately from the retrieved chunks, so duplicating them in prose is noise.\n"
    "- If sources conflict, state the conflict in plain language (e.g. \"the configuration guide and the API reference disagree on this\").\n"
    "- If after retrieval the content is genuinely insufficient, clearly say so. "
    "Never claim a topic is missing without first calling `retrieve`.\n"
    "- Never invent document names, page numbers, citations, or facts.\n"
    "- If a tool call fails, explain the failure briefly and ask the user to retry or narrow the question."
)

rag_agent = Agent(
    name="RAG Assistant",
    instructions=RAG_SYSTEM_PROMPT,
    tools=RAG_TOOLS,
    model=llm_model,
)

