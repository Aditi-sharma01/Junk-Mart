from pydantic import BaseModel
from typing import Optional

class WasteUpload(BaseModel):
    user_id: int
    description: str
    image_url: str
    category: str

class UserCreate(BaseModel):
    username: str
    email: str
    level: str = "Bronze"

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
