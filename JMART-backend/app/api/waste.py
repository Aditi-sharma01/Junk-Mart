from fastapi import APIRouter, Depends, Body, UploadFile, File
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.schemas import WasteUpload, WasteItemOut
from app.models.waste_item import WasteItem
from typing import List, Optional
from fastapi import Response
from pydantic import BaseModel
import requests
from PIL import Image
from io import BytesIO
import torch
from torchvision import models, transforms
import os
import torch.nn.functional as F
from fastapi import HTTPException

router = APIRouter()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class WasteUpload(BaseModel):
    user_id: int
    username: str
    description: str
    image_url: str
    category: str
    force_unverified: Optional[bool] = False
    amount_kg: Optional[float] = None

@router.post("/upload")
def upload_waste(data: WasteUpload, db: Session = Depends(get_db)):
    allowed_extensions = (".jpg", ".jpeg", ".png")
    if not data.image_url.lower().endswith(allowed_extensions):
        return {"error": "Wrong image type. Only .jpg, .jpeg, .png files are accepted."}
    predicted_category, confidence, prob_dict = predict_image_from_url(data.image_url)
    if data.force_unverified:
        verified = False
    else:
        verified = (data.category.lower() == predicted_category.lower() and confidence >= 0.95)
    waste = WasteItem(
        user_id=data.user_id,
        username=data.username,
        description=data.description,
        image_url=data.image_url,
        category=data.category,
        verified=verified,
        predicted_category=predicted_category,
        ai_confidence=confidence,
        amount_kg=data.amount_kg
    )
    db.add(waste)
    db.commit()
    db.refresh(waste)
    return {"msg": "Waste uploaded", "id": waste.id, "ai_confidence": confidence, "probabilities": prob_dict}

@router.get("/listings", response_model=List[WasteItemOut])
def get_waste_listings(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    if user_id is None:
        return []
    items = db.query(WasteItem).filter(WasteItem.user_id == user_id).all()
    return items

@router.get("/marketplace-listings", response_model=List[WasteItemOut])
def get_marketplace_listings(db: Session = Depends(get_db)):
    try:
        items = db.query(WasteItem).all()
        return items
    except Exception as e:
        print(f"Error in /marketplace-listings: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {e}")

class VerifyRequest(BaseModel):
    user_category: str
    image_url: str

# Model/class setup (adjust as needed)
class_names = ['glass', 'metal', 'organic', 'paper', 'plastic']
preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])
def load_model():
    model = models.resnet18(pretrained=False)
    model.fc = torch.nn.Linear(model.fc.in_features, len(class_names))
    MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'ai-model', 'waste_classifier.pth')
    model.load_state_dict(torch.load(MODEL_PATH, map_location='cpu'))
    model.eval()
    return model
model = load_model()

def predict_image_from_url(url):
    response = requests.get(url)
    img = Image.open(BytesIO(response.content)).convert('RGB')
    img_t = preprocess(img).unsqueeze(0)
    with torch.no_grad():
        output = model(img_t)
        probs = F.softmax(output, dim=1)
        conf, pred = torch.max(probs, 1)
        # Get all class probabilities as a dict
        prob_dict = {class_names[i]: float(probs[0, i].item()) for i in range(len(class_names))}
    return class_names[pred.item()], float(conf.item()), prob_dict

@router.post("/verify-category")
async def verify_category(data: VerifyRequest):
    predicted_category, confidence, prob_dict = predict_image_from_url(data.image_url)
    verified = (data.user_category.lower() == predicted_category.lower())
    return {
        "verified": verified,
        "predicted_category": predicted_category,
        "confidence": confidence,
        "probabilities": prob_dict
    }