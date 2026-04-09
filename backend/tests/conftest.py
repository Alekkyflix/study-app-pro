"""Test configuration"""
import pytest


@pytest.fixture
def sample_lecture():
    """Sample lecture data for tests"""
    return {
        "title": "Test Lecture",
        "discipline": "Science",
        "description": "Test description"
    }


@pytest.fixture
def sample_audio():
    """Sample audio data"""
    return b"fake audio data"
