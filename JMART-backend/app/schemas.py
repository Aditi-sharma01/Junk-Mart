from pydantic import BaseModel

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

    class Config:
        orm_mode = True
