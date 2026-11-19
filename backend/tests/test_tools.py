"""
Tests for Shopify AI Agent tools and routes.
Run: pytest tests/ -v
"""
import pytest
from app.services.policies import get_store_policy


def test_get_policy_shipping():
    result = get_store_policy("shipping")
    assert isinstance(result, str)
    assert len(result) > 20
    assert "shipping" in result.lower() or "delivery" in result.lower()


def test_get_policy_returns():
    result = get_store_policy("returns")
    assert isinstance(result, str)
    assert "return" in result.lower()


def test_get_policy_invalid_topic():
    result = get_store_policy("invalid_topic")
    assert "not found" in result.lower() or "unavailable" in result.lower()


def test_get_policy_refunds():
    result = get_store_policy("refunds")
    assert "refund" in result.lower()


def test_get_policy_warranty():
    result = get_store_policy("warranty")
    assert "warranty" in result.lower()
