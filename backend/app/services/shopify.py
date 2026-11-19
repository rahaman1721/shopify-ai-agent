"""
Shopify API service — GraphQL Storefront + REST Admin API calls.
No API keys are ever returned to the frontend or Gemini.
"""
import httpx
from app.core.config import settings


STOREFRONT_URL = f"https://{settings.shopify_store_domain}/api/2024-10/graphql.json"
ADMIN_URL = f"https://{settings.shopify_store_domain}/admin/api/2024-10"


async def search_products(query: str, max_results: int = 5) -> list[dict]:
    """Search products via Shopify Storefront GraphQL API."""
    gql = """
    query SearchProducts($query: String!, $first: Int!) {
      products(query: $query, first: $first) {
        edges {
          node {
            id
            title
            handle
            availableForSale
            priceRange {
              minVariantPrice { amount currencyCode }
              maxVariantPrice { amount currencyCode }
            }
            featuredImage { url altText }
            onlineStoreUrl
          }
        }
      }
    }
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            STOREFRONT_URL,
            json={"query": gql, "variables": {"query": query, "first": max_results}},
            headers={
                "X-Shopify-Storefront-Access-Token": settings.shopify_storefront_access_token,
                "Content-Type": "application/json",
            },
            timeout=10.0,
        )
        data = response.json()

    products = []
    for edge in data.get("data", {}).get("products", {}).get("edges", []):
        node = edge["node"]
        min_price = node["priceRange"]["minVariantPrice"]
        max_price = node["priceRange"]["maxVariantPrice"]
        price_str = (
            f"₹{float(min_price['amount']):.0f}"
            if min_price["amount"] == max_price["amount"]
            else f"₹{float(min_price['amount']):.0f} – ₹{float(max_price['amount']):.0f}"
        )
        products.append({
            "title": node["title"],
            "handle": node["handle"],
            "price": price_str,
            "availability": "In Stock" if node["availableForSale"] else "Out of Stock",
            "url": f"https://{settings.shopify_store_domain}/products/{node['handle']}",
            "image_url": node["featuredImage"]["url"] if node["featuredImage"] else None,
        })
    return products


async def get_product_details(handle: str) -> dict | None:
    """Get full product details via Shopify Storefront GraphQL API."""
    gql = """
    query GetProduct($handle: String!) {
      product(handle: $handle) {
        title
        description
        handle
        variants(first: 20) {
          edges {
            node {
              title
              price { amount currencyCode }
              availableForSale
              selectedOptions { name value }
            }
          }
        }
        images(first: 5) {
          edges { node { url altText } }
        }
      }
    }
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            STOREFRONT_URL,
            json={"query": gql, "variables": {"handle": handle}},
            headers={
                "X-Shopify-Storefront-Access-Token": settings.shopify_storefront_access_token,
                "Content-Type": "application/json",
            },
            timeout=10.0,
        )
        data = response.json()

    product = data.get("data", {}).get("product")
    if not product:
        return None

    variants = [
        {
            "name": v["node"]["title"],
            "price": f"₹{float(v['node']['price']['amount']):.0f}",
            "in_stock": v["node"]["availableForSale"],
            "options": {o["name"]: o["value"] for o in v["node"]["selectedOptions"]},
        }
        for v in product["variants"]["edges"]
    ]
    return {
        "title": product["title"],
        "description": product["description"][:500],
        "handle": product["handle"],
        "variants": variants,
        "url": f"https://{settings.shopify_store_domain}/products/{handle}",
    }


async def check_order_status(order_number: str, email: str) -> dict:
    """
    Check order status via Shopify Admin API.
    SECURITY: Verifies email matches order before returning any data.
    """
    # Clean order number (remove # prefix if present)
    order_num = order_number.lstrip("#")

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{ADMIN_URL}/orders.json?name=%23{order_num}&status=any",
            headers={
                "X-Shopify-Access-Token": settings.shopify_admin_api_key,
                "Content-Type": "application/json",
            },
            timeout=10.0,
        )
        data = response.json()

    orders = data.get("orders", [])
    if not orders:
        return {"found": False, "message": "Order not found. Please check your order number."}

    order = orders[0]

    # SECURITY: verify email matches before returning any data
    if order.get("email", "").lower() != email.lower():
        return {"found": False, "message": "Order not found. Please check your order number and email."}

    return {
        "found": True,
        "order_number": f"#{order['order_number']}",
        "status": order.get("fulfillment_status") or "Processing",
        "financial_status": order.get("financial_status", ""),
        "total_price": f"₹{float(order.get('total_price', 0)):.0f}",
        "created_at": order.get("created_at", "")[:10],
        "line_items": [
            {"title": item["title"], "quantity": item["quantity"]}
            for item in order.get("line_items", [])[:3]
        ],
    }
