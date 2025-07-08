from pydantic import BaseModel

class WasteUpload(BaseModel):
    user_id: int
    description: str
    image_url: str

class UserCreate(BaseModel):
    username: str
    email: str
    level: str = "Bronze"
