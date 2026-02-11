# bulk_import.py
import pandas as pd
import requests
import time

API_URL = "http://127.0.0.1:8000/analyze/"

df = pd.read_csv('amadeus_large_dataset.csv')

print(f"Starting bulk import of {len(df)} records...")

success = 0
for i, row in df.iterrows():
    payload = {
        "user_id": row['user_id'],
        "activity_type": row['activity_type'],
        "hour_of_day": float(row['hour_of_day']),
        "value_metric": float(row['value_metric'])
    }
    
    try:
        r = requests.post(API_URL, json=payload, timeout=5)
        if r.status_code == 200:
            success += 1
            if (i + 1) % 500 == 0:
                print(f"  → {i+1}/{len(df)} records processed")
        else:
            print(f"Error at row {i}: {r.status_code}")
    except Exception as e:
        print(f"Connection error at row {i}: {e}")
    
    # Small delay to avoid overwhelming the backend
    time.sleep(0.008)

print(f"\n✅ Import completed! {success} records successfully added to database.")
print("Refresh your frontend now to see all data.")