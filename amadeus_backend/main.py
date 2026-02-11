import numpy as np
from fastapi import FastAPI, Depends
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
import uvicorn

# Import your cleaned modules
from database import SessionLocal, engine, Base
from models import ActivityLog
from ml_engine import ai_engine  # ← Uses the new persistent + baseline version

# Create tables
Base.metadata.create_all(bind=engine)

# ===========================
# 3. API SETUP (FastAPI)
# ===========================

app = FastAPI(title="Amadeus AI Backend")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (for development)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Input Validation Schema
class ActivityInput(BaseModel):
    user_id: str
    activity_type: str
    hour_of_day: float
    value_metric: float

@app.get("/")
def read_root():
    return {"status": "Amadeus System Online", "ai": "Active"}

@app.get("/logs/")
def get_logs(skip: int = 0, limit: int = 100000, db: Session = Depends(get_db)):
    logs = db.query(ActivityLog).order_by(ActivityLog.timestamp.desc()).offset(skip).limit(limit).all()
    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "activity_type": l.activity_type,
            "timestamp": l.timestamp.isoformat(),
            "hour_of_day": l.hour_of_day,
            "value_metric": l.value_metric,
            "is_anomaly": l.is_anomaly,
            "risk_score": l.risk_score
        }
        for l in logs
    ]

@app.post("/analyze/")
def analyze_activity(activity: ActivityInput, db: Session = Depends(get_db)):
    # 1. AI Analysis
    features = [activity.hour_of_day, activity.value_metric]
    is_suspicious = ai_engine.predict(features)
    
    risk_level = "Critical" if is_suspicious else "Safe"
    message = "Suspicious activity detected!" if is_suspicious else "Activity normal."

    # 2. Save result to DB
    db_log = ActivityLog(
        user_id=activity.user_id,
        activity_type=activity.activity_type,
        hour_of_day=activity.hour_of_day,
        value_metric=activity.value_metric,
        is_anomaly=is_suspicious,
        risk_score=risk_level
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)

    return {
        "is_anomaly": is_suspicious,
        "risk_level": risk_level,
        "message": message
    }

# ===========================
# 4. RUNNER
# ===========================
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)