import json
from typing import AsyncGenerator
from fastapi.responses import StreamingResponse


async def token_stream(
    generator: AsyncGenerator[str, None]
) -> StreamingResponse:
    async def event_stream():
        async for token in generator:
            yield f"data: {token}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":               "no-cache",
            "Connection":                  "keep-alive",
            "X-Accel-Buffering":           "no",
        },
    )