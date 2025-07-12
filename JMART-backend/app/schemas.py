from pydantic import BaseModel, EmailStr
from typing import Optional

class WasteUpload(BaseModel):
    user_id: int
    username: str
    description: str
    image_url: str
    category: str
    amount_kg: float

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    level: str = "Bronze"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class SendOTPRequest(BaseModel):
    email: EmailStr
    username: str

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    level: str
    tokens: int

    class Config:
        orm_mode = True

class WasteItemOut(BaseModel):
    id: int
    user_id: int
    username: Optional[str] = None
    description: str
    image_url: str
    category: str
    amount_kg: float
    verified: Optional[bool] = None
    predicted_category: Optional[str] = None
    ai_confidence: Optional[float] = None

    class Config:
        orm_mode = True
