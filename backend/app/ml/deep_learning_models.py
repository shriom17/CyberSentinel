"""
Deep Learning Models for Advanced Crime Pattern Recognition
Uses TensorFlow/Keras for complex pattern detection and time series forecasting
"""

import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from sklearn.preprocessing import MinMaxScaler
import joblib
from datetime import datetime, timedelta
import json

class DeepLearningModels:
    """
    Deep learning models for advanced crime prediction
    """
    
    def __init__(self):
        self.lstm_model = None
        self.autoencoder = None
        self.cnn_model = None
        self.time_scaler = MinMaxScaler()
        self.sequence_length = 24  # 24 hours lookback
        self.models_loaded = False
    
    def build_lstm_forecasting_model(self, input_shape):
        """
        Build LSTM model for time series forecasting
        """
        model = keras.Sequential([
            layers.LSTM(128, return_sequences=True, input_shape=input_shape),
            layers.Dropout(0.2),
            layers.LSTM(64, return_sequences=True),
            layers.Dropout(0.2),
            layers.LSTM(32),
            layers.Dropout(0.2),
            layers.Dense(16, activation='relu'),
            layers.Dense(1, activation='linear')  # Predict incident count
        ])
        
        model.compile(
            optimizer='adam',
            loss='mse',
            metrics=['mae']
        )
        
        return model
    
    def build_autoencoder_anomaly_detector(self, input_dim):
        """
        Build autoencoder for anomaly detection
        """
        # Encoder
        input_layer = layers.Input(shape=(input_dim,))
        encoded = layers.Dense(64, activation='relu')(input_layer)
        encoded = layers.Dense(32, activation='relu')(encoded)
        encoded = layers.Dense(16, activation='relu')(encoded)
        
        # Decoder
        decoded = layers.Dense(32, activation='relu')(encoded)
        decoded = layers.Dense(64, activation='relu')(decoded)
        decoded = layers.Dense(input_dim, activation='sigmoid')(decoded)
        
        autoencoder = keras.Model(input_layer, decoded)
        autoencoder.compile(optimizer='adam', loss='mse')
        
        return autoencoder
    
    def build_cnn_spatial_model(self, input_shape):
        """
        Build CNN for spatial pattern recognition
        """
        model = keras.Sequential([
            layers.Conv2D(32, (3, 3), activation='relu', input_shape=input_shape),
            layers.MaxPooling2D((2, 2)),
            layers.Conv2D(64, (3, 3), activation='relu'),
            layers.MaxPooling2D((2, 2)),
            layers.Conv2D(64, (3, 3), activation='relu'),
            layers.Flatten(),
            layers.Dense(64, activation='relu'),
            layers.Dropout(0.5),
            layers.Dense(3, activation='softmax')  # 3 risk levels
        ])
        
        model.compile(
            optimizer='adam',
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def prepare_time_series_data(self, data):
        """
        Prepare data for LSTM time series prediction
        """
        df = pd.DataFrame(data)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp')
        
        # Create hourly aggregation
        df.set_index('timestamp', inplace=True)
        hourly_data = df.resample('H').agg({
            'incident_count': 'sum',
            'amount_involved': 'sum',
            'latitude': 'mean',
            'longitude': 'mean'
        }).fillna(0)
        
        # Scale the data
        scaled_data = self.time_scaler.fit_transform(hourly_data)
        
        # Create sequences
        X, y = [], []
        for i in range(self.sequence_length, len(scaled_data)):
            X.append(scaled_data[i-self.sequence_length:i])
            y.append(scaled_data[i, 0])  # Predict incident_count
        
        return np.array(X), np.array(y)
    
    def train_lstm_model(self, training_data):
        """
        Train LSTM model for time series forecasting
        """
        X, y = self.prepare_time_series_data(training_data)
        
        if len(X) == 0:
            print("⚠️  Not enough data for LSTM training")
            return
        
        # Split data
        split_idx = int(0.8 * len(X))
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]
        
        # Build and train model
        self.lstm_model = self.build_lstm_forecasting_model((X.shape[1], X.shape[2]))
        
        history = self.lstm_model.fit(
            X_train, y_train,
            epochs=50,
            batch_size=32,
            validation_data=(X_test, y_test),
            verbose=0
        )
        
        print(f"📈 LSTM Model trained. Final loss: {history.history['loss'][-1]:.4f}")
    
    def train_autoencoder(self, training_data):
        """
        Train autoencoder for anomaly detection
        """
        df = pd.DataFrame(training_data)
        
        # Prepare features
        features = ['hour', 'day_of_week', 'amount_involved', 'latitude', 'longitude']
        X = df[features].fillna(0)
        
        # Scale features
        X_scaled = self.time_scaler.fit_transform(X)
        
        # Build and train autoencoder
        self.autoencoder = self.build_autoencoder_anomaly_detector(X_scaled.shape[1])
        
        history = self.autoencoder.fit(
            X_scaled, X_scaled,
            epochs=100,
            batch_size=32,
            validation_split=0.2,
            verbose=0
        )
        
        print(f"🔍 Autoencoder trained. Final loss: {history.history['loss'][-1]:.4f}")
    
    def predict_future_incidents(self, recent_data, hours_ahead=24):
        """
        Predict future incidents using LSTM
        """
        if self.lstm_model is None:
            return {"error": "LSTM model not trained"}
        
        # Prepare input sequence
        X, _ = self.prepare_time_series_data(recent_data)
        
        if len(X) == 0:
            return {"error": "Not enough recent data"}
        
        # Use last sequence for prediction
        last_sequence = X[-1:, :, :]
        
        predictions = []
        current_sequence = last_sequence.copy()
        
        for hour in range(hours_ahead):
            # Predict next hour
            pred = self.lstm_model.predict(current_sequence, verbose=0)[0, 0]
            
            # Inverse transform to get actual scale
            dummy_array = np.zeros((1, current_sequence.shape[2]))
            dummy_array[0, 0] = pred
            actual_pred = self.time_scaler.inverse_transform(dummy_array)[0, 0]
            
            predictions.append({
                'hour_offset': hour + 1,
                'predicted_incidents': max(0, int(actual_pred)),
                'timestamp': (datetime.now() + timedelta(hours=hour + 1)).isoformat()
            })
            
            # Update sequence for next prediction
            new_step = current_sequence[0, -1:, :].copy()
            new_step[0, 0] = pred
            current_sequence = np.concatenate([
                current_sequence[:, 1:, :],
                new_step.reshape(1, 1, -1)
            ], axis=1)
        
        return {
            'predictions': predictions,
            'model_confidence': 0.85,  # Mock confidence
            'prediction_timestamp': datetime.now().isoformat()
        }
    
    def detect_anomalies(self, current_data):
        """
        Detect anomalies using autoencoder
        """
        if self.autoencoder is None:
            return {"error": "Autoencoder not trained"}
        
        df = pd.DataFrame(current_data)
        features = ['hour', 'day_of_week', 'amount_involved', 'latitude', 'longitude']
        X = df[features].fillna(0)
        X_scaled = self.time_scaler.transform(X)
        
        # Get reconstruction error
        reconstructions = self.autoencoder.predict(X_scaled, verbose=0)
        reconstruction_errors = np.mean(np.square(X_scaled - reconstructions), axis=1)
        
        # Define anomaly threshold (95th percentile)
        threshold = np.percentile(reconstruction_errors, 95)
        
        anomalies = []
        for i, error in enumerate(reconstruction_errors):
            if error > threshold:
                anomalies.append({
                    'index': i,
                    'reconstruction_error': float(error),
                    'anomaly_score': float(error / threshold),
                    'data_point': current_data[i] if i < len(current_data) else None
                })
        
        return {
            'anomalies_detected': len(anomalies),
            'anomalies': anomalies,
            'threshold': float(threshold),
            'detection_timestamp': datetime.now().isoformat()
        }
    
    def generate_risk_heatmap_data(self, geographical_bounds):
        """
        Generate detailed risk heatmap using deep learning
        """
        # Create grid of locations
        lat_min, lat_max = geographical_bounds['lat_min'], geographical_bounds['lat_max']
        lon_min, lon_max = geographical_bounds['lon_min'], geographical_bounds['lon_max']
        
        # Create 50x50 grid
        lat_grid = np.linspace(lat_min, lat_max, 50)
        lon_grid = np.linspace(lon_min, lon_max, 50)
        
        heatmap_data = []
        
        for lat in lat_grid:
            for lon in lon_grid:
                # Simulate prediction for each grid point
                # In production, use actual model predictions
                risk_score = self.calculate_location_risk(lat, lon)
                
                heatmap_data.append({
                    'latitude': float(lat),
                    'longitude': float(lon),
                    'risk_score': float(risk_score),
                    'predicted_incidents': int(risk_score * 10)
                })
        
        return heatmap_data
    
    def calculate_location_risk(self, lat, lon):
        """
        Calculate risk score for specific location
        """
        # Mock calculation - in production, use actual models
        # Factor in distance from city center, time of day, etc.
        center_lat, center_lon = 28.6139, 77.2090  # Delhi center
        distance = np.sqrt((lat - center_lat)**2 + (lon - center_lon)**2)
        
        # Higher risk closer to center, with some randomness
        base_risk = np.exp(-distance * 100)
        noise = np.random.normal(0, 0.1)
        
        return np.clip(base_risk + noise, 0, 1)
    
    def save_models(self, model_dir="models/deep_learning/"):
        """
        Save deep learning models
        """
        import os
        os.makedirs(model_dir, exist_ok=True)
        
        if self.lstm_model:
            self.lstm_model.save(f"{model_dir}lstm_model.h5")
        
        if self.autoencoder:
            self.autoencoder.save(f"{model_dir}autoencoder.h5")
        
        if self.cnn_model:
            self.cnn_model.save(f"{model_dir}cnn_model.h5")
        
        joblib.dump(self.time_scaler, f"{model_dir}time_scaler.pkl")
        
        print(f"💾 Deep learning models saved to {model_dir}")
    
    def load_models(self, model_dir="models/deep_learning/"):
        """
        Load pre-trained deep learning models
        """
        try:
            if os.path.exists(f"{model_dir}lstm_model.h5"):
                self.lstm_model = keras.models.load_model(f"{model_dir}lstm_model.h5")
            
            if os.path.exists(f"{model_dir}autoencoder.h5"):
                self.autoencoder = keras.models.load_model(f"{model_dir}autoencoder.h5")
            
            if os.path.exists(f"{model_dir}cnn_model.h5"):
                self.cnn_model = keras.models.load_model(f"{model_dir}cnn_model.h5")
            
            self.time_scaler = joblib.load(f"{model_dir}time_scaler.pkl")
            self.models_loaded = True
            
            print("✅ Deep learning models loaded successfully")
        except Exception as e:
            print(f"⚠️  Error loading models: {e}")

# Global deep learning instance
deep_models = DeepLearningModels()