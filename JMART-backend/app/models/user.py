from sqlalchemy import Column, Integer, String
from app.database import Base

class User(Base):
    __tablename__ = "users"  # ✅ Make sure this matches the ForeignKey in waste_item

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    level = Column(String, default="Bronze")
    tokens = Column(Integer, default=0)
