"""
Real-Time Location API Routes
Handles live location tracking, geofencing, and movement pattern analysis
"""
from flask import Blueprint, request, jsonify, Response
from flask_cors import cross_origin
import asyncio
import json
from datetime import datetime, timedelta
import logging
from typing import Dict, Any
import time

from app.services.realtime_location_service import (
    realtime_location_detector,
    LocationData,
    track_location_api,
    get_user_risk_profile
)

location_bp = Blueprint('location', __name__)
logger = logging.getLogger(__name__)

@location_bp.route('/track', methods=['POST'])
@cross_origin()
def track_user_location():
    """Track user location in real-time"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['user_id', 'latitude', 'longitude', 'device_id', 'app_source', 'session_id']
        if not all(field in data for field in required_fields):
            return jsonify({
                'success': False,
                'error': 'Missing required fields',
                'required_fields': required_fields
            }), 400
        
        # Add timestamp if not provided
        if 'timestamp' not in data:
            data['timestamp'] = datetime.now().isoformat()
        
        # Process location asynchronously
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(track_location_api(data))
        loop.close()
        
        # Determine response status based on risk level
        risk_level = result.get('data', {}).get('risk_analysis', {}).get('risk_level', 'low')
        status_code = 200
        
        if risk_level == 'critical':
            status_code = 207  # Multi-status to indicate high priority
        elif risk_level == 'high':
            status_code = 202  # Accepted but requires attention
        
        return jsonify(result), status_code
        
    except Exception as e:
        logger.error(f"❌ Location tracking error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@location_bp.route('/risk-profile/<user_id>', methods=['GET'])
@cross_origin()
def get_user_risk_analysis(user_id: str):
    """Get comprehensive risk profile for user"""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(get_user_risk_profile(user_id))
        loop.close()
        
        return jsonify({
            'success': True,
            'data': result,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"❌ Risk profile error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'user_id': user_id
        }), 500

@location_bp.route('/geofences', methods=['GET'])
@cross_origin()
def get_active_geofences():
    """Get all active geofences and their status"""
    try:
        geofences = []
        
        for geofence in realtime_location_detector.high_risk_geofences:
            # Get recent incidents in geofence
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            incidents = loop.run_until_complete(
                realtime_location_detector.get_geofence_incidents(geofence)
            )
            loop.close()
            
            geofence_info = {
                'name': geofence['name'],
                'center': geofence['center'],
                'radius': geofence['radius'],
                'risk_level': geofence['risk_level'],
                'alert_threshold': geofence['alert_threshold'],
                'current_incidents': len(incidents),
                'status': 'active' if len(incidents) >= geofence['alert_threshold'] else 'monitoring',
                'recent_incidents': incidents[:5]  # Last 5 incidents
            }
            geofences.append(geofence_info)
        
        return jsonify({
            'success': True,
            'data': {
                'geofences': geofences,
                'total_geofences': len(geofences),
                'active_alerts': len([g for g in geofences if g['status'] == 'active'])
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Geofences error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@location_bp.route('/hotspots', methods=['GET'])
@cross_origin()
def get_fraud_hotspots():
    """Get current fraud hotspots with live data"""
    try:
        hotspots = []
        
        for hotspot in realtime_location_detector.atm_fraud_hotspots:
            # Calculate current risk level
            base_risk = hotspot['recent_incidents']
            
            # Add real-time factors
            current_hour = datetime.now().hour
            night_multiplier = 1.5 if 22 <= current_hour or current_hour <= 5 else 1.0
            
            adjusted_risk = base_risk * night_multiplier
            
            # Determine alert level
            if adjusted_risk >= 7:
                alert_level = 'critical'
            elif adjusted_risk >= 5:
                alert_level = 'high'
            elif adjusted_risk >= 3:
                alert_level = 'medium'
            else:
                alert_level = 'low'
            
            hotspot_info = {
                'location': {
                    'latitude': hotspot['lat'],
                    'longitude': hotspot['lng']
                },
                'bank': hotspot['bank'],
                'recent_incidents': hotspot['recent_incidents'],
                'adjusted_risk_score': round(adjusted_risk, 1),
                'alert_level': alert_level,
                'current_time_factor': round(night_multiplier, 1),
                'recommendations': [
                    'Increase patrol frequency',
                    'Monitor CCTV feeds',
                    'Alert bank security'
                ] if alert_level in ['high', 'critical'] else ['Continue monitoring']
            }
            hotspots.append(hotspot_info)
        
        # Sort by risk level
        hotspots.sort(key=lambda x: x['adjusted_risk_score'], reverse=True)
        
        return jsonify({
            'success': True,
            'data': {
                'hotspots': hotspots,
                'total_hotspots': len(hotspots),
                'critical_hotspots': len([h for h in hotspots if h['alert_level'] == 'critical']),
                'high_risk_hotspots': len([h for h in hotspots if h['alert_level'] == 'high']),
                'last_updated': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Hotspots error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@location_bp.route('/live-alerts', methods=['GET'])
@cross_origin()
def get_live_location_alerts():
    """Get real-time location-based alerts"""
    try:
        # Get query parameters
        limit = request.args.get('limit', 50, type=int)
        risk_level = request.args.get('risk_level', 'all')
        
        # This would normally query a database of active alerts
        # For demo, generate sample live alerts
        live_alerts = []
        
        current_time = datetime.now()
        
        # Sample active alerts
        sample_alerts = [
            {
                'alert_id': f'LOC_{int(time.time())}_001',
                'type': 'geofence_violation',
                'risk_level': 'critical',
                'message': 'User entered high-risk area: Connaught Place ATM Cluster',
                'location': {'lat': 28.6315, 'lng': 77.2167},
                'user_id': 'USR_12345',
                'timestamp': current_time.isoformat(),
                'status': 'active',
                'response_time': '2 minutes ago'
            },
            {
                'alert_id': f'LOC_{int(time.time())}_002',
                'type': 'impossible_travel',
                'risk_level': 'high',
                'message': 'Impossible travel pattern detected: 150km in 10 minutes',
                'location': {'lat': 28.5506, 'lng': 77.2506},
                'user_id': 'USR_67890',
                'timestamp': current_time.isoformat(),
                'status': 'investigating',
                'response_time': '5 minutes ago'
            },
            {
                'alert_id': f'LOC_{int(time.time())}_003',
                'type': 'atm_loitering',
                'risk_level': 'high',
                'message': 'User loitering near HDFC ATM for 15 minutes',
                'location': {'lat': 28.6139, 'lng': 77.2090},
                'user_id': 'USR_11111',
                'timestamp': current_time.isoformat(),
                'status': 'active',
                'response_time': '1 minute ago'
            }
        ]
        
        # Filter by risk level if specified
        if risk_level != 'all':
            sample_alerts = [alert for alert in sample_alerts if alert['risk_level'] == risk_level]
        
        # Limit results
        sample_alerts = sample_alerts[:limit]
        
        return jsonify({
            'success': True,
            'data': {
                'alerts': sample_alerts,
                'total_alerts': len(sample_alerts),
                'filters': {
                    'risk_level': risk_level,
                    'limit': limit
                },
                'summary': {
                    'critical': len([a for a in sample_alerts if a['risk_level'] == 'critical']),
                    'high': len([a for a in sample_alerts if a['risk_level'] == 'high']),
                    'medium': len([a for a in sample_alerts if a['risk_level'] == 'medium']),
                    'low': len([a for a in sample_alerts if a['risk_level'] == 'low'])
                },
                'last_updated': current_time.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Live alerts error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@location_bp.route('/pattern-analysis/<user_id>', methods=['GET'])
@cross_origin()
def analyze_user_movement_patterns(user_id: str):
    """Analyze movement patterns for specific user"""
    try:
        # Get query parameters
        days = request.args.get('days', 7, type=int)
        
        user_locations = realtime_location_detector.location_history.get(user_id, [])
        
        if not user_locations:
            return jsonify({
                'success': True,
                'data': {
                    'user_id': user_id,
                    'status': 'no_data',
                    'message': 'No location data available for this user'
                }
            })
        
        # Filter by date range
        cutoff_date = datetime.now() - timedelta(days=days)
        recent_locations = [
            loc for loc in user_locations 
            if loc.timestamp >= cutoff_date
        ]
        
        if not recent_locations:
            return jsonify({
                'success': True,
                'data': {
                    'user_id': user_id,
                    'status': 'no_recent_data',
                    'message': f'No location data in last {days} days'
                }
            })
        
        # Analyze patterns
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        pattern_analysis = loop.run_until_complete(
            realtime_location_detector.movement_analyzer.analyze_user_pattern(
                user_id, recent_locations
            )
        )
        
        # Generate insights
        insights = {
            'total_locations': len(recent_locations),
            'date_range': {
                'start': recent_locations[0].timestamp.isoformat(),
                'end': recent_locations[-1].timestamp.isoformat(),
                'days': days
            },
            'geographic_spread': {
                'min_lat': min(loc.latitude for loc in recent_locations),
                'max_lat': max(loc.latitude for loc in recent_locations),
                'min_lng': min(loc.longitude for loc in recent_locations),
                'max_lng': max(loc.longitude for loc in recent_locations)
            },
            'app_usage': {
                app: len([loc for loc in recent_locations if loc.app_source == app])
                for app in set(loc.app_source for loc in recent_locations)
            },
            'hourly_activity': {
                hour: len([loc for loc in recent_locations if loc.timestamp.hour == hour])
                for hour in range(24)
            }
        }
        
        loop.close()
        
        return jsonify({
            'success': True,
            'data': {
                'user_id': user_id,
                'pattern_analysis': {
                    'pattern_type': pattern_analysis.pattern_type,
                    'risk_score': pattern_analysis.risk_score,
                    'anomaly_indicators': pattern_analysis.anomaly_indicators
                },
                'insights': insights,
                'recommendations': generate_user_recommendations(pattern_analysis, insights)
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Pattern analysis error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'user_id': user_id
        }), 500

@location_bp.route('/crime-density', methods=['GET'])
@cross_origin()
def get_crime_density_map():
    """Get crime density data for mapping"""
    try:
        # Get query parameters
        bounds = request.args.get('bounds')  # "lat1,lng1,lat2,lng2"
        resolution = request.args.get('resolution', 'medium')
        
        if not bounds:
            return jsonify({
                'success': False,
                'error': 'Bounds parameter required (lat1,lng1,lat2,lng2)'
            }), 400
        
        try:
            lat1, lng1, lat2, lng2 = map(float, bounds.split(','))
        except ValueError:
            return jsonify({
                'success': False,
                'error': 'Invalid bounds format. Use: lat1,lng1,lat2,lng2'
            }), 400
        
        # Generate grid based on resolution
        grid_sizes = {
            'low': 0.01,      # ~1km
            'medium': 0.005,  # ~500m
            'high': 0.001     # ~100m
        }
        
        grid_size = grid_sizes.get(resolution, 0.005)
        
        # Generate crime density grid
        density_data = []
        
        lat = lat1
        while lat <= lat2:
            lng = lng1
            while lng <= lng2:
                # Calculate crime density for this grid cell
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                density = loop.run_until_complete(
                    realtime_location_detector.get_crime_density(lat, lng)
                )
                loop.close()
                
                if density > 0.1:  # Only include areas with significant density
                    density_data.append({
                        'lat': lat,
                        'lng': lng,
                        'density': density,
                        'weight': min(density * 100, 100)  # Scale for visualization
                    })
                
                lng += grid_size
            lat += grid_size
        
        return jsonify({
            'success': True,
            'data': {
                'density_points': density_data,
                'bounds': {
                    'north': lat2,
                    'south': lat1,
                    'east': lng2,
                    'west': lng1
                },
                'resolution': resolution,
                'grid_size': grid_size,
                'total_points': len(density_data),
                'max_density': max([p['density'] for p in density_data], default=0),
                'generated_at': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Crime density error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@location_bp.route('/stream-status', methods=['GET'])
@cross_origin()
def get_streaming_status():
    """Get status of real-time streaming services"""
    try:
        # Check various service statuses
        status = {
            'location_tracker': 'active',
            'redis_cache': 'connected' if realtime_location_detector.redis_client else 'disconnected',
            'ml_analyzer': 'active',
            'geofence_monitor': 'active',
            'pattern_detector': 'active'
        }
        
        # Get statistics
        stats = {
            'active_users': len(realtime_location_detector.location_history),
            'total_locations_tracked': sum(
                len(locations) for locations in realtime_location_detector.location_history.values()
            ),
            'active_geofences': len(realtime_location_detector.high_risk_geofences),
            'hotspots_monitored': len(realtime_location_detector.atm_fraud_hotspots),
            'memory_usage': len(str(realtime_location_detector.location_history)),
            'uptime': 'Real-time tracking active'
        }
        
        # Health check
        overall_health = 'healthy' if all(
            status[service] in ['active', 'connected'] 
            for service in status
        ) else 'degraded'
        
        return jsonify({
            'success': True,
            'data': {
                'overall_health': overall_health,
                'services': status,
                'statistics': stats,
                'last_check': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Stream status error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def generate_user_recommendations(pattern_analysis, insights):
    """Generate recommendations based on user pattern analysis"""
    recommendations = []
    
    if pattern_analysis.pattern_type == 'high_risk':
        recommendations.extend([
            'Increase monitoring frequency for this user',
            'Flag all transactions for manual review',
            'Consider temporary account restrictions',
            'Deploy enhanced security measures'
        ])
    
    elif pattern_analysis.pattern_type == 'suspicious':
        recommendations.extend([
            'Monitor user activity closely',
            'Review recent transaction patterns',
            'Increase alert sensitivity'
        ])
    
    # Check night activity
    night_activity = sum(insights['hourly_activity'].get(str(hour), 0) for hour in range(22, 24)) + \
                    sum(insights['hourly_activity'].get(str(hour), 0) for hour in range(0, 6))
    
    if night_activity > insights['total_locations'] * 0.3:
        recommendations.append('High night-time activity detected - increase surveillance')
    
    # Check app diversity
    if len(insights['app_usage']) > 3:
        recommendations.append('Multiple app usage detected - verify user identity')
    
    return recommendations