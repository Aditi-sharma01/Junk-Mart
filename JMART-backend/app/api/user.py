from fastapi import APIRouter, Depends, Body, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.schemas import UserCreate, UserLogin, UserResponse, SendOTPRequest, VerifyOTPRequest
from app.models.user import User
from app.auth import get_password_hash, verify_password, create_access_token
from app.otp import generate_otp, store_otp, verify_otp, send_otp_email
from datetime import timedelta
from app.models.transaction import Transaction
from typing import List
from datetime import datetime
from fastapi import Query

router = APIRouter()

TOKEN_PRICE = 10  # ₹10 per token
SELL_FEE = 0.04    # 4% fee

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class BuyTokensRequest(BaseModel):
    user_id: int
    rupees: float

class SellTokensRequest(BaseModel):
    user_id: int
    tokens: int

@router.post("/auth/send-otp")
def send_otp(request: SendOTPRequest):
    """Send OTP to user's email for verification"""
    try:
        # Check if user already exists
        db = SessionLocal()
        existing_user = db.query(User).filter(User.email == request.email).first()
        db.close()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        
        # Generate and store OTP
        otp = generate_otp()
        store_otp(request.email, otp)
        
        # Send OTP via email
        if send_otp_email(request.email, otp, request.username):
            return {"message": "OTP sent successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send OTP email"
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in send_otp: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.post("/auth/verify-otp")
def verify_otp_endpoint(request: VerifyOTPRequest):
    """Verify OTP code"""
    if verify_otp(request.email, request.otp):
        return {"message": "OTP verified successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP"
        )

@router.post("/auth/signup", response_model=UserResponse)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == user.email) | (User.username == user.username)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or username already exists"
        )
    
    # Hash the password
    hashed_password = get_password_hash(user.password)
    
    # Create new user
    db_user = User(
        username=user.username, 
        email=user.email, 
        password=hashed_password,
        level=user.level
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return UserResponse(
        id=db_user.id,
        username=db_user.username,
        email=db_user.email,
        level=db_user.level,
        tokens=db_user.tokens
    )

@router.post("/auth/login")
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    # Find user by email
    user = db.query(User).filter(User.email == user_credentials.email).first()
    
    if not user or not verify_password(user_credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            level=user.level,
            tokens=user.tokens
        )
    }

@router.post("/users/create")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # Hash the password
    hashed_password = get_password_hash(user.password)
    
    db_user = User(
        username=user.username, 
        email=user.email, 
        password=hashed_password,
        level=user.level
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"msg": "User created", "id": db_user.id}

@router.post("/buy-tokens")
def buy_tokens(data: BuyTokensRequest, db: Session = Depends(get_db)):
    tokens_to_add = float(data.rupees) / TOKEN_PRICE
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        return {"error": "User not found"}
    user.tokens += tokens_to_add
    db.commit()
    return {"tokens_added": tokens_to_add, "new_balance": user.tokens, "cost": tokens_to_add * TOKEN_PRICE}

@router.post("/sell-tokens")
def sell_tokens(data: SellTokensRequest, db: Session = Depends(get_db)):
    tokens = float(data.tokens)
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        return {"error": "User not found"}
    if user.tokens < tokens:
        return {"error": "Not enough tokens"}
    payout = tokens * TOKEN_PRICE * (1 - SELL_FEE)
    user.tokens -= tokens
    db.commit()
    return {"tokens_sold": tokens, "payout": payout, "new_balance": user.tokens}

@router.get("/token-balance")
def token_balance(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": "User not found"}
    return {"token_balance": user.tokens} 

@router.get("/transaction-history")
def transaction_history(user_id: int, db: Session = Depends(get_db)):
    # Fetch transactions where the user is buyer or seller
    txs = db.query(Transaction).filter((Transaction.buyer_id == user_id) | (Transaction.seller_id == user_id)).order_by(Transaction.timestamp.desc()).all()
    return [
        {
            "id": tx.id,
            "buyer_id": tx.buyer_id,
            "seller_id": tx.seller_id,
            "category": tx.category,
            "amount_kg": tx.amount_kg,
            "tokens": tx.tokens,
            "timestamp": tx.timestamp.isoformat()
        }
        for tx in txs
    ] 

@router.get("/debug/all-users")
def debug_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "tokens": float(u.tokens)
        } for u in users
    ] 