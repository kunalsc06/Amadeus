# generate_dataset.py
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

np.random.seed(42)
random.seed(42)

n = 6500

users = [f"user_{i:03d}" for i in range(1, 51)]
activity_types = ['login', 'transaction', 'file_access', 'data_transfer', 'payment', 'api_call']

hours = np.random.normal(14, 4, n).clip(0, 24)
values = np.random.normal(650, 320, n).clip(50, 2500)

# 8% anomalies
is_anomaly = np.random.choice([False, True], size=n, p=[0.92, 0.08])
hours = np.where(is_anomaly, np.random.uniform(0, 24, n), hours)
values = np.where(is_anomaly, np.random.uniform(3200, 15000, n), values)

start_date = datetime(2025, 1, 10)
timestamps = [start_date + timedelta(minutes=random.randint(0, 43200*30)) for _ in range(n)]

data = {
    'user_id': np.random.choice(users, n),
    'activity_type': np.random.choice(activity_types, n),
    'hour_of_day': np.round(hours, 2),
    'value_metric': np.round(values, 2),
    'timestamp': [ts.isoformat() for ts in timestamps],
    'is_anomaly': is_anomaly,
    'risk_score': np.where(is_anomaly, 'Critical', 'Safe'),
    'risk_percentage': np.where(is_anomaly, np.random.randint(78, 99, n), np.random.randint(2, 25, n))
}

df = pd.DataFrame(data)
df = df.sort_values('timestamp').reset_index(drop=True)

df.to_csv('amadeus_large_dataset.csv', index=False)
print(f"✅ Generated {len(df)} rows → amadeus_large_dataset.csv")
print(f"Anomalies: {df['is_anomaly'].sum()}")