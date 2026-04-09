# Backend tests
"""Test suite for Study Pro backend"""

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def test_client():
    """Create test client"""
    from app.main import app
    return TestClient(app)


def test_health_check(test_client):
    """Test health endpoint"""
    response = test_client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_root_endpoint(test_client):
    """Test root endpoint"""
    response = test_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "version" in data
    assert "message" in data
