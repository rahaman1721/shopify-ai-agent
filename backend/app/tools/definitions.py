"""
5 Tool definitions for the Shopify AI Agent.
Each tool is called by Gemini and executed by FastAPI.
"""

TOOL_DEFINITIONS = [
    {
        "name": "search_products",
        "description": (
            "Search for products in the store by name, category, or keyword. "
            "Use when the customer asks to find, browse, or look for products."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search keyword e.g. 'blue pegboard', 'storage shelf under 2000'",
                },
                "max_results": {
                    "type": "integer",
                    "description": "Number of results to return (default: 5, max: 10)",
                    "default": 5,
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "get_product_details",
        "description": (
            "Get complete details of a specific product including all variants, "
            "sizes, colors, and stock. Use when the customer asks about a specific product."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "handle": {
                    "type": "string",
                    "description": "Shopify product handle (URL slug) e.g. 'tulai-pegboard-set'",
                }
            },
            "required": ["handle"],
        },
    },
    {
        "name": "check_order_status",
        "description": (
            "Check a customer's order status. "
            "ALWAYS collect both order_number AND email from the customer before calling this tool. "
            "Never call this tool without both values."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "order_number": {
                    "type": "string",
                    "description": "Order number e.g. '1234' or '#1234'",
                },
                "email": {
                    "type": "string",
                    "description": "Customer email address used when placing the order",
                },
            },
            "required": ["order_number", "email"],
        },
    },
    {
        "name": "get_store_policy",
        "description": "Get store policies on shipping, returns, refunds, exchanges, or warranty.",
        "parameters": {
            "type": "object",
            "properties": {
                "topic": {
                    "type": "string",
                    "enum": ["shipping", "returns", "refunds", "exchanges", "warranty"],
                    "description": "Policy topic to retrieve",
                }
            },
            "required": ["topic"],
        },
    },
    {
        "name": "recommend_products",
        "description": "Get similar or complementary products to a given product.",
        "parameters": {
            "type": "object",
            "properties": {
                "product_handle": {
                    "type": "string",
                    "description": "Handle of the reference product",
                },
                "recommendation_type": {
                    "type": "string",
                    "enum": ["similar", "complementary"],
                    "description": "similar = same category, complementary = goes well with",
                },
            },
            "required": ["product_handle"],
        },
    },
]
