"""
Real-time data processing service for live cybercrime prediction
"""
import asyncio
import json
import pandas as pd
from datetime import datetime, timedelta
import numpy as np
from typing import Dict, List, Any
import threading
import queue
import time

class RealTimeDataProcessor:
    def __init__(self):
        self.data_queue = queue.Queue()
        self.subscribers = []
        self.is_running = False
        self.prediction_cache = {}
        self.last_update = datetime.now()
        
    def start_processing(self):
        """Start the real-time processing thread"""
        self.is_running = True
        self.processing_thread = threading.Thread(target=self._process_data_loop)
        self.processing_thread.daemon = True
        self.processing_thread.start()
        print("🔄 Real-time data processor started")
    
    def stop_processing(self):
        """Stop the real-time processing"""
        self.is_running = False
        if hasattr(self, 'processing_thread'):
            self.processing_thread.join()
        print("⏹️ Real-time data processor stopped")
    
    def _process_data_loop(self):
        """Main processing loop"""
        while self.is_running:
            try:
                # Process incoming data every 5 seconds
                self._fetch_and_process_new_data()
                time.sleep(5)
            except Exception as e:
                print(f"Error in processing loop: {e}")
                time.sleep(1)
    
    def _fetch_and_process_new_data(self):
        """Fetch new data and trigger predictions"""
        # In production, this would connect to:
        # - Police databases
        # - Banking fraud APIs
        # - CERT-In feeds
        # - Social media monitoring
        
        # For now, simulate real-time data with realistic patterns
        new_incidents = self._simulate_real_time_incidents()
        
        if new_incidents:
            # Process each incident
            for incident in new_incidents:
                self._process_incident(incident)
            
            # Update prediction cache
            self._update_predictions()
            
            # Notify subscribers
            self._notify_subscribers()
    
    def _simulate_real_time_incidents(self):
        """Simulate incoming cybercrime incidents with realistic patterns"""
        incidents = []
        
        # Simulate 0-3 new incidents every 5 seconds (realistic for a city)
        incident_count = np.random.poisson(0.5)  # Average 0.5 incidents per 5 seconds
        
        current_time = datetime.now()
        
        for i in range(incident_count):
            # Create realistic incident patterns
            incident = {
                'id': f"INC_{current_time.strftime('%Y%m%d_%H%M%S')}_{i}",
                'timestamp': current_time.isoformat(),
                'type': np.random.choice([
                    'UPI Fraud', 'Phishing', 'Investment Scam', 
                    'OTP Fraud', 'Romance Scam', 'Loan App Fraud'
                ], p=[0.35, 0.25, 0.15, 0.12, 0.08, 0.05]),
                'amount': self._generate_realistic_amount(),
                'location': self._generate_realistic_location(),
                'victim_age': np.random.randint(18, 75),
                'method': np.random.choice([
                    'Mobile App', 'SMS', 'Phone Call', 'Email', 'Social Media'
                ]),
                'status': 'new',
                'source': 'real_time_feed'
            }
            incidents.append(incident)
        
        return incidents
    
    def _generate_realistic_amount(self):
        """Generate realistic fraud amounts based on Indian cybercrime data"""
        # Based on actual cybercrime statistics
        amount_type = np.random.choice(['small', 'medium', 'large'], p=[0.6, 0.3, 0.1])
        
        if amount_type == 'small':
            return np.random.randint(1000, 50000)  # ₹1K - ₹50K
        elif amount_type == 'medium':
            return np.random.randint(50000, 500000)  # ₹50K - ₹5L
        else:
            return np.random.randint(500000, 5000000)  # ₹5L - ₹50L
    
    def _generate_realistic_location(self):
        """Generate realistic locations with higher probability for known hotspots"""
        # Indian cities with cybercrime hotspots
        hotspots = [
            {'city': 'Delhi', 'area': 'Connaught Place', 'lat': 28.6289, 'lng': 77.2065, 'weight': 0.15},
            {'city': 'Delhi', 'area': 'Karol Bagh', 'lat': 28.6514, 'lng': 77.1906, 'weight': 0.12},
            {'city': 'Mumbai', 'area': 'Andheri', 'lat': 19.1136, 'lng': 72.8697, 'weight': 0.10},
            {'city': 'Bangalore', 'area': 'Whitefield', 'lat': 12.9698, 'lng': 77.7500, 'weight': 0.08},
            {'city': 'Hyderabad', 'area': 'HITEC City', 'lat': 17.4435, 'lng': 78.3772, 'weight': 0.07},
            {'city': 'Chennai', 'area': 'T Nagar', 'lat': 13.0418, 'lng': 80.2341, 'weight': 0.06},
            {'city': 'Pune', 'area': 'Hinjewadi', 'lat': 18.5912, 'lng': 73.7389, 'weight': 0.05},
            {'city': 'Gurgaon', 'area': 'Cyber City', 'lat': 28.4950, 'lng': 77.0920, 'weight': 0.12},
            {'city': 'Noida', 'area': 'Sector 62', 'lat': 28.6271, 'lng': 77.3716, 'weight': 0.08},
        ]
        
        # Add weight for time-based patterns (office hours = higher risk)
        hour = datetime.now().hour
        if 9 <= hour <= 18:  # Office hours
            weights = [loc['weight'] * 1.5 for loc in hotspots]
        else:
            weights = [loc['weight'] for loc in hotspots]
        
        # Normalize weights
        total_weight = sum(weights)
        weights = [w/total_weight for w in weights]
        
        selected_location = np.random.choice(hotspots, p=weights)
        
        # Add some random variation to coordinates
        lat_variation = np.random.uniform(-0.01, 0.01)
        lng_variation = np.random.uniform(-0.01, 0.01)
        
        return {
            'city': selected_location['city'],
            'area': selected_location['area'],
            'latitude': selected_location['lat'] + lat_variation,
            'longitude': selected_location['lng'] + lng_variation
        }
    
    def _process_incident(self, incident):
        """Process individual incident for real-time analysis"""
        # Add to processing queue
        self.data_queue.put(incident)
        
        # Immediate risk assessment
        risk_score = self._calculate_immediate_risk(incident)
        incident['risk_score'] = risk_score
        
        # Check for alert conditions
        if risk_score > 0.8 or incident['amount'] > 1000000:
            self._trigger_alert(incident)
    
    def _calculate_immediate_risk(self, incident):
        """Calculate immediate risk score for new incident"""
        risk_factors = {
            'amount': min(incident['amount'] / 1000000, 1.0),  # Normalize to millions
            'location_risk': self._get_location_risk(incident['location']),
            'time_risk': self._get_time_risk(),
            'type_risk': self._get_type_risk(incident['type']),
            'frequency_risk': self._get_frequency_risk(incident['location'])
        }
        
        # Weighted risk calculation
        weights = {'amount': 0.3, 'location_risk': 0.25, 'time_risk': 0.15, 
                  'type_risk': 0.2, 'frequency_risk': 0.1}
        
        total_risk = sum(risk_factors[factor] * weights[factor] 
                        for factor in risk_factors)
        
        return min(total_risk, 1.0)
    
    def _get_location_risk(self, location):
        """Get risk score based on location"""
        high_risk_cities = ['Delhi', 'Mumbai', 'Bangalore', 'Gurgaon']
        if location['city'] in high_risk_cities:
            return 0.8
        return 0.4
    
    def _get_time_risk(self):
        """Get risk score based on current time"""
        hour = datetime.now().hour
        if 10 <= hour <= 16:  # Peak fraud hours
            return 0.9
        elif 9 <= hour <= 18:  # Business hours
            return 0.7
        return 0.3
    
    def _get_type_risk(self, fraud_type):
        """Get risk score based on fraud type"""
        type_risks = {
            'Investment Scam': 0.9,
            'UPI Fraud': 0.8,
            'Phishing': 0.7,
            'OTP Fraud': 0.8,
            'Romance Scam': 0.6,
            'Loan App Fraud': 0.7
        }
        return type_risks.get(fraud_type, 0.5)
    
    def _get_frequency_risk(self, location):
        """Get risk based on recent incident frequency in area"""
        # In production, query database for recent incidents in area
        # For now, simulate based on city
        high_frequency_cities = ['Delhi', 'Gurgaon', 'Mumbai']
        if location['city'] in high_frequency_cities:
            return 0.8
        return 0.4
    
    def _trigger_alert(self, incident):
        """Trigger high-priority alert for critical incidents"""
        alert = {
            'id': f"ALERT_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            'incident_id': incident['id'],
            'type': 'high_risk_incident',
            'priority': 'critical' if incident['amount'] > 1000000 else 'high',
            'message': f"High-risk {incident['type']} detected: ₹{incident['amount']:,} in {incident['location']['city']}",
            'timestamp': datetime.now().isoformat(),
            'location': incident['location'],
            'recommended_action': self._get_recommended_action(incident)
        }
        
        # In production, send to alert management system
        print(f"🚨 ALERT: {alert['message']}")
    
    def _get_recommended_action(self, incident):
        """Get recommended action for incident"""
        if incident['amount'] > 1000000:
            return "Immediate investigation required - Contact victim and freeze accounts"
        elif incident['risk_score'] > 0.8:
            return "High priority - Verify with victim within 1 hour"
        else:
            return "Monitor for patterns - Standard investigation"
    
    def _update_predictions(self):
        """Update prediction cache with latest data"""
        try:
            # Get recent incidents for prediction
            recent_incidents = self._get_recent_incidents()
            
            if recent_incidents:
                # Update hotspot predictions
                self.prediction_cache['hotspots'] = self._predict_hotspots(recent_incidents)
                
                # Update trend predictions
                self.prediction_cache['trends'] = self._predict_trends(recent_incidents)
                
                # Update risk areas
                self.prediction_cache['risk_areas'] = self._identify_risk_areas(recent_incidents)
                
                self.last_update = datetime.now()
                
        except Exception as e:
            print(f"Error updating predictions: {e}")
    
    def _get_recent_incidents(self):
        """Get incidents from last hour for analysis"""
        incidents = []
        temp_queue = queue.Queue()
        
        # Extract all items from queue
        while not self.data_queue.empty():
            try:
                incident = self.data_queue.get_nowait()
                incidents.append(incident)
                temp_queue.put(incident)  # Keep for later processing
            except queue.Empty:
                break
        
        # Put items back in queue
        while not temp_queue.empty():
            self.data_queue.put(temp_queue.get_nowait())
        
        # Filter for last hour
        cutoff_time = datetime.now() - timedelta(hours=1)
        recent_incidents = [
            incident for incident in incidents 
            if datetime.fromisoformat(incident['timestamp'].replace('Z', '+00:00').replace('+00:00', '')) > cutoff_time
        ]
        
        return recent_incidents
    
    def _predict_hotspots(self, incidents):
        """Predict likely hotspots based on recent incidents"""
        if not incidents:
            return []
        
        # Group by location
        location_counts = {}
        for incident in incidents:
            city = incident['location']['city']
            if city not in location_counts:
                location_counts[city] = 0
            location_counts[city] += 1
        
        # Predict next hour hotspots
        hotspots = []
        for city, count in location_counts.items():
            if count >= 2:  # Threshold for hotspot prediction
                predicted_incidents = count * 1.5  # Simple prediction
                hotspots.append({
                    'city': city,
                    'predicted_incidents': int(predicted_incidents),
                    'confidence': min(0.9, count * 0.2),
                    'risk_level': 'high' if predicted_incidents > 3 else 'medium'
                })
        
        return sorted(hotspots, key=lambda x: x['predicted_incidents'], reverse=True)
    
    def _predict_trends(self, incidents):
        """Predict fraud trends based on recent patterns"""
        if not incidents:
            return {}
        
        # Analyze fraud types
        type_counts = {}
        for incident in incidents:
            fraud_type = incident['type']
            if fraud_type not in type_counts:
                type_counts[fraud_type] = 0
            type_counts[fraud_type] += 1
        
        # Predict trending fraud types
        total_incidents = len(incidents)
        trends = {}
        for fraud_type, count in type_counts.items():
            percentage = (count / total_incidents) * 100
            if percentage > 20:  # Trending threshold
                trends[fraud_type] = {
                    'percentage': percentage,
                    'growth_rate': percentage * 1.2,  # Predicted growth
                    'status': 'increasing' if percentage > 25 else 'stable'
                }
        
        return trends
    
    def _identify_risk_areas(self, incidents):
        """Identify high-risk geographical areas"""
        if not incidents:
            return []
        
        area_risks = {}
        for incident in incidents:
            area = f"{incident['location']['city']}-{incident['location']['area']}"
            if area not in area_risks:
                area_risks[area] = {
                    'incidents': 0,
                    'total_amount': 0,
                    'location': incident['location']
                }
            
            area_risks[area]['incidents'] += 1
            area_risks[area]['total_amount'] += incident['amount']
        
        # Calculate risk scores
        risk_areas = []
        for area, data in area_risks.items():
            risk_score = (data['incidents'] * 0.6) + (data['total_amount'] / 1000000 * 0.4)
            if risk_score > 1.0:  # High risk threshold
                risk_areas.append({
                    'area': area,
                    'risk_score': min(risk_score, 1.0),
                    'incidents': data['incidents'],
                    'total_amount': data['total_amount'],
                    'location': data['location']
                })
        
        return sorted(risk_areas, key=lambda x: x['risk_score'], reverse=True)
    
    def _notify_subscribers(self):
        """Notify all subscribers of new predictions"""
        for subscriber in self.subscribers:
            try:
                subscriber(self.prediction_cache)
            except Exception as e:
                print(f"Error notifying subscriber: {e}")
    
    def subscribe(self, callback):
        """Subscribe to real-time prediction updates"""
        self.subscribers.append(callback)
    
    def get_current_predictions(self):
        """Get current prediction cache"""
        return {
            'predictions': self.prediction_cache,
            'last_update': self.last_update.isoformat(),
            'status': 'active' if self.is_running else 'inactive'
        }

# Global instance
real_time_processor = RealTimeDataProcessor()