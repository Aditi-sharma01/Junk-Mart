from fastapi import FastAPI
from app.database import Base, engine
from app.models import user, waste_item, group
from app.api import waste, user  # Import your route handlers

# Create all tables
Base.metadata.create_all(bind=engine)

# Create the FastAPI app
app = FastAPI(title="SmartRecycle API")

# Register your routes
app.include_router(waste.router, prefix="/api", tags=["Waste"])
app.include_router(user.router, prefix="/api", tags=["User"])

# Optional root test endpoint
@app.get("/")
def read_root():
    return {"message": "JMART backend running!"}
