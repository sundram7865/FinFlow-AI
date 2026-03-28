from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.features.chat.schemas  import ChatRequest
from app.features.chat.service  import run_chat_agent
from app.core.security          import verify_internal_key

router = APIRouter(prefix="/agent", tags=["agent"])


@router.post("/chat", dependencies=[Depends(verify_internal_key)])
async def chat(request: ChatRequest) -> StreamingResponse:
    async def event_stream():
        async for token in run_chat_agent(request):
            yield f"data: {token}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )