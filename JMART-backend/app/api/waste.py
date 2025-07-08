from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.schemas import WasteUpload
from app.models.waste_item import WasteItem

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
    waste = WasteItem(
        user_id=data.user_id,
        description=data.description,
        image_url=data.image_url
    )
    db.add(waste)
    db.commit()
    db.refresh(waste)
    return {"msg": "Waste uploaded", "id": waste.id}
