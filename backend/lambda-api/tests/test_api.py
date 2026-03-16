"""
Backend Tests
Unit and integration tests for the IT Service Dashboard API.
Run with: pytest tests/ -v
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from database import get_db, Base
from models import User, UserRole
from auth_utils import hash_password

# ----------------------------
# Test Database Setup (SQLite in-memory)
# ----------------------------
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"

engine_test = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)

Base.metadata.create_all(bind=engine_test)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


# ----------------------------
# Fixtures
# ----------------------------

@pytest.fixture(autouse=True)
def reset_db():
    """Clear all tables before each test."""
    Base.metadata.drop_all(bind=engine_test)
    Base.metadata.create_all(bind=engine_test)


@pytest.fixture
def employee_token():
    """Create an employee user and return their auth token."""
    db = TestingSessionLocal()
    user = User(
        name="John Employee",
        email="employee@test.com",
        role=UserRole.employee,
        password=hash_password("password123"),
    )
    db.add(user)
    db.commit()
    db.close()

    response = client.post("/auth/login", json={
        "email": "employee@test.com",
        "password": "password123"
    })
    return response.json()["access_token"]


@pytest.fixture
def admin_token():
    """Create an admin user and return their auth token."""
    db = TestingSessionLocal()
    user = User(
        name="Admin User",
        email="admin@test.com",
        role=UserRole.admin,
        password=hash_password("adminpass123"),
    )
    db.add(user)
    db.commit()
    db.close()

    response = client.post("/auth/login", json={
        "email": "admin@test.com",
        "password": "adminpass123"
    })
    return response.json()["access_token"]


# ----------------------------
# Auth Tests
# ----------------------------

def test_register_user():
    response = client.post("/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "securepass123",
        "role": "employee"
    })
    assert response.status_code == 201
    assert response.json()["email"] == "test@example.com"


def test_login_success(employee_token):
    assert employee_token is not None
    assert len(employee_token) > 0


def test_login_invalid_password():
    response = client.post("/auth/login", json={
        "email": "nobody@test.com",
        "password": "wrongpass"
    })
    assert response.status_code == 401


# ----------------------------
# Ticket Tests
# ----------------------------

def test_create_ticket(employee_token):
    response = client.post(
        "/tickets/",
        json={
            "category": "software",
            "priority": "high",
            "title": "Cannot open Excel",
            "description": "Excel crashes on startup since the last Windows update."
        },
        headers={"Authorization": f"Bearer {employee_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "open"
    assert data["category"] == "software"


def test_list_tickets_employee_sees_only_own(employee_token, admin_token):
    # Employee submits a ticket
    client.post("/tickets/", json={
        "category": "hardware", "priority": "low",
        "title": "Broken keyboard", "description": "Keys are stuck."
    }, headers={"Authorization": f"Bearer {employee_token}"})

    # Employee should see 1 ticket
    response = client.get("/tickets/", headers={"Authorization": f"Bearer {employee_token}"})
    assert response.status_code == 200
    assert response.json()["total"] == 1


def test_admin_can_update_ticket(employee_token, admin_token):
    # Employee creates ticket
    create_resp = client.post("/tickets/", json={
        "category": "network", "priority": "critical",
        "title": "No internet", "description": "Cannot access any websites."
    }, headers={"Authorization": f"Bearer {employee_token}"})
    ticket_id = create_resp.json()["id"]

    # Admin updates it
    update_resp = client.put(
        f"/tickets/{ticket_id}",
        json={"status": "in_progress"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "in_progress"


def test_employee_cannot_update_ticket(employee_token):
    create_resp = client.post("/tickets/", json={
        "category": "software", "priority": "medium",
        "title": "Test ticket", "description": "Testing permissions."
    }, headers={"Authorization": f"Bearer {employee_token}"})
    ticket_id = create_resp.json()["id"]

    update_resp = client.put(
        f"/tickets/{ticket_id}",
        json={"status": "resolved"},
        headers={"Authorization": f"Bearer {employee_token}"}
    )
    assert update_resp.status_code == 403
