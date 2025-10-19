from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.db_models import LoginAttempt
from app.core.security_config import LoginSecurity, SecurityLogging
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Import settings from centralized security config
MAX_LOGIN_ATTEMPTS = LoginSecurity.MAX_ATTEMPTS
LOCKOUT_DURATION = LoginSecurity.LOCKOUT_DURATION


def check_login_attempts(db: Session, email: str, ip_address: Optional[str] = None) -> dict:
    """
    Check if user is locked out due to too many failed attempts
    
    Returns:
        dict with keys: 'allowed' (bool), 'attempts_remaining' (int), 'locked_until' (datetime or None)
    """
    cutoff_time = datetime.utcnow() - LOCKOUT_DURATION
    
    # Count recent failed attempts
    recent_attempts = db.query(LoginAttempt).filter(
        LoginAttempt.email == email,
        LoginAttempt.success == False,
        LoginAttempt.attempt_time > cutoff_time
    ).count()
    
    if recent_attempts >= MAX_LOGIN_ATTEMPTS:
        # User is locked out
        last_attempt = db.query(LoginAttempt).filter(
            LoginAttempt.email == email,
            LoginAttempt.success == False
        ).order_by(LoginAttempt.attempt_time.desc()).first()
        
        locked_until = last_attempt.attempt_time + LOCKOUT_DURATION
        
        logger.warning(f"Login blocked for {email} - too many failed attempts from IP: {ip_address}")
        
        return {
            'allowed': False,
            'attempts_remaining': 0,
            'locked_until': locked_until
        }
    
    return {
        'allowed': True,
        'attempts_remaining': MAX_LOGIN_ATTEMPTS - recent_attempts,
        'locked_until': None
    }


def log_login_attempt(
    db: Session, 
    email: str, 
    success: bool,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    failure_reason: Optional[str] = None
):
    """Log a login attempt for security tracking"""
    # Only log if enabled in config
    if not SecurityLogging.LOG_AUTH_ATTEMPTS and success:
        return
    if not SecurityLogging.LOG_FAILED_AUTH and not success:
        return
    
    # Respect privacy settings from config
    log_ip = ip_address if SecurityLogging.LOG_IP_ADDRESSES else None
    log_ua = user_agent if SecurityLogging.LOG_USER_AGENTS else None
    
    attempt = LoginAttempt(
        email=email,
        ip_address=log_ip,
        user_agent=log_ua,
        success=success,
        failure_reason=failure_reason
    )
    
    db.add(attempt)
    db.commit()
    
    if not success:
        logger.warning(f"Failed login attempt for {email} from IP: {log_ip}. Reason: {failure_reason}")
    else:
        logger.info(f"Successful login for {email} from IP: {log_ip}")


def clear_login_attempts(db: Session, email: str):
    """Clear failed login attempts after successful login"""
    db.query(LoginAttempt).filter(
        LoginAttempt.email == email,
        LoginAttempt.success == False
    ).delete()
    db.commit()
