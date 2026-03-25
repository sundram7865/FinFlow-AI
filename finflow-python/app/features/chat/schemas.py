from pydantic import BaseModel
from typing import Any


class ChatMessage(BaseModel):
    role:      str
    content:   str
    agentUsed: str | None = None
    timestamp: str | None = None


class MemoryEntry(BaseModel):
    summary:   str
    type:      str
    createdAt: str | None = None


class ChatRequest(BaseModel):
    message:     str
    userId:      str
    transactions: list[dict[str, Any]] = []
    goals:        list[dict[str, Any]] = []
    chat_history: list[dict[str, Any]] = []
    memory:       list[dict[str, Any]] = []


class ChatResponse(BaseModel):
    final_response: str
    anomalies:      list[dict[str, Any]] = []
    new_memories:   list[dict[str, Any]] = []