import numpy as np
from fastapi import FastAPI, Depends
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from sklearn.ensemble import IsolationForest
from datetime import datetime
import uvicorn
from database import SessionLocal, engine
from models import ActivityLog
from ml_engine import AmadeusAI

# ===========================
# 1. DATABASE SETUP
# ===========================
# using SQLite for simplicity (creates 'amadeus.db' automatically)
SQLALCHEMY_DATABASE_URL = "sqlite:///./amadeus.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Table Model
class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    activity_type = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    hour_of_day = Column(Float)
    value_metric = Column(Float)
    is_anomaly = Column(Boolean, default=False)
    risk_score = Column(String)

# Create the tables
Base.metadata.create_all(bind=engine)

# ===========================
# 2. AI ENGINE SETUP
# ===========================

ai_engine = AmadeusAI()

# ===========================
# 3. API SETUP (FastAPI)
# ===========================

# THIS is the line that was missing or hidden before
app = FastAPI(title="Amadeus AI Backend")
from fastapi.middleware.cors import CORSMiddleware

# ... (after app = FastAPI)

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

@app.on_event("startup")
async def startup_event():
    ai_engine.train_mock_model()

@app.get("/")
def read_root():
    return {"status": "Amadeus System Online", "ai": "Active"}

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

@app.get("/logs/")
def get_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
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
# ===========================
# 4. RUNNER
# ===========================
if __name__ == "__main__":
    # This allows you to run the file simply as "python main.py"
    uvicorn.run(app, host="127.0.0.1", port=8000)