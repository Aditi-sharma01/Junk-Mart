from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from app.database import Base

class WasteItem(Base):
    __tablename__ = "waste_items"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    description = Column(String)
    image_url = Column(String)
    category = Column(String)
    verified = Column(Boolean, default=None)
    predicted_category = Column(String, default=None)
