# 🛒 Shopify AI Agent

[![CI](https://github.com/rahaman1721/shopify-ai-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/rahaman1721/shopify-ai-agent/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Gemini](https://img.shields.io/badge/Gemini_2.0_Flash-Free_Tier-4285F4?style=flat-square&logo=google&logoColor=white)](https://aistudio.google.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

> **An AI shopping assistant for Shopify stores — powered by Gemini 2.0 Flash tool calling, real-time SSE streaming, and an embeddable React chat widget.**

Not just a chatbot. The agent calls real Shopify APIs to fetch live product data, check orders, and answer policy questions — it never guesses or invents answers. Supports Tamil + English.

---

## ✨ Features

- 🔧 **5 Real Tools** — search products, get details, check orders, store policies, recommendations
- ⚡ **Streaming responses** — word-by-word SSE stream (like ChatGPT)
- 🃏 **Product cards in chat** — image, price, stock, "View Product" button rendered inline
- 🔍 **Debug panel** — live tool call log visible to show recruiters how the agent works
- 🌐 **Tamil + English** — responds in the customer's language
- 🛡️ **Security guardrails** — never invents prices, verifies email before order lookup
- 🆓 **100% free to run** — Gemini 2.0 Flash free tier (1,500 req/day)

---

## 🏗️ Architecture

```mermaid
flowchart LR
    Customer["👤 Customer"]
    Widget["💬 React Widget\n(Shopify Theme)"]
    FastAPI["🐍 FastAPI\n(Render.com)"]
    Gemini["🧠 Gemini 2.0 Flash\n(Tool Use)"]
    Shopify["🛍️ Shopify APIs\n(Storefront + Admin)"]
    Policies["📄 Policy JSON\n(5 topics)"]

    Customer -->|types message| Widget
    Widget -->|POST /api/chat SSE| FastAPI
    FastAPI -->|message + 5 tools| Gemini
    Gemini -->|tool_use calls| FastAPI
    FastAPI -->|GraphQL / REST| Shopify
    FastAPI -->|read file| Policies
    FastAPI -->|tool_result| Gemini
    Gemini -->|streaming text| FastAPI
    FastAPI -->|SSE chunks| Widget
    Widget -->|text + ProductCards| Customer
```

---

## 🔧 The 5 Tools

| Tool | What it does |
|---|---|
| `search_products` | Searches Shopify catalogue by keyword |
| `get_product_details` | Returns all variants, sizes, stock for a product |
| `check_order_status` | Looks up order (requires order number + email verification) |
| `get_store_policy` | Returns shipping / returns / refund / warranty policy |
| `recommend_products` | Suggests similar or complementary products |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- [Google AI Studio account](https://aistudio.google.com) (free `GEMINI_API_KEY`)
- Shopify Partners development store (free)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e ".[dev]"

cp ../.env.example .env
# Edit .env — add your GEMINI_API_KEY and Shopify tokens

uvicorn app.main:app --reload
# → API running at http://localhost:8000
# → Docs at http://localhost:8000/docs
```

### Widget

```bash
cd widget
npm install
npm run dev
# → Widget dev server at http://localhost:5173
```

### Run Tests

```bash
cd backend
pytest tests/ -v
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **LLM + Tool Use** | Google Gemini 2.0 Flash (free tier) |
| **Backend** | Python 3.11, FastAPI, Pydantic v2 |
| **Streaming** | Server-Sent Events (SSE) |
| **Frontend Widget** | React 19, TypeScript, Vite, Tailwind CSS |
| **Shopify** | Storefront GraphQL API + Admin REST API |
| **Rate Limiting** | slowapi |
| **Deployment** | Render.com (backend) + Vercel (widget) |

---

## 📁 Project Structure

```
shopify-ai-agent/
├── backend/
│   ├── app/
│   │   ├── main.py                 ← FastAPI app entry point
│   │   ├── core/config.py          ← Settings from .env
│   │   ├── routers/chat.py         ← POST /api/chat (SSE)
│   │   ├── services/
│   │   │   ├── gemini_agent.py     ← Gemini tool use loop
│   │   │   ├── shopify.py          ← Shopify API calls
│   │   │   └── policies.py         ← Policy JSON loader
│   │   ├── tools/definitions.py    ← 5 tool schemas
│   │   ├── models/schemas.py       ← Pydantic models
│   │   └── data/policies/          ← 5 JSON policy files
│   └── tests/
├── widget/                         ← Embeddable React chat widget
├── .github/workflows/ci.yml        ← CI: lint + typecheck + tests
└── .env.example
```

---

## 🗺️ Roadmap

- [x] FastAPI skeleton + CI pipeline
- [x] 5 tool definitions
- [x] Policy JSON store
- [ ] Gemini tool use loop (Phase 2)
- [ ] Shopify Storefront API integration (Phase 2)
- [ ] SSE streaming (Phase 3)
- [ ] React chat widget (Phase 4)
- [ ] Product cards in chat (Phase 4)
- [ ] Debug panel (Phase 5)
- [ ] Tamil language testing (Phase 6)
- [ ] Deploy to Render.com + Vercel (Phase 7)

---

## 💡 What I Learned

- **Agentic AI loops:** How to implement multi-turn tool calling where the LLM decides which tools to call, executes them, and continues reasoning.
- **SSE streaming:** How to stream LLM responses chunk-by-chunk from FastAPI to a React frontend using Server-Sent Events.
- **Security in AI agents:** Why AI agents must never be trusted to invent data — always verify tool outputs and enforce guardrails like email verification for sensitive operations.
- **Shopify APIs:** GraphQL Storefront API (public) vs Admin REST API (private) — when to use which and how to keep Admin tokens secure.

---

## 👨‍💻 Author

**Obaidhur Rahaman**  
Full Stack Developer & Lead UI/UX Designer

- 🌐 [rahaman1721.framer.website](https://rahaman1721.framer.website)
- 🐙 [@rahaman1721](https://github.com/rahaman1721)
- 💼 [linkedin.com/in/obaidhur-rahaman-1721z](https://www.linkedin.com/in/obaidhur-rahaman-1721z)
- 📧 [rahaman171920@gmail.com](mailto:rahaman171920@gmail.com)

<div align="center">
  <sub>Built with precision by Obaidhur Rahaman © 2026</sub>
</div>
