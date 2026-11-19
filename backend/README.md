# Shopify AI Agent Backend

This is the FastAPI backend for the Shopify AI Agent.

See the [root README](../README.md) for full project documentation.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
cp ../.env.example .env     # fill in your keys
uvicorn app.main:app --reload
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/chat` | Chat (SSE streaming) |
