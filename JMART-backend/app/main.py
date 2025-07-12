from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.models import user, waste_item, group
from app.api import waste, user  # Import your route handlers
from app.otp import generate_otp, EMAIL_CONFIGURED

# Create all tables
Base.metadata.create_all(bind=engine)

# Create the FastAPI app
app = FastAPI(title="SmartRecycle API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],  # Changed from ["*"] to specific frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register your routes
app.include_router(waste.router, prefix="/api", tags=["Waste"])
app.include_router(user.router, prefix="/api", tags=["User"])

# Optional root test endpoint
@app.get("/")
def read_root():
    return {"message": "JMART backend running!"}

# Test OTP endpoint
@app.get("/test-otp")
def test_otp():
    otp = generate_otp()
    return {
        "message": "OTP system is working",
        "test_otp": otp,
        "email_configured": EMAIL_CONFIGURED
    }
