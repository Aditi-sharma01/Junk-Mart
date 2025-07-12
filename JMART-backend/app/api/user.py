from fastapi import APIRouter, Depends, Body
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.schemas import UserCreate
from app.models.user import User

router = APIRouter()

TOKEN_PRICE = 0.5  # $0.50 per token
SELL_FEE = 0.04    # 4% fee

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class BuyTokensRequest(BaseModel):
    user_id: int
    dollars: float

class SellTokensRequest(BaseModel):
    user_id: int
    tokens: int

@router.post("/users/create")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(username=user.username, email=user.email, level=user.level)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"msg": "User created", "id": db_user.id}

@router.post("/buy-tokens")
def buy_tokens(data: BuyTokensRequest, db: Session = Depends(get_db)):
    tokens_to_add = int(data.dollars / TOKEN_PRICE)
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        return {"error": "User not found"}
    user.tokens += tokens_to_add
    db.commit()
    return {"tokens_added": tokens_to_add, "new_balance": user.tokens, "cost": tokens_to_add * TOKEN_PRICE}

@router.post("/sell-tokens")
def sell_tokens(data: SellTokensRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        return {"error": "User not found"}
    if user.tokens < data.tokens:
        return {"error": "Not enough tokens"}
    payout = data.tokens * TOKEN_PRICE * (1 - SELL_FEE)
    user.tokens -= data.tokens
    db.commit()
    return {"tokens_sold": data.tokens, "payout": payout, "new_balance": user.tokens}

@router.get("/token-balance")
def token_balance(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": "User not found"}
    return {"token_balance": user.tokens} 