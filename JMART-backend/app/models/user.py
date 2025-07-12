from sqlalchemy import Column, Integer, String, Float
from app.database import Base

class User(Base):
    __tablename__ = "users"  # ✅ Make sure this matches the ForeignKey in waste_item

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)  # Add password column for authentication
    level = Column(String, default="Bronze")
    tokens = Column(Float, default=0.0)
