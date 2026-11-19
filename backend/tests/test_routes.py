"""FastAPI app integration tests."""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_chat_empty_message():
    response = client.post("/api/chat", json={"message": "", "session_id": "test-session-001"})
    assert response.status_code == 422  # Pydantic validation rejects empty string


def test_chat_too_long_message():
    response = client.post(
        "/api/chat",
        json={"message": "x" * 1001, "session_id": "test-session-001"},
    )
    assert response.status_code == 422  # Exceeds max_length=1000
