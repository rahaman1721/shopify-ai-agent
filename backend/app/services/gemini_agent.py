"""
Gemini 2.0 Flash Agent — Tool use loop with SSE streaming.
Handles: tool calls, response streaming, tool call logging, guardrails.
"""
import json
import time
import google.generativeai as genai

from app.core.config import settings
from app.tools.definitions import TOOL_DEFINITIONS
from app.services import shopify, policies

genai.configure(api_key=settings.gemini_api_key)

SYSTEM_PROMPT = """You are a helpful shopping assistant for this store.
You help customers find products, check orders, and understand store policies.

STRICT RULES — always follow these:
1. NEVER invent or guess prices, stock levels, or delivery dates. Always use tool results.
2. NEVER answer questions unrelated to shopping (no coding help, news, general chat).
3. For order status, ALWAYS ask for both order number AND email before calling the tool.
4. If you are unsure or cannot help, say: "Let me connect you with our support team at support@store.com"
5. Respond in the same language the customer uses (Tamil or English).
6. Keep responses friendly, concise, and helpful.
7. When showing products, always include the price and availability.
"""

# In-memory session store: session_id → list of messages
_sessions: dict[str, list[dict]] = {}


async def run_agent(session_id: str, user_message: str):
    """
    Main agent loop — yields SSE-compatible strings.
    Handles Gemini tool calling iteratively.
    """
    # Sanitize input
    user_message = user_message.strip()[:settings.max_input_chars]

    # Initialize or retrieve session
    if session_id not in _sessions:
        _sessions[session_id] = []
    history = _sessions[session_id]

    # Add user message to history
    history.append({"role": "user", "parts": [user_message]})

    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash",
        system_instruction=SYSTEM_PROMPT,
        tools=_build_gemini_tools(),
    )

    tool_call_count = 0

    # Agentic loop: Gemini may call tools multiple times
    while tool_call_count <= settings.max_tool_calls_per_turn:
        response = model.generate_content(
            contents=history,
            generation_config={"temperature": 0.3},
        )

        candidate = response.candidates[0]
        content = candidate.content

        # Check if Gemini wants to call tools
        tool_calls = [
            part for part in content.parts if hasattr(part, "function_call") and part.function_call.name
        ]

        if tool_calls:
            # Execute all tool calls
            tool_results = []
            for part in tool_calls:
                fc = part.function_call
                tool_name = fc.name
                tool_args = dict(fc.args)

                start_ms = int(time.time() * 1000)
                tool_output = await _execute_tool(tool_name, tool_args)
                duration_ms = int(time.time() * 1000) - start_ms

                tool_call_count += 1

                # Stream tool call log to frontend debug panel
                log_event = {
                    "type": "tool_log",
                    "data": {
                        "tool_name": tool_name,
                        "input": tool_args,
                        "output": str(tool_output)[:300],
                        "duration_ms": duration_ms,
                    },
                }
                yield f"data: {json.dumps(log_event)}\n\n"

                # If tool returned products, also send product cards
                if tool_name in ("search_products", "recommend_products") and isinstance(tool_output, list):
                    for product in tool_output[:5]:
                        card_event = {"type": "product_card", "data": product}
                        yield f"data: {json.dumps(card_event)}\n\n"

                tool_results.append(
                    genai.protos.Part(
                        function_response=genai.protos.FunctionResponse(
                            name=tool_name,
                            response={"result": json.dumps(tool_output, ensure_ascii=False)},
                        )
                    )
                )

            # Add Gemini's tool call + results to history
            history.append({"role": "model", "parts": content.parts})
            history.append({"role": "user", "parts": tool_results})
            # Continue the loop — Gemini will now respond with final answer

        else:
            # Gemini gave a text response — stream it
            full_text = ""
            for part in content.parts:
                if hasattr(part, "text") and part.text:
                    full_text += part.text
                    text_event = {"type": "text", "content": part.text}
                    yield f"data: {json.dumps(text_event)}\n\n"

            # Add assistant response to history
            history.append({"role": "model", "parts": [full_text]})

            # Keep session history manageable (last 20 turns)
            if len(history) > 40:
                _sessions[session_id] = history[-40:]

            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return

    # Safety: max tool calls exceeded
    yield f"data: {json.dumps({'type': 'text', 'content': 'I am having trouble processing your request. Please try again or contact support@store.com'})}\n\n"
    yield f"data: {json.dumps({'type': 'done'})}\n\n"


async def _execute_tool(name: str, args: dict) -> dict | list | str:
    """Route tool calls to the correct service function."""
    match name:
        case "search_products":
            return await shopify.search_products(
                query=args["query"],
                max_results=min(int(args.get("max_results", 5)), 10),
            )
        case "get_product_details":
            result = await shopify.get_product_details(handle=args["handle"])
            return result or {"error": "Product not found"}
        case "check_order_status":
            return await shopify.check_order_status(
                order_number=args["order_number"],
                email=args["email"],
            )
        case "get_store_policy":
            return policies.get_store_policy(topic=args["topic"])
        case "recommend_products":
            # Reuse search with the product title as query (simple recommendation)
            handle = args["product_handle"]
            details = await shopify.get_product_details(handle=handle)
            if details:
                query = details["title"].split()[0]  # First word of title
                results = await shopify.search_products(query=query, max_results=4)
                return [p for p in results if p["handle"] != handle]
            return []
        case _:
            return {"error": f"Unknown tool: {name}"}


def _build_gemini_tools():
    """Convert our tool definitions to Gemini FunctionDeclaration format."""
    declarations = []
    for tool in TOOL_DEFINITIONS:
        declarations.append(
            genai.protos.FunctionDeclaration(
                name=tool["name"],
                description=tool["description"],
                parameters=genai.protos.Schema(
                    type=genai.protos.Type.OBJECT,
                    properties={
                        k: genai.protos.Schema(
                            type=genai.protos.Type.STRING
                            if v.get("type") == "string"
                            else genai.protos.Type.INTEGER,
                            description=v.get("description", ""),
                            enum=v.get("enum", []),
                        )
                        for k, v in tool["parameters"]["properties"].items()
                    },
                    required=tool["parameters"].get("required", []),
                ),
            )
        )
    return [genai.protos.Tool(function_declarations=declarations)]
