"""Pydantic models for chat request/response."""
from pydantic import BaseModel, Field
from typing import Literal


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    session_id: str = Field(..., min_length=8, max_length=64)
    # Conversation history from frontend (last N messages)
    history: list[ChatMessage] = Field(default_factory=list, max_length=20)


class ProductCard(BaseModel):
    title: str
    price: str
    availability: str
    url: str
    image_url: str | None = None
    handle: str


class ToolCallLog(BaseModel):
    tool_name: str
    input: dict
    output: str
    duration_ms: int


# SSE event types sent to frontend
class SSEEvent(BaseModel):
    type: Literal["text", "product_card", "tool_log", "error", "done"]
    content: str | None = None
    data: dict | None = None
