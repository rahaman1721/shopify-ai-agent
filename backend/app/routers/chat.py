"""Chat router — POST /api/chat with SSE streaming response."""
import uuid
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.models.schemas import ChatRequest
from app.services.gemini_agent import run_agent
from app.core.config import settings

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/chat")
@limiter.limit(f"{settings.max_requests_per_minute}/minute")
async def chat(request: Request, body: ChatRequest):
    """
    Stream AI responses via Server-Sent Events.
    Frontend reads this as an EventSource.
    """
    # Generate session ID if not provided
    session_id = body.session_id or str(uuid.uuid4())

    return StreamingResponse(
        run_agent(session_id=session_id, user_message=body.message),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable Nginx buffering for SSE
        },
    )
