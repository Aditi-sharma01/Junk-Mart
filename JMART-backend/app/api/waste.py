from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.schemas import WasteUpload, WasteItemOut
from app.models.waste_item import WasteItem
from typing import List
from fastapi import Response

router = APIRouter()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/upload")
def upload_waste(data: WasteUpload, db: Session = Depends(get_db)):
    allowed_extensions = (".jpg", ".jpeg", ".png")
    if not data.image_url.lower().endswith(allowed_extensions):
        return {"error": "Wrong image type. Only .jpg, .jpeg, .png files are accepted."}
    waste = WasteItem(
        user_id=data.user_id,
        description=data.description,
        image_url=data.image_url,
        category=data.category
    )
    db.add(waste)
    db.commit()
    db.refresh(waste)
    return {"msg": "Waste uploaded", "id": waste.id}

@router.get("/listings", response_model=List[WasteItemOut])
def get_waste_listings(db: Session = Depends(get_db)):
    items = db.query(WasteItem).all()
    return items
