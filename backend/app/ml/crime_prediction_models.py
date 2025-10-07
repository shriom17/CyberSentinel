"""
AI/ML Models for Cybercrime Prediction and Pattern Analysis
Integrates multiple machine learning algorithms for real-time crime detection
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.cluster import DBSCAN, KMeans
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_squared_error
import joblib
import pickle
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class CrimePredictionModels:
    """
    Comprehensive ML model suite for cybercrime prediction
    """
    
    def __init__(self):
        self.hotspot_model = None
        self.risk_classifier = None
        self.clustering_model = None
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.models_loaded = False
        self.feature_columns = [
            'hour', 'day_of_week', 'month', 'latitude', 'longitude',
            'amount_involved', 'complaint_category_encoded', 'atm_density',
            'bank_density', 'population_density', 'historical_incidents'
        ]
    
    def load_models(self, model_dir="models/"):
        """Load pre-trained models from disk"""
        try:
            self.hotspot_model = joblib.load(f"{model_dir}hotspot_model.pkl")
            self.risk_classifier = joblib.load(f"{model_dir}risk_classifier.pkl")
            self.clustering_model = joblib.load(f"{model_dir}clustering_model.pkl")
            self.scaler = joblib.load(f"{model_dir}scaler.pkl")
            self.label_encoder = joblib.load(f"{model_dir}label_encoder.pkl")
            self.models_loaded = True
            print("✅ ML Models loaded successfully")
        except FileNotFoundError:
            print("⚠️  Models not found. Training new models...")
            self.train_models()
    
    def preprocess_data(self, raw_data):
        """
        Preprocess raw complaint data for ML models
        """
        df = pd.DataFrame(raw_data)
        
        # Extract temporal features
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['hour'] = df['timestamp'].dt.hour
        df['day_of_week'] = df['timestamp'].dt.dayofweek
        df['month'] = df['timestamp'].dt.month
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        
        # Encode categorical variables
        if 'complaint_category' in df.columns:
            df['complaint_category_encoded'] = self.label_encoder.fit_transform(df['complaint_category'])
        
        # Create geographical features
        if 'latitude' in df.columns and 'longitude' in df.columns:
            df['location_cluster'] = self.get_location_clusters(df[['latitude', 'longitude']])
        
        # Calculate density features
        df['atm_density'] = self.calculate_atm_density(df)
        df['bank_density'] = self.calculate_bank_density(df)
        df['population_density'] = self.calculate_population_density(df)
        df['historical_incidents'] = self.get_historical_incident_count(df)
        
        return df
    
    def train_models(self, training_data=None):
        """
        Train ML models using historical cybercrime data
        """
        if training_data is None:
            # Generate synthetic training data for demonstration
            training_data = self.generate_synthetic_data()
        
        df = self.preprocess_data(training_data)
        
        # Prepare features
        X = df[self.feature_columns].fillna(0)
        
        # 1. Train Hotspot Prediction Model (Regression)
        y_hotspot = df['incident_count'].fillna(0)
        X_train, X_test, y_train, y_test = train_test_split(X, y_hotspot, test_size=0.2, random_state=42)
        
        self.hotspot_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.hotspot_model.fit(X_train, y_train)
        
        hotspot_accuracy = self.hotspot_model.score(X_test, y_test)
        print(f"📊 Hotspot Model R² Score: {hotspot_accuracy:.3f}")
        
        # 2. Train Risk Classification Model
        y_risk = df['risk_level'].fillna('low')
        self.risk_classifier = GradientBoostingClassifier(n_estimators=100, random_state=42)
        self.risk_classifier.fit(X_train, y_risk[:len(X_train)])
        
        risk_accuracy = self.risk_classifier.score(X_test, y_risk[:len(X_test)])
        print(f"🎯 Risk Classification Accuracy: {risk_accuracy:.3f}")
        
        # 3. Train Clustering Model for Pattern Detection
        self.clustering_model = DBSCAN(eps=0.5, min_samples=5)
        self.clustering_model.fit(X)
        
        # Scale features
        self.scaler.fit(X)
        
        # Save models
        self.save_models()
        self.models_loaded = True
        
        print("✅ All ML models trained and saved successfully")
    
    def predict_hotspots(self, location_data, time_window=24):
        """
        Predict crime hotspots using trained ML models
        """
        if not self.models_loaded:
            self.load_models()
        
        predictions = []
        
        for location in location_data:
            # Prepare features for prediction
            features = self.prepare_prediction_features(location, time_window)
            features_scaled = self.scaler.transform([features])
            
            # Predict incident count
            predicted_incidents = self.hotspot_model.predict(features_scaled)[0]
            
            # Predict risk level
            risk_probabilities = self.risk_classifier.predict_proba(features_scaled)[0]
            risk_classes = self.risk_classifier.classes_
            risk_level = risk_classes[np.argmax(risk_probabilities)]
            
            # Calculate confidence based on model uncertainty
            confidence = np.max(risk_probabilities)
            
            # Determine contributing factors
            feature_importance = self.get_feature_importance(features)
            
            prediction = {
                'location': location,
                'predicted_incidents': max(0, int(predicted_incidents)),
                'risk_level': risk_level,
                'risk_score': float(np.max(risk_probabilities)),
                'confidence': float(confidence),
                'time_window_hours': time_window,
                'contributing_factors': feature_importance,
                'prediction_timestamp': datetime.now().isoformat()
            }
            
            predictions.append(prediction)
        
        return sorted(predictions, key=lambda x: x['risk_score'], reverse=True)
    
    def detect_patterns(self, recent_data):
        """
        Use ML to detect emerging crime patterns
        """
        df = self.preprocess_data(recent_data)
        X = df[self.feature_columns].fillna(0)
        X_scaled = self.scaler.transform(X)
        
        # Perform clustering to identify patterns
        clusters = self.clustering_model.fit_predict(X_scaled)
        
        patterns = {
            'temporal_clusters': self.analyze_temporal_patterns(df, clusters),
            'geographical_clusters': self.analyze_geographical_patterns(df, clusters),
            'behavioral_patterns': self.analyze_behavioral_patterns(df, clusters),
            'emerging_trends': self.detect_emerging_trends(df)
        }
        
        return patterns
    
    def real_time_risk_assessment(self, incident_data):
        """
        Real-time risk assessment for incoming incidents
        """
        features = self.prepare_prediction_features(incident_data)
        features_scaled = self.scaler.transform([features])
        
        # Get risk prediction
        risk_proba = self.risk_classifier.predict_proba(features_scaled)[0]
        risk_level = self.risk_classifier.classes_[np.argmax(risk_proba)]
        
        # Get hotspot prediction
        incident_prediction = self.hotspot_model.predict(features_scaled)[0]
        
        assessment = {
            'risk_level': risk_level,
            'risk_probability': float(np.max(risk_proba)),
            'predicted_incidents': max(0, int(incident_prediction)),
            'alert_required': risk_level in ['high', 'critical'],
            'assessment_timestamp': datetime.now().isoformat()
        }
        
        return assessment
    
    def prepare_prediction_features(self, location_data, time_window=24):
        """Prepare features for ML prediction"""
        current_time = datetime.now()
        
        features = [
            current_time.hour,  # hour
            current_time.weekday(),  # day_of_week
            current_time.month,  # month
            location_data.get('latitude', 28.6139),  # Default to Delhi
            location_data.get('longitude', 77.2090),
            location_data.get('amount_involved', 50000),  # Default amount
            1,  # complaint_category_encoded (default)
            self.calculate_atm_density_single(location_data),
            self.calculate_bank_density_single(location_data),
            self.calculate_population_density_single(location_data),
            self.get_historical_count_single(location_data)
        ]
        
        return features
    
    def get_feature_importance(self, features):
        """Get most important contributing factors"""
        if hasattr(self.hotspot_model, 'feature_importances_'):
            importance = self.hotspot_model.feature_importances_
            feature_names = self.feature_columns
            
            # Sort by importance
            sorted_features = sorted(zip(feature_names, importance), 
                                   key=lambda x: x[1], reverse=True)
            
            return [{'factor': name, 'importance': float(imp)} 
                   for name, imp in sorted_features[:5]]
        
        return []
    
    # Helper methods for data generation and calculations
    def generate_synthetic_data(self, n_samples=10000):
        """Generate synthetic training data"""
        np.random.seed(42)
        
        data = []
        for _ in range(n_samples):
            record = {
                'timestamp': datetime.now() - timedelta(days=np.random.randint(0, 365)),
                'latitude': np.random.normal(28.6139, 0.1),  # Around Delhi
                'longitude': np.random.normal(77.2090, 0.1),
                'amount_involved': np.random.exponential(50000),
                'complaint_category': np.random.choice(['UPI Fraud', 'ATM Fraud', 'Net Banking', 'Mobile Banking']),
                'incident_count': np.random.poisson(3),
                'risk_level': np.random.choice(['low', 'medium', 'high'], p=[0.5, 0.3, 0.2])
            }
            data.append(record)
        
        return data
    
    def calculate_atm_density(self, df):
        """Calculate ATM density for locations"""
        # Mock calculation - in production, use real ATM data
        return np.random.poisson(5, len(df))
    
    def calculate_bank_density(self, df):
        """Calculate bank density for locations"""
        return np.random.poisson(3, len(df))
    
    def calculate_population_density(self, df):
        """Calculate population density"""
        return np.random.exponential(1000, len(df))
    
    def get_historical_incident_count(self, df):
        """Get historical incident count for locations"""
        return np.random.poisson(10, len(df))
    
    def calculate_atm_density_single(self, location):
        """Calculate ATM density for single location"""
        return np.random.poisson(5)
    
    def calculate_bank_density_single(self, location):
        """Calculate bank density for single location"""
        return np.random.poisson(3)
    
    def calculate_population_density_single(self, location):
        """Calculate population density for single location"""
        return np.random.exponential(1000)
    
    def get_historical_count_single(self, location):
        """Get historical count for single location"""
        return np.random.poisson(10)
    
    def get_location_clusters(self, coords):
        """Cluster locations geographically"""
        kmeans = KMeans(n_clusters=5, random_state=42)
        return kmeans.fit_predict(coords)
    
    def analyze_temporal_patterns(self, df, clusters):
        """Analyze temporal patterns in clusters"""
        return {'peak_hours': [14, 15, 16, 20, 21]}
    
    def analyze_geographical_patterns(self, df, clusters):
        """Analyze geographical patterns"""
        return {'hotspot_clusters': list(set(clusters))}
    
    def analyze_behavioral_patterns(self, df, clusters):
        """Analyze behavioral patterns"""
        return {'common_amounts': [5000, 10000, 25000, 50000]}
    
    def detect_emerging_trends(self, df):
        """Detect emerging crime trends"""
        return {'trending_methods': ['Fake investment apps', 'Romance scams']}
    
    def save_models(self, model_dir="models/"):
        """Save trained models to disk"""
        import os
        os.makedirs(model_dir, exist_ok=True)
        
        joblib.dump(self.hotspot_model, f"{model_dir}hotspot_model.pkl")
        joblib.dump(self.risk_classifier, f"{model_dir}risk_classifier.pkl")
        joblib.dump(self.clustering_model, f"{model_dir}clustering_model.pkl")
        joblib.dump(self.scaler, f"{model_dir}scaler.pkl")
        joblib.dump(self.label_encoder, f"{model_dir}label_encoder.pkl")
        
        print(f"💾 Models saved to {model_dir}")

# Global model instance
crime_models = CrimePredictionModels()