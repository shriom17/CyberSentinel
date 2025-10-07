"""
Real-Time Location Detection Demo
Demonstrates live location tracking and cybercrime detection capabilities
"""
import asyncio
import json
from datetime import datetime, timedelta
import time
from dataclasses import asdict

# Import our location services
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.services.realtime_location_service import (
    RealTimeLocationDetector,
    LocationData,
    track_location_api,
    get_user_risk_profile
)

async def demo_real_time_location_detection():
    """Demonstrate real-time location detection capabilities"""
    print("🌍 Real-Time Location Detection Demo")
    print("=" * 50)
    
    # Initialize detector
    detector = RealTimeLocationDetector()
    
    # Demo location data points (simulating real user movement)
    demo_locations = [
        {
            'user_id': 'demo_user_001',
            'latitude': 28.6315,  # Connaught Place (high-risk area)
            'longitude': 77.2167,
            'timestamp': datetime.now().isoformat(),
            'accuracy': 10.0,
            'device_id': 'device_001',
            'app_source': 'mobile_banking',
            'session_id': 'session_001'
        },
        {
            'user_id': 'demo_user_002',
            'latitude': 28.6139,  # Near HDFC ATM hotspot
            'longitude': 77.2090,
            'timestamp': datetime.now().isoformat(),
            'accuracy': 15.0,
            'device_id': 'device_002',
            'app_source': 'payment_app',
            'session_id': 'session_002'
        },
        {
            'user_id': 'demo_user_003',
            'latitude': 28.5506,  # Nehru Place (very high risk)
            'longitude': 77.2506,
            'timestamp': datetime.now().isoformat(),
            'accuracy': 8.0,
            'device_id': 'device_003',
            'app_source': 'atm_app',
            'session_id': 'session_003'
        }
    ]
    
    print("\n📍 Processing Real-Time Locations...")
    
    # Process each location
    for i, location_data in enumerate(demo_locations, 1):
        print(f"\n🔍 Location {i}: Processing...")
        print(f"   User: {location_data['user_id']}")
        print(f"   Coordinates: {location_data['latitude']}, {location_data['longitude']}")
        print(f"   App Source: {location_data['app_source']}")
        
        # Track location
        result = await track_location_api(location_data)
        
        if result['success']:
            data = result['data']
            risk_analysis = data.get('risk_analysis', {})
            
            print(f"   🎯 Risk Level: {risk_analysis.get('risk_level', 'unknown').upper()}")
            print(f"   📊 Risk Score: {risk_analysis.get('risk_score', 0):.1f}%")
            
            # Show risk factors
            risk_factors = risk_analysis.get('risk_factors', [])
            if risk_factors:
                print(f"   ⚠️  Risk Factors:")
                for factor in risk_factors:
                    print(f"      • {factor}")
            
            # Show alerts
            alerts = data.get('real_time_alerts', [])
            if alerts:
                print(f"   🚨 ALERTS GENERATED:")
                for alert in alerts:
                    print(f"      • {alert.get('type', 'unknown').upper()}: {alert.get('message', 'No message')}")
                    print(f"        Priority: {alert.get('priority', 'Unknown')}")
            
            # Show geofence violations
            geofence_status = data.get('geofence_status', [])
            if geofence_status:
                print(f"   🛡️  Geofence Violations:")
                for violation in geofence_status:
                    print(f"      • {violation.message}")
            
            # Show proximity alerts
            proximity_alerts = data.get('proximity_alerts', [])
            if proximity_alerts:
                print(f"   📍 Proximity Alerts:")
                for alert in proximity_alerts:
                    print(f"      • {alert.get('message', 'Unknown alert')}")
            
            # Show recommendations
            recommendations = data.get('recommendations', [])
            if recommendations:
                print(f"   💡 Recommendations:")
                for rec in recommendations[:3]:  # Show top 3
                    print(f"      • {rec}")
        
        else:
            print(f"   ❌ Error: {result.get('error', 'Unknown error')}")
        
        # Add delay between processing
        await asyncio.sleep(1)
    
    print("\n" + "=" * 50)
    print("📊 SUMMARY STATISTICS")
    print("=" * 50)
    
    # Show hotspots
    print("\n🔥 Current Fraud Hotspots:")
    for i, hotspot in enumerate(detector.atm_fraud_hotspots, 1):
        print(f"   {i}. {hotspot['bank']} ATM")
        print(f"      Location: {hotspot['lat']}, {hotspot['lng']}")
        print(f"      Recent Incidents: {hotspot['recent_incidents']}")
    
    # Show geofences
    print("\n🛡️ Active Geofences:")
    for i, geofence in enumerate(detector.high_risk_geofences, 1):
        print(f"   {i}. {geofence['name']}")
        print(f"      Risk Level: {geofence['risk_level'].upper()}")
        print(f"      Radius: {geofence['radius']}m")
    
    print("\n✅ Real-Time Location Detection Demo Complete!")
    print("\n🎯 Key Capabilities Demonstrated:")
    print("   • Live GPS coordinate tracking")
    print("   • Real-time risk assessment")
    print("   • Geofence violation detection")
    print("   • ATM fraud hotspot monitoring")
    print("   • Movement pattern analysis")
    print("   • Instant alert generation")
    print("   • Proximity-based warnings")

async def demo_user_movement_patterns():
    """Demonstrate movement pattern analysis"""
    print("\n" + "=" * 50)
    print("🚶 MOVEMENT PATTERN ANALYSIS DEMO")
    print("=" * 50)
    
    detector = RealTimeLocationDetector()
    
    # Simulate suspicious movement pattern (circular movement near ATM)
    base_time = datetime.now()
    suspicious_locations = []
    
    # Circular pattern around an ATM (potential casing behavior)
    center_lat, center_lng = 28.6139, 77.2090  # HDFC ATM location
    radius = 0.001  # Small radius for circular movement
    
    for i in range(8):
        angle = (i * 45) * 3.14159 / 180  # 45-degree increments
        lat = center_lat + radius * math.cos(angle)
        lng = center_lng + radius * math.sin(angle)
        
        location = LocationData(
            user_id='suspicious_user_001',
            latitude=lat,
            longitude=lng,
            timestamp=base_time + timedelta(minutes=i*5),
            accuracy=10.0,
            device_id='device_suspicious',
            app_source='mobile_banking',
            session_id='suspicious_session'
        )
        suspicious_locations.append(location)
    
    print("📍 Analyzing Suspicious Movement Pattern...")
    print("   Pattern: Circular movement around ATM location")
    print("   Duration: 40 minutes")
    print("   Location: HDFC ATM, Central Delhi")
    
    # Process all locations
    for location in suspicious_locations:
        result = await detector.track_user_location(location)
        await asyncio.sleep(0.5)  # Brief delay
    
    # Analyze final pattern
    movement_analysis = await detector.analyze_movement_patterns(suspicious_locations[-1])
    
    print(f"\n🔍 Analysis Results:")
    print(f"   Pattern Type: {movement_analysis.get('pattern_type', 'unknown').upper()}")
    print(f"   Risk Score: {movement_analysis.get('risk_score', 0):.1f}%")
    
    anomalies = movement_analysis.get('anomalies', [])
    if anomalies:
        print(f"   🚨 Anomalies Detected:")
        for anomaly in anomalies:
            print(f"      • {anomaly}")
    
    stats = movement_analysis.get('movement_stats', {})
    if stats:
        print(f"   📊 Movement Statistics:")
        print(f"      • Average Speed: {stats.get('avg_speed_kmh', 0):.1f} km/h")
        print(f"      • Max Speed: {stats.get('max_speed_kmh', 0):.1f} km/h")
        print(f"      • Total Distance: {stats.get('total_distance_m', 0):.1f} meters")

if __name__ == "__main__":
    import math
    
    print("🚀 Starting Real-Time Location Detection System Demo")
    print("This demo shows how the system can detect cybercrime in real-time using live GPS locations")
    
    # Run the demo
    asyncio.run(demo_real_time_location_detection())
    asyncio.run(demo_user_movement_patterns())