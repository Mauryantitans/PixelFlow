from datetime import datetime, timedelta, timezone
from typing import Optional
import hashlib
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import logging

from ..core.config import settings
from ..core.database import get_db
from ..models.db_models import User, RefreshToken

logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer for token authentication
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    logger.debug(f"Created access token for data: {data}")
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    """Create a JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> dict:
    """Decode and verify a JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        logger.debug(f"Token decoded successfully. Payload: {payload}")
        return payload
    except JWTError as e:
        logger.error(f"JWT decode error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get the current authenticated user"""
    token = credentials.credentials
    logger.debug(f"Getting current user with token: {token[:20]}...")
    
    try:
        payload = decode_token(token)
        user_id_str = payload.get("sub")
        token_type = payload.get("type")
        
        # Convert user_id from string to int
        try:
            user_id = int(user_id_str) if user_id_str else None
        except (ValueError, TypeError):
            user_id = None
        
        logger.debug(f"Token payload - user_id: {user_id}, type: {token_type}")
        
        if user_id is None or token_type != "access":
            logger.error(f"Invalid token payload - user_id: {user_id}, type: {token_type}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except HTTPException:
        # Re-raise HTTP exceptions from decode_token
        raise
    except Exception as e:
        logger.error(f"Unexpected error validating token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        logger.error(f"User not found for id: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        logger.error(f"User {user_id} is inactive")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    logger.debug(f"Successfully authenticated user: {user.email}")
    return user

async def get_current_active_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get the current user and verify they are an admin"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authenticate a user by email and password"""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    # OAuth-only users have no password hash — reject password login attempts
    if not user.hashed_password:
        logger.warning(f"Password login attempt for OAuth-only account: {email}")
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def _hash_token(token: str) -> str:
    """SHA-256 hash a token string for safe DB storage."""
    return hashlib.sha256(token.encode()).hexdigest()


def store_refresh_token(db: Session, user_id: int, token: str) -> None:
    """Persist a hashed refresh token so it can be revoked later."""
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    db.add(RefreshToken(
        user_id=user_id,
        token_hash=_hash_token(token),
        expires_at=expire,
    ))
    db.commit()


def verify_and_rotate_refresh_token(
    db: Session, raw_token: str
) -> tuple[User, str, str]:
    """
    Validate a refresh token against the DB, then rotate it.

    Returns (user, new_access_token, new_refresh_token).
    Raises HTTP 401 on any failure so the caller can propagate it directly.
    """
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # 1. Decode the JWT (validates signature + expiry)
    try:
        payload = jwt.decode(raw_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str = payload.get("sub")
        token_type = payload.get("type")
        if not user_id_str or token_type != "refresh":
            raise credentials_error
        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise credentials_error

    # 2. Check the hash exists in DB (not revoked / not rotated away)
    token_hash = _hash_token(raw_token)
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.user_id == user_id,
    ).first()
    if not db_token:
        raise credentials_error

    # 3. Look up the user
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise credentials_error

    # 4. Rotate — delete old token, issue new pair
    db.delete(db_token)
    new_access = create_access_token(data={"sub": str(user_id)})
    new_refresh = create_refresh_token(data={"sub": str(user_id)})
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    db.add(RefreshToken(
        user_id=user_id,
        token_hash=_hash_token(new_refresh),
        expires_at=expire,
    ))
    db.commit()

    return user, new_access, new_refresh


def revoke_user_refresh_tokens(db: Session, user_id: int) -> int:
    """Delete all stored refresh tokens for a user (called on logout)."""
    deleted = db.query(RefreshToken).filter(RefreshToken.user_id == user_id).delete()
    db.commit()
    return deleted


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current user if authenticated, None if guest"""
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        payload = decode_token(token)
        user_id_str = payload.get("sub")
        token_type = payload.get("type")
        
        if not user_id_str or token_type != "access":
            return None
        
        user_id = int(user_id_str)
        user = db.query(User).filter(User.id == user_id).first()
        
        if user and user.is_active:
            return user
        return None
    except Exception as e:
        logger.debug(f"Optional auth failed (guest user): {e}")
        return None
