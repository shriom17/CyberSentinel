"""
Real-Time Location-Based Crime Detection Service
Monitors live locations, GPS coordinates, and geographic patterns for cybercrime detection
"""
import asyncio
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple, Optional
import math
import logging
from dataclasses import dataclass, asdict
from geopy.distance import geodesic
from geopy.geocoders import Nominatim
import requests
import websockets
import redis
from collections import defaultdict
import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler

@dataclass
class LocationData:
    user_id: str
    latitude: float
    longitude: float
    timestamp: datetime
    accuracy: float
    device_id: str
    app_source: str  # 'mobile_banking', 'payment_app', 'atm_app'
    session_id: str
    transaction_id: Optional[str] = None
    
@dataclass
class GeofenceAlert:
    alert_id: str
    location: LocationData
    alert_type: str
    risk_level: str
    message: str
    nearby_incidents: List[Dict]
    prediction_confidence: float

@dataclass
class MovementPattern:
    user_id: str
    locations: List[LocationData]
    pattern_type: str  # 'normal', 'suspicious', 'high_risk'
    risk_score: float
    anomaly_indicators: List[str]

class RealTimeLocationDetector:
    def __init__(self):
        self.setup_logging()
        self.setup_redis()
        self.setup_geofences()
        self.setup_ml_models()
        self.active_sessions = {}
        self.location_history = defaultdict(list)
        self.suspicious_patterns = {}
        
    def setup_logging(self):
        """Setup logging for location tracking"""
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
    def setup_redis(self):
        """Setup Redis for real-time location caching"""
        try:
            self.redis_client = redis.Redis(
                host='localhost', 
                port=6379, 
                decode_responses=True
            )
            self.redis_client.ping()
            self.logger.info("✅ Redis connected for real-time location tracking")
        except Exception as e:
            self.logger.warning(f"⚠️ Redis not available: {e}")
            self.redis_client = None
            
    def setup_geofences(self):
        """Setup geofences for high-risk areas"""
        # ATM clusters and banking districts
        self.high_risk_geofences = [
            {
                'name': 'Connaught Place ATM Cluster',
                'center': {'lat': 28.6315, 'lng': 77.2167},
                'radius': 500,  # meters
                'risk_level': 'high',
                'alert_threshold': 3  # incidents in area
            },
            {
                'name': 'Karol Bagh Banking District',
                'center': {'lat': 28.6519, 'lng': 77.1909},
                'radius': 800,
                'risk_level': 'medium',
                'alert_threshold': 5
            },
            {
                'name': 'Cyber City Gurgaon',
                'center': {'lat': 28.4950, 'lng': 77.0890},
                'radius': 1000,
                'risk_level': 'high',
                'alert_threshold': 2
            },
            {
                'name': 'Nehru Place Tech Hub',
                'center': {'lat': 28.5506, 'lng': 77.2506},
                'radius': 600,
                'risk_level': 'very_high',
                'alert_threshold': 1
            }
        ]
        
        # ATM locations with recent fraud reports
        self.atm_fraud_hotspots = [
            {'lat': 28.6139, 'lng': 77.2090, 'bank': 'HDFC', 'recent_incidents': 5},
            {'lat': 28.5244, 'lng': 77.1855, 'bank': 'SBI', 'recent_incidents': 3},
            {'lat': 28.4595, 'lng': 77.0266, 'bank': 'ICICI', 'recent_incidents': 7},
            {'lat': 28.7041, 'lng': 77.1025, 'bank': 'Axis', 'recent_incidents': 4}
        ]
        
    def setup_ml_models(self):
        """Setup ML models for pattern detection"""
        self.location_clusterer = DBSCAN(eps=0.01, min_samples=3)  # ~1km radius
        self.scaler = StandardScaler()
        self.movement_analyzer = MovementPatternAnalyzer()
        
    async def track_user_location(self, location_data: LocationData) -> Dict[str, Any]:
        """Track user location and detect real-time risks"""
        try:
            # Store location in Redis for real-time access
            if self.redis_client:
                await self.cache_location(location_data)
            
            # Add to location history
            self.location_history[location_data.user_id].append(location_data)
            
            # Keep only last 100 locations per user
            if len(self.location_history[location_data.user_id]) > 100:
                self.location_history[location_data.user_id] = \
                    self.location_history[location_data.user_id][-100:]
            
            # Perform real-time risk analysis
            risk_analysis = await self.analyze_location_risk(location_data)
            
            # Check geofence violations
            geofence_alerts = await self.check_geofences(location_data)
            
            # Analyze movement patterns
            movement_analysis = await self.analyze_movement_patterns(location_data)
            
            # Check proximity to known fraud locations
            proximity_alerts = await self.check_fraud_proximity(location_data)
            
            # Generate real-time alerts if needed
            alerts = []
            if risk_analysis['risk_level'] in ['high', 'critical']:
                alerts.extend(await self.generate_location_alerts(location_data, risk_analysis))
            
            if geofence_alerts:
                alerts.extend(geofence_alerts)
                
            if proximity_alerts:
                alerts.extend(proximity_alerts)
            
            result = {
                'location_id': f"loc_{int(time.time())}_{location_data.user_id}",
                'timestamp': location_data.timestamp.isoformat(),
                'risk_analysis': risk_analysis,
                'movement_patterns': movement_analysis,
                'geofence_status': geofence_alerts,
                'proximity_alerts': proximity_alerts,
                'real_time_alerts': alerts,
                'recommendations': self.generate_recommendations(risk_analysis, alerts)
            }
            
            # Log high-risk locations
            if risk_analysis['risk_level'] in ['high', 'critical']:
                self.logger.warning(f"🚨 High-risk location detected: {location_data.user_id} at {location_data.latitude}, {location_data.longitude}")
            
            return result
            
        except Exception as e:
            self.logger.error(f"❌ Location tracking error: {e}")
            return {'error': str(e)}
    
    async def cache_location(self, location_data: LocationData):
        """Cache location data in Redis for real-time access"""
        try:
            key = f"location:{location_data.user_id}"
            data = {
                'latitude': location_data.latitude,
                'longitude': location_data.longitude,
                'timestamp': location_data.timestamp.isoformat(),
                'accuracy': location_data.accuracy,
                'device_id': location_data.device_id,
                'app_source': location_data.app_source
            }
            
            # Store current location
            self.redis_client.hset(key, mapping=data)
            self.redis_client.expire(key, 3600)  # Expire after 1 hour
            
            # Store in location timeline
            timeline_key = f"timeline:{location_data.user_id}"
            self.redis_client.zadd(timeline_key, {json.dumps(data): time.time()})
            
            # Keep only last 24 hours
            cutoff = time.time() - 86400
            self.redis_client.zremrangebyscore(timeline_key, 0, cutoff)
            
        except Exception as e:
            self.logger.error(f"❌ Redis caching error: {e}")
    
    async def analyze_location_risk(self, location_data: LocationData) -> Dict[str, Any]:
        """Analyze risk level of current location"""
        try:
            risk_factors = []
            risk_score = 0.0
            
            # Check if location is in high-crime area
            crime_density = await self.get_crime_density(location_data.latitude, location_data.longitude)
            if crime_density > 0.7:
                risk_factors.append("High crime density area")
                risk_score += 30
            
            # Check time of day (higher risk during night)
            hour = location_data.timestamp.hour
            if 22 <= hour or hour <= 5:  # Night time
                risk_factors.append("Night time activity")
                risk_score += 20
            
            # Check location accuracy (poor GPS might indicate spoofing)
            if location_data.accuracy > 100:  # meters
                risk_factors.append("Poor location accuracy")
                risk_score += 15
            
            # Check for rapid location changes (impossible travel)
            if await self.detect_impossible_travel(location_data):
                risk_factors.append("Impossible travel pattern detected")
                risk_score += 40
            
            # Check proximity to recent fraud locations
            nearby_frauds = await self.get_nearby_recent_frauds(
                location_data.latitude, location_data.longitude, radius=1000
            )
            if len(nearby_frauds) > 2:
                risk_factors.append(f"{len(nearby_frauds)} recent frauds within 1km")
                risk_score += len(nearby_frauds) * 10
            
            # Check if multiple users at same exact location (suspicious)
            concurrent_users = await self.get_concurrent_users_at_location(
                location_data.latitude, location_data.longitude
            )
            if len(concurrent_users) > 5:
                risk_factors.append("Multiple users at exact same location")
                risk_score += 25
            
            # Determine risk level
            if risk_score >= 70:
                risk_level = 'critical'
            elif risk_score >= 50:
                risk_level = 'high'
            elif risk_score >= 30:
                risk_level = 'medium'
            else:
                risk_level = 'low'
            
            return {
                'risk_score': min(risk_score, 100),
                'risk_level': risk_level,
                'risk_factors': risk_factors,
                'crime_density': crime_density,
                'nearby_frauds': len(nearby_frauds),
                'location_analysis': {
                    'is_atm_location': await self.is_atm_location(location_data),
                    'is_banking_district': await self.is_banking_district(location_data),
                    'is_tech_hub': await self.is_tech_hub(location_data)
                }
            }
            
        except Exception as e:
            self.logger.error(f"❌ Risk analysis error: {e}")
            return {'risk_score': 0, 'risk_level': 'unknown', 'error': str(e)}
    
    async def check_geofences(self, location_data: LocationData) -> List[GeofenceAlert]:
        """Check if location violates any geofences"""
        alerts = []
        
        try:
            for geofence in self.high_risk_geofences:
                distance = geodesic(
                    (location_data.latitude, location_data.longitude),
                    (geofence['center']['lat'], geofence['center']['lng'])
                ).meters
                
                if distance <= geofence['radius']:
                    # Get recent incidents in this geofence
                    nearby_incidents = await self.get_geofence_incidents(geofence)
                    
                    if len(nearby_incidents) >= geofence['alert_threshold']:
                        alert = GeofenceAlert(
                            alert_id=f"geo_{int(time.time())}_{location_data.user_id}",
                            location=location_data,
                            alert_type="geofence_violation",
                            risk_level=geofence['risk_level'],
                            message=f"User entered high-risk area: {geofence['name']} with {len(nearby_incidents)} recent incidents",
                            nearby_incidents=nearby_incidents,
                            prediction_confidence=0.85
                        )
                        alerts.append(alert)
                        
                        self.logger.warning(f"🚨 Geofence violation: {geofence['name']}")
            
            return alerts
            
        except Exception as e:
            self.logger.error(f"❌ Geofence check error: {e}")
            return []
    
    async def analyze_movement_patterns(self, location_data: LocationData) -> Dict[str, Any]:
        """Analyze user movement patterns for anomalies"""
        try:
            user_locations = self.location_history[location_data.user_id]
            
            if len(user_locations) < 3:
                return {'status': 'insufficient_data', 'pattern_type': 'unknown'}
            
            # Calculate movement statistics
            speeds = []
            distances = []
            
            for i in range(1, len(user_locations)):
                prev_loc = user_locations[i-1]
                curr_loc = user_locations[i]
                
                # Calculate distance
                distance = geodesic(
                    (prev_loc.latitude, prev_loc.longitude),
                    (curr_loc.latitude, curr_loc.longitude)
                ).meters
                
                # Calculate time difference
                time_diff = (curr_loc.timestamp - prev_loc.timestamp).total_seconds()
                
                if time_diff > 0:
                    speed = distance / time_diff  # meters per second
                    speeds.append(speed)
                    distances.append(distance)
            
            if not speeds:
                return {'status': 'no_movement', 'pattern_type': 'stationary'}
            
            avg_speed = np.mean(speeds)
            max_speed = max(speeds)
            total_distance = sum(distances)
            
            # Detect anomalies
            anomalies = []
            pattern_type = 'normal'
            risk_score = 0
            
            # Check for unrealistic speeds (>150 km/h might indicate GPS spoofing)
            if max_speed > 41.67:  # 150 km/h in m/s
                anomalies.append("Unrealistic travel speed detected")
                pattern_type = 'suspicious'
                risk_score += 40
            
            # Check for erratic movement (high speed variance)
            if len(speeds) > 2:
                speed_variance = np.var(speeds)
                if speed_variance > 100:  # High variance in speeds
                    anomalies.append("Erratic movement pattern")
                    pattern_type = 'suspicious'
                    risk_score += 20
            
            # Check for circular/repetitive patterns (casing behavior)
            if await self.detect_circular_movement(user_locations[-10:]):
                anomalies.append("Circular movement pattern detected")
                pattern_type = 'high_risk'
                risk_score += 30
            
            # Check for loitering near ATMs
            if await self.detect_atm_loitering(user_locations[-5:]):
                anomalies.append("Loitering near ATM detected")
                pattern_type = 'high_risk'
                risk_score += 35
            
            return {
                'pattern_type': pattern_type,
                'risk_score': min(risk_score, 100),
                'anomalies': anomalies,
                'movement_stats': {
                    'avg_speed_ms': round(avg_speed, 2),
                    'avg_speed_kmh': round(avg_speed * 3.6, 2),
                    'max_speed_ms': round(max_speed, 2),
                    'max_speed_kmh': round(max_speed * 3.6, 2),
                    'total_distance_m': round(total_distance, 2),
                    'data_points': len(user_locations)
                }
            }
            
        except Exception as e:
            self.logger.error(f"❌ Movement analysis error: {e}")
            return {'error': str(e), 'pattern_type': 'unknown'}
    
    async def check_fraud_proximity(self, location_data: LocationData) -> List[Dict[str, Any]]:
        """Check proximity to known fraud locations"""
        alerts = []
        
        try:
            # Check proximity to ATM fraud hotspots
            for hotspot in self.atm_fraud_hotspots:
                distance = geodesic(
                    (location_data.latitude, location_data.longitude),
                    (hotspot['lat'], hotspot['lng'])
                ).meters
                
                if distance <= 200:  # Within 200 meters
                    alert = {
                        'alert_type': 'fraud_proximity',
                        'risk_level': 'high' if hotspot['recent_incidents'] >= 5 else 'medium',
                        'message': f"Within 200m of {hotspot['bank']} ATM with {hotspot['recent_incidents']} recent fraud incidents",
                        'distance_meters': round(distance, 1),
                        'hotspot_details': hotspot,
                        'recommendation': 'Exercise extreme caution, verify transaction authenticity'
                    }
                    alerts.append(alert)
            
            return alerts
            
        except Exception as e:
            self.logger.error(f"❌ Proximity check error: {e}")
            return []
    
    async def detect_impossible_travel(self, location_data: LocationData) -> bool:
        """Detect impossible travel patterns"""
        try:
            user_locations = self.location_history[location_data.user_id]
            
            if len(user_locations) < 2:
                return False
            
            # Check last location
            prev_location = user_locations[-2] if len(user_locations) >= 2 else user_locations[-1]
            
            # Calculate distance and time
            distance = geodesic(
                (prev_location.latitude, prev_location.longitude),
                (location_data.latitude, location_data.longitude)
            ).kilometers
            
            time_diff = (location_data.timestamp - prev_location.timestamp).total_seconds() / 3600  # hours
            
            if time_diff <= 0:
                return True  # Time went backwards
            
            # Calculate required speed
            required_speed = distance / time_diff  # km/h
            
            # Consider impossible if speed > 200 km/h (accounting for flights)
            return required_speed > 200
            
        except Exception as e:
            self.logger.error(f"❌ Impossible travel detection error: {e}")
            return False
    
    async def detect_circular_movement(self, locations: List[LocationData]) -> bool:
        """Detect circular movement patterns (casing behavior)"""
        try:
            if len(locations) < 4:
                return False
            
            # Calculate center point
            center_lat = np.mean([loc.latitude for loc in locations])
            center_lng = np.mean([loc.longitude for loc in locations])
            
            # Check if all points are within small radius of center
            radius_threshold = 0.5  # km
            
            for location in locations:
                distance = geodesic(
                    (location.latitude, location.longitude),
                    (center_lat, center_lng)
                ).kilometers
                
                if distance > radius_threshold:
                    return False
            
            # Check for actual movement (not just stationary)
            total_movement = 0
            for i in range(1, len(locations)):
                movement = geodesic(
                    (locations[i-1].latitude, locations[i-1].longitude),
                    (locations[i].latitude, locations[i].longitude)
                ).meters
                total_movement += movement
            
            # Circular pattern if moved significant distance within small area
            return total_movement > 500  # 500 meters of movement in small area
            
        except Exception as e:
            self.logger.error(f"❌ Circular movement detection error: {e}")
            return False
    
    async def detect_atm_loitering(self, locations: List[LocationData]) -> bool:
        """Detect loitering near ATM locations"""
        try:
            if len(locations) < 3:
                return False
            
            # Check if any location is near ATM
            for location in locations:
                if await self.is_atm_location(location, radius=100):  # 100m from ATM
                    # Check duration near ATM
                    atm_locations = [loc for loc in locations 
                                   if await self.is_atm_location(loc, radius=100)]
                    
                    if len(atm_locations) >= 3:  # Multiple readings near ATM
                        time_span = (atm_locations[-1].timestamp - atm_locations[0].timestamp).total_seconds()
                        
                        # Loitering if present for more than 10 minutes
                        return time_span > 600
            
            return False
            
        except Exception as e:
            self.logger.error(f"❌ ATM loitering detection error: {e}")
            return False
    
    # Helper methods
    async def get_crime_density(self, lat: float, lng: float) -> float:
        """Get crime density for location (0-1 scale)"""
        # This would connect to crime database
        # For demo, return calculated value based on known hotspots
        hotspot_centers = [
            (28.6315, 77.2167),  # Connaught Place
            (28.5506, 77.2506),  # Nehru Place
            (28.4950, 77.0890),  # Cyber City
        ]
        
        min_distance = float('inf')
        for center in hotspot_centers:
            distance = geodesic((lat, lng), center).kilometers
            min_distance = min(min_distance, distance)
        
        # Higher density closer to hotspots
        if min_distance < 1:
            return 0.9
        elif min_distance < 2:
            return 0.7
        elif min_distance < 5:
            return 0.5
        else:
            return 0.2
    
    async def get_nearby_recent_frauds(self, lat: float, lng: float, radius: int = 1000) -> List[Dict]:
        """Get recent fraud incidents near location"""
        # This would query the incidents database
        # For demo, return simulated data
        return [
            {'incident_id': 'INC001', 'type': 'atm_fraud', 'distance': 250},
            {'incident_id': 'INC002', 'type': 'card_skimming', 'distance': 450},
            {'incident_id': 'INC003', 'type': 'upi_fraud', 'distance': 780}
        ]
    
    async def get_concurrent_users_at_location(self, lat: float, lng: float) -> List[str]:
        """Get users currently at same location"""
        if not self.redis_client:
            return []
        
        try:
            # Search for users within 10 meters
            concurrent_users = []
            # This would implement geospatial search in Redis
            return concurrent_users
        except:
            return []
    
    async def is_atm_location(self, location_data: LocationData, radius: int = 50) -> bool:
        """Check if location is near an ATM"""
        for hotspot in self.atm_fraud_hotspots:
            distance = geodesic(
                (location_data.latitude, location_data.longitude),
                (hotspot['lat'], hotspot['lng'])
            ).meters
            if distance <= radius:
                return True
        return False
    
    async def is_banking_district(self, location_data: LocationData) -> bool:
        """Check if location is in banking district"""
        banking_districts = [
            {'lat': 28.6519, 'lng': 77.1909, 'radius': 800},  # Karol Bagh
            {'lat': 28.6315, 'lng': 77.2167, 'radius': 500},  # Connaught Place
        ]
        
        for district in banking_districts:
            distance = geodesic(
                (location_data.latitude, location_data.longitude),
                (district['lat'], district['lng'])
            ).meters
            if distance <= district['radius']:
                return True
        return False
    
    async def is_tech_hub(self, location_data: LocationData) -> bool:
        """Check if location is in tech hub"""
        tech_hubs = [
            {'lat': 28.4950, 'lng': 77.0890, 'radius': 1000},  # Cyber City
            {'lat': 28.5506, 'lng': 77.2506, 'radius': 600},   # Nehru Place
        ]
        
        for hub in tech_hubs:
            distance = geodesic(
                (location_data.latitude, location_data.longitude),
                (hub['lat'], hub['lng'])
            ).meters
            if distance <= hub['radius']:
                return True
        return False
    
    async def get_geofence_incidents(self, geofence: Dict) -> List[Dict]:
        """Get recent incidents in geofence"""
        # This would query incidents database
        return [
            {'incident_id': 'GEO001', 'type': 'card_fraud', 'time': '2 hours ago'},
            {'incident_id': 'GEO002', 'type': 'atm_fraud', 'time': '5 hours ago'}
        ]
    
    async def generate_location_alerts(self, location_data: LocationData, risk_analysis: Dict) -> List[Dict]:
        """Generate real-time alerts based on location analysis"""
        alerts = []
        
        if risk_analysis['risk_level'] == 'critical':
            alerts.append({
                'alert_id': f"critical_{int(time.time())}_{location_data.user_id}",
                'type': 'critical_location_risk',
                'message': f"CRITICAL: User at high-risk location with {risk_analysis['risk_score']}% risk score",
                'location': {'lat': location_data.latitude, 'lng': location_data.longitude},
                'risk_factors': risk_analysis['risk_factors'],
                'immediate_action': 'Deploy nearest patrol unit, monitor transactions',
                'priority': 1
            })
        
        elif risk_analysis['risk_level'] == 'high':
            alerts.append({
                'alert_id': f"high_{int(time.time())}_{location_data.user_id}",
                'type': 'high_location_risk',
                'message': f"HIGH RISK: User location requires monitoring ({risk_analysis['risk_score']}% risk)",
                'location': {'lat': location_data.latitude, 'lng': location_data.longitude},
                'risk_factors': risk_analysis['risk_factors'],
                'immediate_action': 'Increase monitoring, prepare response team',
                'priority': 2
            })
        
        return alerts
    
    def generate_recommendations(self, risk_analysis: Dict, alerts: List) -> List[str]:
        """Generate recommendations based on analysis"""
        recommendations = []
        
        if risk_analysis['risk_level'] in ['critical', 'high']:
            recommendations.extend([
                "Deploy nearest patrol unit to location",
                "Monitor all financial transactions in area",
                "Alert nearby ATMs and banks",
                "Increase CCTV surveillance"
            ])
        
        if len(alerts) > 0:
            recommendations.extend([
                "Initiate rapid response protocol",
                "Coordinate with local police station",
                "Send safety alert to users in area"
            ])
        
        if risk_analysis.get('nearby_frauds', 0) > 3:
            recommendations.append("Establish temporary security checkpoint")
        
        return recommendations

# Movement Pattern Analyzer
class MovementPatternAnalyzer:
    def __init__(self):
        self.pattern_models = {}
        
    async def analyze_user_pattern(self, user_id: str, locations: List[LocationData]) -> MovementPattern:
        """Analyze movement pattern for specific user"""
        if len(locations) < 5:
            return MovementPattern(
                user_id=user_id,
                locations=locations,
                pattern_type='insufficient_data',
                risk_score=0.0,
                anomaly_indicators=[]
            )
        
        # Analyze patterns
        anomalies = []
        risk_score = 0.0
        
        # Check for time-based anomalies
        night_activities = [loc for loc in locations 
                          if 22 <= loc.timestamp.hour or loc.timestamp.hour <= 5]
        if len(night_activities) > len(locations) * 0.3:  # >30% night activity
            anomalies.append("High night-time activity")
            risk_score += 25
        
        # Check for location clustering (repeated visits to same area)
        if self.detect_location_clustering(locations):
            anomalies.append("Repeated visits to same location")
            risk_score += 20
        
        # Check for velocity anomalies
        if self.detect_velocity_anomalies(locations):
            anomalies.append("Unusual travel speeds detected")
            risk_score += 30
        
        # Determine pattern type
        if risk_score >= 60:
            pattern_type = 'high_risk'
        elif risk_score >= 30:
            pattern_type = 'suspicious'
        else:
            pattern_type = 'normal'
        
        return MovementPattern(
            user_id=user_id,
            locations=locations,
            pattern_type=pattern_type,
            risk_score=min(risk_score, 100.0),
            anomaly_indicators=anomalies
        )
    
    def detect_location_clustering(self, locations: List[LocationData]) -> bool:
        """Detect if user repeatedly visits same locations"""
        try:
            if len(locations) < 5:
                return False
            
            # Extract coordinates
            coords = [(loc.latitude, loc.longitude) for loc in locations]
            
            # Use DBSCAN clustering
            clusterer = DBSCAN(eps=0.001, min_samples=3)  # ~100m radius
            clusters = clusterer.fit_predict(coords)
            
            # Check if significant clustering exists
            unique_clusters = len(set(clusters)) - (1 if -1 in clusters else 0)
            return unique_clusters > 0 and len(locations) / unique_clusters > 3
            
        except:
            return False
    
    def detect_velocity_anomalies(self, locations: List[LocationData]) -> bool:
        """Detect unusual velocity patterns"""
        try:
            if len(locations) < 3:
                return False
            
            velocities = []
            for i in range(1, len(locations)):
                prev_loc = locations[i-1]
                curr_loc = locations[i]
                
                distance = geodesic(
                    (prev_loc.latitude, prev_loc.longitude),
                    (curr_loc.latitude, curr_loc.longitude)
                ).meters
                
                time_diff = (curr_loc.timestamp - prev_loc.timestamp).total_seconds()
                
                if time_diff > 0:
                    velocity = distance / time_diff  # m/s
                    velocities.append(velocity)
            
            if not velocities:
                return False
            
            # Check for extreme velocities or high variance
            max_velocity = max(velocities)
            velocity_variance = np.var(velocities) if len(velocities) > 1 else 0
            
            return max_velocity > 50 or velocity_variance > 500  # Thresholds for anomalies
            
        except:
            return False

# Global instance
realtime_location_detector = RealTimeLocationDetector()

# WebSocket handler for real-time location streaming
async def handle_location_stream(websocket, path):
    """Handle WebSocket connections for real-time location streaming"""
    try:
        async for message in websocket:
            data = json.loads(message)
            
            # Parse location data
            location_data = LocationData(
                user_id=data['user_id'],
                latitude=float(data['latitude']),
                longitude=float(data['longitude']),
                timestamp=datetime.fromisoformat(data['timestamp']),
                accuracy=float(data.get('accuracy', 10)),
                device_id=data['device_id'],
                app_source=data['app_source'],
                session_id=data['session_id'],
                transaction_id=data.get('transaction_id')
            )
            
            # Process location
            result = await realtime_location_detector.track_user_location(location_data)
            
            # Send response back
            await websocket.send(json.dumps(result))
            
    except Exception as e:
        logging.error(f"WebSocket error: {e}")
        await websocket.send(json.dumps({'error': str(e)}))

# API Endpoints for location tracking
async def track_location_api(request_data: Dict) -> Dict:
    """API endpoint for location tracking"""
    try:
        location_data = LocationData(**request_data)
        result = await realtime_location_detector.track_user_location(location_data)
        return {'success': True, 'data': result}
    except Exception as e:
        return {'success': False, 'error': str(e)}

async def get_user_risk_profile(user_id: str) -> Dict:
    """Get comprehensive risk profile for user"""
    try:
        user_locations = realtime_location_detector.location_history.get(user_id, [])
        
        if not user_locations:
            return {'user_id': user_id, 'status': 'no_data'}
        
        # Analyze recent patterns
        recent_locations = user_locations[-20:]  # Last 20 locations
        movement_analysis = realtime_location_detector.movement_analyzer.analyze_user_pattern(
            user_id, recent_locations
        )
        
        # Calculate overall risk metrics
        risk_metrics = {
            'total_locations_tracked': len(user_locations),
            'recent_risk_score': movement_analysis.risk_score,
            'pattern_type': movement_analysis.pattern_type,
            'anomaly_count': len(movement_analysis.anomaly_indicators),
            'high_risk_locations': sum(1 for loc in recent_locations 
                                     if await realtime_location_detector.analyze_location_risk(loc)['risk_level'] in ['high', 'critical']),
            'last_activity': user_locations[-1].timestamp.isoformat() if user_locations else None
        }
        
        return {
            'user_id': user_id,
            'risk_profile': risk_metrics,
            'movement_pattern': asdict(movement_analysis),
            'recommendations': realtime_location_detector.generate_recommendations(
                {'risk_level': movement_analysis.pattern_type, 'risk_score': movement_analysis.risk_score}, 
                []
            )
        }
        
    except Exception as e:
        return {'user_id': user_id, 'error': str(e)}