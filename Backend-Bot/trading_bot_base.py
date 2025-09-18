# Backend-Bot/trading_bot_base.py
import requests
import pandas as pd
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from utils import prepare_features, compute_rsi

MODEL_FILE = "trained_rf_model.pkl"

class TradingBotBase:
    def __init__(self, mode='backtest'):
        self.mode = mode
        self.model = self.load_model()
        self.previous_data = None  # Store previous data for calculations
        
    def load_model(self):
        try:
            model = joblib.load(MODEL_FILE)
            print(f"Loaded existing model: {MODEL_FILE}")
            return model
        except:
            print("No existing model found. Training new model...")
            return self.train_model()
    
    def train_model(self):
        df = self.fetch_data(limit=1500)
        df["future_return"] = df["close"].shift(-1) - df["close"]
        df["target"] = (df["future_return"] > 0).astype(int)

        df, features_df = prepare_features(df)
        features_df = features_df.dropna()
        df = df.loc[features_df.index]

        features = ["return", "vol_change", "rsi14", "ma20", "ma50"]
        X = features_df[features]
        y = df["target"]

        split = int(len(df) * 0.7)
        X_train, X_test = X.iloc[:split], X.iloc[split:]
        y_train, y_test = y.iloc[:split], y.iloc[split:]

        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)
        print("==== Classification Report ====")
        print(classification_report(y_test, y_pred))

        joblib.dump(model, MODEL_FILE)
        print(f"Model saved to {MODEL_FILE}")
        return model

    def fetch_data(self, limit=5000):
        if self.mode == 'live':
            print("Fetching real-time data...")
            return pd.DataFrame()  # Placeholder
            
        # For backtest, use historical data
        url = f"https://api-pub.bitfinex.com/v2/candles/trade:1m:tBTCUSD/hist?limit={limit}&sort=1"
        data = requests.get(url).json()
        df = pd.DataFrame(data, columns=["timestamp", "open", "high", "low", "close", "volume"])
        df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
        df = df.sort_values("timestamp").reset_index(drop=True)
        return df

    def prepare_realtime_features(self, current_data):
        """Prepare features for real-time prediction"""
        if self.previous_data is None:
            self.previous_data = current_data
            return None
            
        # Calculate features
        features = {}
        
        # Return
        features['return'] = (current_data['price'] - self.previous_data['price']) / self.previous_data['price']
        
        # Volume change
        features['vol_change'] = (current_data['volume'] - self.previous_data['volume']) / self.previous_data['volume'] if self.previous_data['volume'] > 0 else 0
        
        # For moving averages and RSI, we need historical data
        # In live mode, you should maintain a rolling window of data
        features['ma20'] = current_data['price']  # Simplified - should be actual MA
        features['ma50'] = current_data['price']  # Simplified
        features['rsi14'] = 50  # Simplified - should be actual RSI
        
        self.previous_data = current_data
        return features

    def make_prediction(self, current_data):
        """Make prediction for real-time data"""
        features = self.prepare_realtime_features(current_data)
        if features is None:
            return 0.5  # Neutral prediction until we have enough data
            
        # Convert features to the format expected by the model
        feature_values = np.array([
            features['return'],
            features['vol_change'],
            features['rsi14'],
            features['ma20'],
            features['ma50']
        ]).reshape(1, -1)
        
        try:
            prediction = self.model.predict_proba(feature_values)[0][1]
            return prediction
        except Exception as e:
            print(f"Prediction error: {e}")
            return 0.5