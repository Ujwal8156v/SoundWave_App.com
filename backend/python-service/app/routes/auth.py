from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
import jwt
from datetime import datetime, timedelta
import bcrypt
from app.core.config import settings
from app.core.logger import log_info, log_error

router = APIRouter()

# Pydantic models
class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str
    firstName: str = None
    lastName: str = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# Mock user store (in production, use database)
users_db = {}
user_counter = 1

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: int, email: str, username: str) -> str:
    """Create JWT token"""
    payload = {
        'id': user_id,
        'email': email,
        'username': username,
        'exp': datetime.utcnow() + timedelta(days=7),
        'iat': datetime.utcnow()
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return token

@router.post("/register")
async def register(user: UserRegister):
    """Register new user"""
    global user_counter
    
    try:
        # Check if user already exists
        if any(u['email'] == user.email for u in users_db.values()):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User already exists"
            )
        
        # Create new user
        user_id = user_counter
        user_counter += 1
        
        new_user = {
            'id': user_id,
            'email': user.email,
            'username': user.username,
            'firstName': user.firstName,
            'lastName': user.lastName,
            'password': hash_password(user.password),
            'createdAt': datetime.utcnow().isoformat()
        }
        
        users_db[user_id] = new_user
        
        # Create token
        token = create_token(user_id, user.email, user.username)
        
        log_info(f"User registered: {user.email}")
        
        return {
            'success': True,
            'data': {
                'id': user_id,
                'email': user.email,
                'username': user.username,
                'firstName': user.firstName,
                'lastName': user.lastName
            },
            'token': token
        }
    except HTTPException:
        raise
    except Exception as e:
        log_error("Registration error", exc=e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )

@router.post("/login")
async def login(credentials: UserLogin):
    """Login user"""
    try:
        # Find user
        user = next((u for u in users_db.values() if u['email'] == credentials.email), None)
        
        if not user or not verify_password(credentials.password, user['password']):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Create token
        token = create_token(user['id'], user['email'], user['username'])
        
        log_info(f"User logged in: {credentials.email}")
        
        return {
            'success': True,
            'data': {
                'id': user['id'],
                'email': user['email'],
                'username': user['username'],
                'firstName': user['firstName'],
                'lastName': user['lastName']
            },
            'token': token
        }
    except HTTPException:
        raise
    except Exception as e:
        log_error("Login error", exc=e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

@router.post("/refresh")
async def refresh_token(token: str):
    """Refresh JWT token"""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get('id')
        email = payload.get('email')
        username = payload.get('username')
        
        new_token = create_token(user_id, email, username)
        
        return {
            'success': True,
            'token': new_token
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
