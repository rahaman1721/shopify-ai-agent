"""
Store policy loader — reads from JSON files in data/policies/
No LLM hallucination risk: answers come directly from your own policy text.
"""
import json
from pathlib import Path

POLICIES_DIR = Path(__file__).parent.parent / "data" / "policies"

POLICY_TOPICS = ["shipping", "returns", "refunds", "exchanges", "warranty"]


def get_store_policy(topic: str) -> str:
    """Load policy text from JSON file."""
    if topic not in POLICY_TOPICS:
        return f"Policy for '{topic}' not found. Available topics: {', '.join(POLICY_TOPICS)}"

    policy_file = POLICIES_DIR / f"{topic}.json"
    if not policy_file.exists():
        return f"Policy information for '{topic}' is currently unavailable. Please contact support."

    data = json.loads(policy_file.read_text(encoding="utf-8"))
    return data.get("content", "Policy content not available.")
