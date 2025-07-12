from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from app.database import Base
from datetime import datetime

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"))
    seller_id = Column(Integer, ForeignKey("users.id"))
    category = Column(String)
    amount_kg = Column(Float)
    tokens = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow) 