from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.features.chat.schemas  import ChatRequest
from app.features.chat.service  import run_chat_agent
from app.core.security          import verify_internal_key

router = APIRouter(prefix="/agent", tags=["agent"])


@router.post("/chat", dependencies=[Depends(verify_internal_key)])
async def chat(request: ChatRequest) -> StreamingResponse:
    """
    SSE streaming endpoint.

    service.run_chat_agent() yields raw text lines (no 'data:' prefix).
    This wrapper adds 'data:' exactly once per token — correct SSE format.

    Special tokens from service.py:
      "[DONE]\n"        → forwarded as-is, signals end of content
      "[META]{...}\n"   → forwarded as-is, Node.js bridge parses metadata
    """
    async def event_stream():
        async for raw_token in run_chat_agent(request):
            # raw_token is a plain text line (may include \n at end)
            # Strip trailing newline before wrapping in SSE format
            token = raw_token.rstrip("\n")
            yield f"data: {token}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":     "no-cache",
            "Connection":        "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )