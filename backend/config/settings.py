import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # Database configuration
    DATABASE_URL = os.environ.get('DATABASE_URL') or 'sqlite:///cybercrime.db'
    
    # ML Model paths
    MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models')
    
    # External API configurations
    SMS_API_KEY = os.environ.get('SMS_API_KEY')
    EMAIL_API_KEY = os.environ.get('EMAIL_API_KEY')
    
    # GIS Configuration
    MAPBOX_ACCESS_TOKEN = os.environ.get('MAPBOX_ACCESS_TOKEN')
    
    # Alert thresholds
    HIGH_RISK_THRESHOLD = 0.8
    MEDIUM_RISK_THRESHOLD = 0.6