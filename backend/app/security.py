import os
import logging
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Validate Supabase JWT and return the decoded payload.
    The payload contains 'sub' (user UUID) among other Supabase claims.
    """
    token = credentials.credentials
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET")

    if not jwt_secret:
        logger.error("SUPABASE_JWT_SECRET is not set — cannot validate tokens")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server authentication is misconfigured.",
        )

    try:
        # Supabase JWT secrets are base64-encoded in the dashboard but GoTrue signs
        # tokens with the decoded bytes. Try decoded bytes first, fall back to raw string.
        import base64 as _b64
        try:
            secret_bytes = _b64.b64decode(jwt_secret + "==")  # pad in case of missing =
        except Exception:
            secret_bytes = jwt_secret.encode()

        # First attempt: decoded bytes (correct for most Supabase projects)
        decode_errors = []
        for key in (secret_bytes, jwt_secret):
            try:
                payload = jwt.decode(
                    token,
                    key,
                    algorithms=["HS256"],
                    audience="authenticated",
                )
                return payload
            except jwt.ExpiredSignatureError:
                raise  # re-raise immediately — no point trying the other key
            except jwt.InvalidTokenError as e:
                decode_errors.append(str(e))

        # Both keys failed
        logger.warning("JWT decode failed with both key forms: %s", decode_errors)
        raise jwt.InvalidTokenError("Invalid token")

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired — please log in again.",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed.",
        )


def get_user_id(current_user: dict = Depends(get_current_user)) -> str:
    """Convenience dependency — returns just the user UUID string."""
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed.",
        )
    return user_id