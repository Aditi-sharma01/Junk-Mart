from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Float, DateTime
from app.database import Base
from datetime import datetime

class WasteItem(Base):
    __tablename__ = "waste_items"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    username = Column(String)
    description = Column(String)
    image_url = Column(String)
    category = Column(String)
    verified = Column(Boolean, default=None)
    predicted_category = Column(String, default=None)
    ai_confidence = Column(Float, default=None)
    amount_kg = Column(Float, default=1.0)
    sold = Column(Boolean, default=False)
    sold_at = Column(DateTime, nullable=True)
