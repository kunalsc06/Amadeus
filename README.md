Amadeus
Real-time AI Anomaly Detection System
A sleek cyberpunk-themed security monitoring platform that detects suspicious user activity using Isolation Forest ML.
Amadeus Dashboard

✨ Features:
Real-time anomaly detection using Isolation Forest
Live cyberpunk dashboard with neon infographics
Auto-refreshing logs & charts every 5 seconds
Interactive threat gauge, scatter plot, hourly heat map & anomaly timeline
Searchable live activity log
Persistent SQLite storage
Beautiful glassmorphism + neon UI

🛠 Tech Stack
Backend

FastAPI
SQLAlchemy + SQLite
scikit-learn (Isolation Forest)
Persistent ML model

Frontend

React 18
Tailwind CSS
Recharts (charts)
Framer Motion (animations)
Lucide Icons

🚀 Quick Start
1. Backend Setup
  Bash
    cd amadeus_backend
    pip install -r requirements.txt
    python main.py
      → Runs on http://127.0.0.1:8000
3. Frontend Setup
    Bash
      cd amadeus_frontend
      npm install
      npm start
      → Runs on http://localhost:3000
   
📁 Project Structure
textamadeus/
├── backend/
│   ├── main.py
│   ├── ml_engine.py
│   ├── models.py
│   ├── database.py
│   └── baseline_data.csv
└── frontend/
    ├── src/App.js
    ├── src/index.css
    └── tailwind.config.js
🎯 Future Enhancements
WebSocket real-time updates
User authentication
Email/Slack alerts
World map IP heatmap
Export reports
