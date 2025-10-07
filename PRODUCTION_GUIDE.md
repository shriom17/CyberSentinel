# 🚀 **Production Implementation & Testing Guide**

## 📋 **Installation Instructions**

### **Backend Dependencies**
```bash
cd backend
pip install -r requirements.txt

# Additional production dependencies
pip install psycopg2-binary  # PostgreSQL adapter
pip install tweepy           # Twitter API
pip install nltk             # Natural language processing
pip install textblob         # Text analysis
pip install aiohttp          # Async HTTP client
pip install asyncio          # Async programming
pip install jinja2           # Email templates
```

### **Frontend Dependencies**
```bash
cd frontend
npm install

# Additional dependencies for production
npm install @types/leaflet
npm install leaflet.heat     # Heatmap plugin
npm install socket.io-client # Real-time updates
```

### **Mobile App Dependencies**
```bash
cd mobile
npm install

# React Native CLI (global)
npm install -g react-native-cli

# iOS specific (macOS only)
cd ios && pod install

# Android specific
# Ensure Android Studio and SDK are installed
```

## 🗄️ **Database Setup**

### **PostgreSQL Configuration**
```sql
-- Create database
CREATE DATABASE cybercrime_db;

-- Create user
CREATE USER cybercrime_user WITH ENCRYPTED PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE cybercrime_db TO cybercrime_user;

-- Connect to database
\c cybercrime_db;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables (run the schema from crime_data_service.py)
```

### **Environment Variables Setup**
Create `.env` files:

**Backend (.env)**
```env
# Database
DATABASE_URL=postgresql://cybercrime_user:your_secure_password@localhost:5432/cybercrime_db
SQLITE_DB_PATH=cybercrime.db

# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
FROM_EMAIL=alerts@cybercrimeunit.gov.in

# SMS Configuration - Twilio
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_FROM_NUMBER=+1234567890

# SMS Configuration - MSG91 (India)
MSG91_AUTH_KEY=your_msg91_key
MSG91_SENDER_ID=POLICE

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# Banking APIs
RBI_API_KEY=your_rbi_api_key
NPCI_API_KEY=your_npci_api_key
PAYTM_API_KEY=your_paytm_api_key
PHONEPE_API_KEY=your_phonepe_api_key
GOOGLEPAY_API_KEY=your_googlepay_api_key

# Social Media APIs
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_SECRET=your_twitter_access_secret

# Security
JWT_SECRET_KEY=your_jwt_secret_key
API_SECRET_KEY=your_api_secret_key

# External Services
OPENCAGE_API_KEY=your_geocoding_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

**Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
REACT_APP_WEBSOCKET_URL=ws://localhost:5000
```

## 🔌 **API Integration Steps**

### **1. Banking Fraud APIs**

#### **RBI Integration**
```python
# Register with Reserve Bank of India
# Contact: rbi.fraud.monitoring@rbi.org.in
# Documentation: https://rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx

# API Endpoints:
# GET /api/v1/fraud-alerts
# GET /api/v1/suspicious-transactions
# POST /api/v1/report-fraud
```

#### **NPCI Integration**
```python
# Register with National Payments Corporation of India
# Contact: api.support@npci.org.in
# Documentation: https://www.npci.org.in/what-we-do/upi/upi-api

# API Endpoints:
# GET /api/v1/upi-frauds
# GET /api/v1/transaction-alerts
# POST /api/v1/fraud-report
```

#### **Banking Partners**
```python
# Major Banks API Integration:
# HDFC Bank: https://developer.hdfcbank.com
# ICICI Bank: https://developer.icicibank.com
# SBI: https://developer.onlinesbi.com
# Axis Bank: https://developer.axisbank.com

# Payment Apps:
# PayTM: https://developer.paytm.com
# PhonePe: https://developer.phonepe.com
# Google Pay: https://developers.google.com/pay
```

### **2. Social Media Monitoring**

#### **Twitter API v2**
```python
# Apply for Twitter Developer Account
# https://developer.twitter.com/en/apply-for-access

# Required permissions:
# - Read tweets
# - Monitor mentions
# - Search historical tweets
# - Real-time streaming

# Setup webhooks for real-time monitoring
```

#### **Telegram Bot API**
```python
# Create bot via @BotFather
# Documentation: https://core.telegram.org/bots/api

# Monitor groups and channels for fraud reports
# Setup webhook for real-time monitoring
```

### **3. Government Data Sources**

#### **CERT-In Integration**
```python
# Contact: cert-in@cert-in.org.in
# Documentation: https://www.cert-in.org.in

# API Access for:
# - Cyber incident reports
# - Threat intelligence
# - Vulnerability alerts
```

#### **Police Database Integration**
```python
# Contact local cybercrime units:
# Delhi Police: dcp-cyber@delhipolice.gov.in
# Mumbai Police: cyberps.mumbai@maharashtrapolice.gov.in
# Cyber Crime Coordination Centre: ccc@nic.in

# Required data:
# - FIR records
# - Complaint data
# - Investigation status
# - Geographic crime data
```

## 🧪 **Testing Procedures**

### **1. Backend Testing**
```bash
# Unit tests
cd backend
python -m pytest tests/ -v

# API endpoint testing
python test_api.py

# Database connection testing
python test_database.py

# ML model testing
python test_models.py

# Alert system testing
python test_alerts.py
```

### **2. Frontend Testing**
```bash
# Unit tests
cd frontend
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Build testing
npm run build
npm run test:build
```

### **3. Mobile App Testing**
```bash
# Unit tests
cd mobile
npm test

# iOS testing (macOS only)
npm run ios

# Android testing
npm run android

# Build testing
npm run build
```

### **4. End-to-End Testing**

#### **Test Scenarios**
1. **Real-time Alert Flow**
   - Trigger test incident
   - Verify alert generation
   - Check SMS/Email delivery
   - Confirm mobile app notification

2. **Prediction Accuracy**
   - Feed historical data
   - Compare predictions vs actual
   - Measure accuracy metrics
   - Validate risk assessment

3. **Dashboard Functionality**
   - Login as different roles
   - Verify data visualization
   - Test filter functionality
   - Check real-time updates

4. **Mobile App Integration**
   - Login functionality
   - Push notifications
   - Map visualization
   - Alert management

## 🚀 **Deployment Guide**

### **1. Backend Deployment**
```bash
# Production server setup
sudo apt update
sudo apt install python3 python3-pip postgresql postgresql-contrib nginx

# Install dependencies
cd backend
pip install -r requirements.txt
pip install gunicorn

# Database setup
sudo -u postgres createdb cybercrime_db
sudo -u postgres createuser cybercrime_user

# Run migrations
python create_database.py

# Start application
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### **2. Frontend Deployment**
```bash
# Build for production
cd frontend
npm run build

# Deploy to web server
sudo cp -r build/* /var/www/html/

# Configure nginx
sudo nano /etc/nginx/sites-available/cybercrime
```

### **3. Mobile App Deployment**

#### **Android**
```bash
cd mobile/android
./gradlew assembleRelease

# Sign APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore cybercrime.keystore app-release-unsigned.apk cybercrime

# Optimize APK
zipalign -v 4 app-release-unsigned.apk CyberCrime.apk
```

#### **iOS**
```bash
# Open in Xcode
open mobile/ios/CyberCrimeMobile.xcworkspace

# Archive and upload to App Store
# Product > Archive > Distribute App
```

## 📊 **Monitoring & Maintenance**

### **1. System Monitoring**
```python
# Health check endpoints
GET /api/health
GET /api/database/health
GET /api/ml/health
GET /api/alerts/health

# Performance metrics
GET /api/metrics/performance
GET /api/metrics/alerts
GET /api/metrics/predictions
```

### **2. Log Monitoring**
```bash
# Application logs
tail -f logs/app.log

# Error logs
tail -f logs/error.log

# Alert logs
tail -f logs/alerts.log

# Database logs
tail -f /var/log/postgresql/postgresql.log
```

### **3. Model Retraining**
```python
# Schedule daily model retraining
# Run every day at 2 AM
crontab -e
0 2 * * * cd /path/to/backend && python retrain_models.py

# Weekly full retraining
0 2 * * 0 cd /path/to/backend && python full_retrain.py
```

## 🔒 **Security Considerations**

### **1. Data Protection**
- Encrypt all sensitive data
- Use HTTPS for all communications
- Implement rate limiting
- Regular security audits

### **2. Access Control**
- Role-based permissions
- Multi-factor authentication
- Session management
- API key rotation

### **3. Compliance**
- Data retention policies
- Privacy regulations (GDPR)
- Law enforcement protocols
- Audit trail maintenance

## 📞 **Support & Contacts**

### **Technical Support**
- **Email**: tech.support@cybercrimeunit.gov.in
- **Phone**: +91-11-2692-xxxx
- **Emergency**: 1930 (Cyber Crime Helpline)

### **API Support**
- **RBI**: rbi.fraud.monitoring@rbi.org.in
- **NPCI**: api.support@npci.org.in
- **CERT-In**: cert-in@cert-in.org.in

### **Law Enforcement Coordination**
- **Delhi Police Cyber**: dcp-cyber@delhipolice.gov.in
- **CBI Cyber**: cyber@cbi.gov.in
- **I4C**: director@i4c.gov.in

---

## ✅ **Completion Checklist**

- [ ] Backend services deployed and running
- [ ] Database configured with real data sources
- [ ] API integrations established
- [ ] Frontend deployed and accessible
- [ ] Mobile app built and distributed
- [ ] Alert system configured and tested
- [ ] Monitoring systems active
- [ ] Security measures implemented
- [ ] Documentation completed
- [ ] Training provided to law enforcement
- [ ] Go-live approval obtained

**🎉 Your Predictive Analytics Framework for Cybercrime Complaints is now ready for production!**