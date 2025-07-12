from pydantic import BaseModel, EmailStr
from typing import Optional

class WasteUpload(BaseModel):
    user_id: int
    description: str
    image_url: str
    category: str

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
    description: str
    image_url: str
    category: str
    verified: Optional[bool] = None
    predicted_category: Optional[str] = None

    class Config:
        orm_mode = True
