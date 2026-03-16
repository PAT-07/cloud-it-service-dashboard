# backend/lambda-api/tests/test_tickets.py
# --------------------------------------------------
# Basic unit tests for ticket endpoints.
# Uses pytest + httpx async client (TestClient).
# Run with:  pytest tests/ -v
# --------------------------------------------------
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# Patch DB before importing app
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_login_invalid_credentials():
    response = client.post("/auth/login", json={
        "email": "nobody@example.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401


def test_get_tickets_unauthenticated():
    """Accessing /tickets without a token should return 401."""
    response = client.get("/tickets/")
    assert response.status_code == 401


def test_create_ticket_unauthenticated():
    """Creating a ticket without a token should return 401."""
    response = client.post("/tickets/", json={
        "title": "Test ticket",
        "description": "Something broke",
        "category": "hardware",
        "priority": "high",
    })
    assert response.status_code == 401


def test_analytics_unauthenticated():
    """Analytics endpoint requires admin token."""
    response = client.get("/analytics/")
    assert response.status_code == 401


def test_invalid_category_validation():
    """Pydantic schema should reject invalid category values."""
    from schemas import TicketCreate
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        TicketCreate(
            title="Test",
            description="Test",
            category="invalid_category",
            priority="medium",
        )


def test_invalid_priority_validation():
    """Pydantic schema should reject invalid priority values."""
    from schemas import TicketCreate
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        TicketCreate(
            title="Test",
            description="Test",
            category="hardware",
            priority="super_urgent",
        )
