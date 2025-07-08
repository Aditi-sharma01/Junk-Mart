from sqlalchemy import Column, Integer, String
from app.database import Base

class MaterialGroup(Base):
    __tablename__ = "material_groups"
    id = Column(Integer, primary_key=True, index=True)
    material_type = Column(String)
    total_weight = Column(Integer, default=0)
