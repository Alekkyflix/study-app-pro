"""
JWT verification via Supabase Auth API.

Instead of verifying the JWT locally (which requires getting the secret format
exactly right), we ask Supabase's own /auth/v1/user endpoint to validate the
token. This is 100% reliable regardless of how the secret is stored.

Trade-off: one extra HTTP round-trip per request (~50–100 ms). For a student
app this is acceptable; if you need sub-ms auth switch back to local JWT verify
once the secret format is confirmed.
"""
import os
import logging
import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)
security = HTTPBearer()

# Cache the Supabase URL so we're not hitting os.getenv on every request
_SUPABASE_URL = ""
_SUPABASE_ANON_KEY = ""


def _get_supabase_config() -> tuple[str, str]:
    global _SUPABASE_URL, _SUPABASE_ANON_KEY
    if not _SUPABASE_URL:
        _SUPABASE_URL = os.getenv("SUPABASE_URL", "")
        _SUPABASE_ANON_KEY = os.getenv("SUPABASE_KEY", "") or os.getenv("SUPABASE_ANON_KEY", "")
    return _SUPABASE_URL, _SUPABASE_ANON_KEY


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Validate a Supabase JWT by calling the Supabase Auth /user endpoint.
    Returns the user object dict on success.
    """
    token = credentials.credentials
    supabase_url, anon_key = _get_supabase_config()

    if not supabase_url:
        logger.error("SUPABASE_URL is not set")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server authentication is misconfigured.",
        )

    try:
        resp = httpx.get(
            f"{supabase_url}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": anon_key,
            },
            timeout=10.0,
        )
    except httpx.RequestError as exc:
        logger.error("Supabase auth request failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable. Please try again.",
        )

    if resp.status_code in (401, 403):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired — please log in again.",
        )

    if resp.status_code != 200:
        logger.warning("Supabase auth returned %s: %s", resp.status_code, resp.text[:200])
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed.",
        )

    user_data = resp.json()
    # Normalise to look like a JWT payload so the rest of the code is unchanged
    return {
        "sub": user_data.get("id"),
        "email": user_data.get("email"),
        "role": user_data.get("role", "authenticated"),
    }


def get_user_id(current_user: dict = Depends(get_current_user)) -> str:
    """Convenience dependency — returns just the user UUID string."""
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed.",
        )
    return user_id