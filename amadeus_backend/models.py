# models.py
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from datetime import datetime
from database import Base

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    activity_type = Column(String)  # e.g., "login", "transaction"
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Feature 1: Time of day (0-24)
    hour_of_day = Column(Float)
    # Feature 2: Data transfer size or amount
    value_metric = Column(Float)
    
    # AI Analysis result
    is_anomaly = Column(Boolean, default=False)
    risk_score = Column(String) # e.g., "High", "Low"