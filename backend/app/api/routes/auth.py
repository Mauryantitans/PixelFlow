from fastapi import APIRouter, Depends, HTTPException, status, Header, Request, Form
from sqlalchemy.orm import Session
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

from ...core.database import get_db
from ...core.config import settings
from ...models.db_models import User
from ...models.schemas import (
    UserCreate, UserResponse, UserUpdate,
    LoginRequest, Token
)
from ...utils.auth import (
    get_password_hash, authenticate_user,
    create_access_token, create_refresh_token,
    get_current_user, get_current_active_admin
)
from ...utils.security import (
    check_login_attempts, log_login_attempt, clear_login_attempts
)

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        hashed_password=hashed_password
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.post("/login", response_model=Token)
async def login(
    request: Request,
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """Login and get access token with security tracking"""
    
    # Get client IP and user agent
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    
    # Check if user is locked out
    lockout_status = check_login_attempts(db, login_data.email, ip_address)
    
    if not lockout_status['allowed']:
        log_login_attempt(
            db, 
            login_data.email, 
            False,
            ip_address,
            user_agent,
            "Account locked due to too many failed attempts"
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Account locked until {lockout_status['locked_until'].strftime('%Y-%m-%d %H:%M:%S UTC')}"
        )
    
    # Authenticate user
    user = authenticate_user(db, login_data.email, login_data.password)
    
    if not user:
        log_login_attempt(
            db,
            login_data.email,
            False,
            ip_address,
            user_agent,
            "Invalid credentials"
        )
        
        remaining = lockout_status['attempts_remaining'] - 1
        if remaining > 0:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid credentials. {remaining} attempt(s) remaining before account lockout.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials. Account will be locked for 15 minutes after this attempt.",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    if not user.is_active:
        log_login_attempt(
            db,
            login_data.email,
            False,
            ip_address,
            user_agent,
            "Account inactive"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Successful login - clear failed attempts
    clear_login_attempts(db, login_data.email)
    log_login_attempt(db, user.email, True, ip_address, user_agent)
    
    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user information"""
    # Check if email is being changed and is already taken
    if user_update.email and user_update.email != current_user.email:
        existing_user = db.query(User).filter(User.email == user_update.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        current_user.email = user_update.email
    
    # Check if username is being changed and is already taken
    if user_update.username and user_update.username != current_user.username:
        existing_user = db.query(User).filter(User.username == user_update.username).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        current_user.username = user_update.username
    
    # Update other fields
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    
    if user_update.password:
        current_user.hashed_password = get_password_hash(user_update.password)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_current_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete current user account"""
    db.delete(current_user)
    db.commit()
    return None


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
    session_id: str = Form(...),
    db: Session = Depends(get_db)
):
    """Logout and cleanup user data (except saved pipelines)"""
    from ...models.db_models import Session as DBSession, UploadedImage, ProcessedImage
    from ...core.business_rules import CleanupTriggers
    
    logger.info(f"User logout: {current_user.email}")
    
    # Get cleanup policy
    policy = CleanupTriggers.ON_LOGOUT
    
    items_deleted = {
        "sessions": 0,
        "uploads": 0,
        "processed": 0
    }
    
    # Delete session if configured
    if policy.get('delete_session'):
        session = db.query(DBSession).filter(DBSession.id == session_id).first()
        if session:
            db.delete(session)  # Cascades to images
            items_deleted["sessions"] = 1
            logger.info(f"Deleted session: {session_id}")
    
    # Delete uploads if configured (and session not deleted, to avoid cascade conflict)
    if policy.get('delete_uploads') and not policy.get('delete_session'):
        uploads = db.query(UploadedImage).filter(
            UploadedImage.session_id == session_id
        ).all()
        for upload in uploads:
            db.delete(upload)
            items_deleted["uploads"] += 1
    
    # Delete processed images if configured (and session not deleted)
    if policy.get('delete_processed') and not policy.get('delete_session'):
        processed = db.query(ProcessedImage).filter(
            ProcessedImage.session_id == session_id
        ).all()
        for proc in processed:
            db.delete(proc)
            items_deleted["processed"] += 1
    
    db.commit()
    
    logger.info(
        f"Logout cleanup complete for {current_user.email}: "
        f"Sessions: {items_deleted['sessions']}, "
        f"Uploads: {items_deleted['uploads']}, "
        f"Processed: {items_deleted['processed']}"
    )
    
    return {
        "success": True,
        "message": "Logged out successfully",
        "cleaned_up": items_deleted,
        "pipelines_kept": True
    }

# DEBUG ENDPOINTS
from fastapi import Header
from ...utils.auth import decode_token
import logging

logger = logging.getLogger(__name__)

@router.get("/debug/token")
async def debug_token(authorization: str = Header(None)):
    """Debug endpoint to check token format"""
    if not authorization:
        return {"error": "No Authorization header"}
    
    logger.info(f"Authorization header: {authorization}")
    
    # Check if it starts with Bearer
    if not authorization.startswith("Bearer "):
        return {
            "error": "Authorization header doesn't start with 'Bearer '",
            "received": authorization[:50]
        }
    
    # Extract token
    token = authorization.replace("Bearer ", "")
    logger.info(f"Token extracted: {token[:50]}...")
    
    try:
        payload = decode_token(token)
        return {
            "success": True,
            "token_length": len(token),
            "payload": payload,
            "user_id": payload.get("sub"),
            "token_type": payload.get("type")
        }
    except Exception as e:
        logger.error(f"Token decode error: {e}")
        return {
            "error": str(e),
            "token_preview": token[:50]
        }

@router.get("/me-simple", response_model=UserResponse)
async def get_current_user_simple(authorization: str = Header(None), db: Session = Depends(get_db)):
    """Alternative /me endpoint using simple header (for debugging)"""
    logger.info(f"me-simple called with authorization: {authorization[:50] if authorization else 'None'}...")
    
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No Authorization header"
        )
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format"
        )
    
    token = authorization.replace("Bearer ", "")
    
    try:
        payload = decode_token(token)
        user_id_str = payload.get("sub")
        token_type = payload.get("type")
        
        # Convert user_id from string to int
        try:
            user_id = int(user_id_str) if user_id_str else None
        except (ValueError, TypeError):
            user_id = None
        
        logger.info(f"Token decoded - user_id: {user_id}, type: {token_type}")
        
        if not user_id or token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inactive user"
            )
        
        logger.info(f"User authenticated: {user.email}")
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in me-simple: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

@router.get("/debug/pipelines")
async def debug_user_pipelines(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Debug endpoint to see raw pipeline data from database"""
    from ...models.db_models import SavedPipeline
    
    pipelines = db.query(SavedPipeline).filter(SavedPipeline.user_id == current_user.id).all()
    
    return {
        "user_id": current_user.id,
        "pipeline_count": len(pipelines),
        "pipelines": [
            {
                "id": p.id,
                "name": p.name,
                "pipeline_data": p.pipeline_data,
                "pipeline_data_type": str(type(p.pipeline_data)),
                "is_array": isinstance(p.pipeline_data, list)
            }
            for p in pipelines
        ]
    }
