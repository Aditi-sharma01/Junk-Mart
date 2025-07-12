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
from app.models.user import User
from fastapi import HTTPException
from sqlalchemy import and_
from app.models.transaction import Transaction
from datetime import datetime
from sqlalchemy import Boolean

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
        verified = (data.category.lower() == predicted_category.lower() and confidence >= 0.65)
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
    for item in items:
        if hasattr(item, 'sold') and item.sold:
            # Calculate profit for this item
            profit = sum(
                tx.tokens for tx in db.query(Transaction).filter(Transaction.seller_id == item.user_id, Transaction.category == item.category, Transaction.amount_kg > 0, Transaction.seller_id == item.user_id)
            )
            item.profit = profit
    return items

@router.get("/marketplace-listings", response_model=List[WasteItemOut])
def get_marketplace_listings(db: Session = Depends(get_db)):
    try:
        items = db.query(WasteItem).filter(WasteItem.sold == False).all()
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

class BuyCategoryRequest(BaseModel):
    buyer_id: int
    category: str
    quantity: float  # in kg

@router.post("/buy-category")
def buy_category(data: BuyCategoryRequest, db: Session = Depends(get_db)):
    try:
        items = db.query(WasteItem).filter(and_(WasteItem.category == data.category, WasteItem.verified == True, WasteItem.amount_kg > 0)).all()
        if not items:
            raise HTTPException(status_code=400, detail=f"No available {data.category} items to buy.")
        total_available = sum(i.amount_kg for i in items)
        if data.quantity > total_available:
            raise HTTPException(status_code=400, detail=f"Not enough {data.category} available. Requested: {data.quantity}, Available: {total_available}")
        tokens_to_deduct = float(data.quantity)
        if tokens_to_deduct <= 0:
            raise HTTPException(status_code=400, detail="You must buy at least 0.01 kg (0.01 token). Please enter a valid quantity.")
        buyer = db.query(User).filter(User.id == data.buyer_id).first()
        if not buyer:
            raise HTTPException(status_code=404, detail="Buyer not found. Please log in again.")
        if buyer.tokens < tokens_to_deduct:
            raise HTTPException(status_code=400, detail=f"You do not have enough tokens. You have {buyer.tokens}, but need {tokens_to_deduct}.")
        print(f"[DEBUG] Buyer before: id={buyer.id}, tokens={buyer.tokens}")
        buyer.tokens -= tokens_to_deduct
        print(f"[DEBUG] Buyer after deduction: id={buyer.id}, tokens={buyer.tokens}")
        sellers_paid = {}
        qty_to_buy = data.quantity
        tokens_remaining = tokens_to_deduct
        shares = [(item, item.amount_kg / total_available) for item in items]
        for idx, (item, share) in enumerate(shares):
            seller = db.query(User).filter(User.id == item.user_id).first()
            if not seller:
                continue
            # Distribute float tokens to sellers
            if idx == len(shares) - 1:
                # Last seller gets the remainder to ensure total matches exactly
                take_qty = qty_to_buy
                tokens_for_seller = tokens_remaining
            else:
                tokens_for_seller = round(share * data.quantity, 6)  # use more precision
                tokens_for_seller = min(tokens_for_seller, tokens_remaining)
                take_qty = min(item.amount_kg, tokens_for_seller)
            if tokens_for_seller <= 0:
                continue
            sellers_paid.setdefault(seller.id, 0.0)
            sellers_paid[seller.id] += tokens_for_seller
            seller.tokens += tokens_for_seller
            item.amount_kg -= take_qty
            if item.amount_kg <= 0:
                item.sold = True
                item.sold_at = datetime.utcnow()
            tokens_remaining -= tokens_for_seller
            qty_to_buy -= take_qty
            db.add(Transaction(
                buyer_id=data.buyer_id,
                seller_id=seller.id,
                category=data.category,
                amount_kg=take_qty,
                tokens=tokens_for_seller,
                timestamp=datetime.utcnow()
            ))
        db.commit()
        print(f"[DEBUG] Buyer final: id={buyer.id}, tokens={buyer.tokens}")
        return {
            "msg": f"Purchased {tokens_to_deduct} kg of {data.category}",
            "tokens_deducted": tokens_to_deduct,
            "sellers_paid": sellers_paid,
            "buyer_new_balance": buyer.tokens
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"[ERROR] Unexpected error in buy_category: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred. Please try again later.")