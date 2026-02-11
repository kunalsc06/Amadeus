# ml_engine.py - Fixed version with comment handling for baseline CSV
import numpy as np
from sklearn.ensemble import IsolationForest
import pickle
import os
import pandas as pd

class AmadeusAI:
    def get_risk_percentage(self, data_point: list):
     if not self.is_trained:
        self.train_on_baseline()

     features = np.array(data_point).reshape(1, -1)
     score = self.model.decision_function(features)[0]

    # Tuned scale: normal activities ~1-20%, clear anomalies ~80-95%, edge cases ~40-60%
     scale = 20.0
     risk_prob = 1.0 / (1.0 + np.exp(scale * score))

     return int(round(risk_prob * 100))
    def __init__(self, baseline_file="baseline_data.csv", model_file="amadeus_model.pkl"):
        self.baseline_file = baseline_file
        self.model_file = model_file
        self.model = IsolationForest(contamination=0.05, random_state=42)
        self.is_trained = False

        # Load pre-trained model if it exists
        if os.path.exists(self.model_file):
            try:
                with open(self.model_file, 'rb') as f:
                    self.model = pickle.load(f)
                self.is_trained = True
                print("Amadeus AI: Loaded pre-trained model from disk.")
                return  # Skip training if model loaded
            except Exception as e:
                print(f"Failed to load model: {e}. Retraining...")
        
        # If no model or load failed, train from baseline
        self.train_on_baseline()

    def train_on_baseline(self):
        print("Amadeus AI: Training on realistic baseline data...")

        if os.path.exists(self.baseline_file):
            print(f"Loading baseline data from {self.baseline_file}...")
            try:
                # Added comment='#' to skip comment lines in CSV
                df = pd.read_csv(self.baseline_file, comment='#')
                print(f"Loaded columns: {list(df.columns)}")  # Debug print
                
                # Ensure expected columns exist
                if not {'hour_of_day', 'value_metric'}.issubset(df.columns):
                    raise ValueError("CSV missing required columns 'hour_of_day' and 'value_metric'")
                
                X_train = df[['hour_of_day', 'value_metric']].values
            except Exception as e:
                print(f"Error loading CSV: {e}. Falling back to generated data...")
                X_train = self._generate_baseline_data()
        else:
            print("No baseline CSV found. Generating realistic data...")
            X_train = self._generate_baseline_data()

        # Train the model
        self.model.fit(X_train)
        self.is_trained = True

        # Save the trained model
        with open(self.model_file, 'wb') as f:
            pickle.dump(self.model, f)
        print("Amadeus AI: Model trained and saved to disk.")

    def _generate_baseline_data(self):
        """Internal method to generate and save baseline data"""
        np.random.seed(42)

        # 300 normal activities
        n_normal = 300
        hours_normal = np.random.normal(loc=14, scale=4, size=n_normal).clip(0, 24)
        values_normal = np.random.normal(loc=600, scale=300, size=n_normal).clip(0, 2000)

        # 30 outliers
        n_outlier = 30
        hours_outlier = np.random.uniform(0, 24, n_outlier)
        values_outlier = np.random.uniform(3000, 10000, n_outlier)

        hours = np.concatenate([hours_normal, hours_outlier])
        values = np.concatenate([values_normal, values_outlier])

        X_train = np.column_stack((hours, values))

        # Save clean CSV (no comments)
        df = pd.DataFrame(X_train, columns=['hour_of_day', 'value_metric'])
        df.to_csv(self.baseline_file, index=False)
        print(f"Generated and saved clean baseline data to {self.baseline_file}")

        return X_train

    def predict(self, data_point: list):
        if not self.is_trained:
            self.train_on_baseline()

        features = np.array(data_point).reshape(1, -1)
        prediction = self.model.predict(features)[0]
        return True if prediction == -1 else False  # True = anomaly

# Singleton instance
ai_engine = AmadeusAI()