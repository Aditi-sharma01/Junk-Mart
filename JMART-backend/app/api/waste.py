from fastapi import APIRouter, Depends, Body, UploadFile, File
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.schemas import WasteUpload, WasteItemOut
from app.models.waste_item import WasteItem
from typing import List
from fastapi import Response
from pydantic import BaseModel
import requests
from PIL import Image
from io import BytesIO
import torch
from torchvision import models, transforms
import os

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
    # Run AI verification
    predicted_category = predict_image_from_url(data.image_url)
    verified = (data.category.lower() == predicted_category.lower())
    waste = WasteItem(
        user_id=data.user_id,
        description=data.description,
        image_url=data.image_url,
        category=data.category,
        verified=verified,
        predicted_category=predicted_category
    )
    db.add(waste)
    db.commit()
    db.refresh(waste)
    return {"msg": "Waste uploaded", "id": waste.id}

@router.get("/listings", response_model=List[WasteItemOut])
def get_waste_listings(db: Session = Depends(get_db)):
    items = db.query(WasteItem).all()
    return items

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
        _, pred = torch.max(output, 1)
    return class_names[pred.item()]

@router.post("/verify-category")
async def verify_category(data: VerifyRequest):
    predicted_category = predict_image_from_url(data.image_url)
    verified = (data.user_category.lower() == predicted_category.lower())
    return {
        "verified": verified,
        "predicted_category": predicted_category
    }