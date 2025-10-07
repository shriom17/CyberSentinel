from flask import Blueprint, request, jsonify
import numpy as np
from datetime import datetime, timedelta

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/heatmap-data', methods=['GET'])
def get_heatmap_data():
    """Get data for risk heatmap visualization"""
    try:
        # Mock heatmap data for demonstration
        # In production, this would query actual database
        heatmap_data = []
        
        # Generate mock data for Delhi NCR region
        locations = [
            {'name': 'Connaught Place', 'lat': 28.6289, 'lng': 77.2065, 'risk': 0.85},
            {'name': 'Karol Bagh', 'lat': 28.6514, 'lng': 77.1906, 'risk': 0.72},
            {'name': 'Lajpat Nagar', 'lat': 28.5675, 'lng': 77.2436, 'risk': 0.68},
            {'name': 'Dwarka', 'lat': 28.5921, 'lng': 77.0460, 'risk': 0.45},
            {'name': 'Gurgaon Cyber City', 'lat': 28.4950, 'lng': 77.0920, 'risk': 0.78},
            {'name': 'Noida Sector 18', 'lat': 28.5706, 'lng': 77.3272, 'risk': 0.66},
            {'name': 'Faridabad', 'lat': 28.4089, 'lng': 77.3178, 'risk': 0.59},
            {'name': 'Rohini', 'lat': 28.7041, 'lng': 77.1025, 'risk': 0.54}
        ]
        
        for loc in locations:
            heatmap_data.append({
                'id': len(heatmap_data) + 1,
                'location_name': loc['name'],
                'latitude': loc['lat'],
                'longitude': loc['lng'],
                'risk_score': loc['risk'],
                'predicted_incidents': int(np.random.uniform(5, 30)),
                'last_updated': datetime.now().isoformat(),
                'risk_level': 'high' if loc['risk'] > 0.7 else 'medium' if loc['risk'] > 0.5 else 'low'
            })
        
        return jsonify({
            'success': True,
            'heatmap_data': heatmap_data,
            'metadata': {
                'total_locations': len(heatmap_data),
                'high_risk_count': sum(1 for item in heatmap_data if item['risk_level'] == 'high'),
                'generated_at': datetime.now().isoformat()
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@dashboard_bp.route('/statistics', methods=['GET'])
def get_dashboard_statistics():
    """Get overall dashboard statistics"""
    try:
        stats = {
            'total_complaints': np.random.randint(7500, 8500),
            'today_complaints': np.random.randint(200, 400),
            'active_alerts': np.random.randint(15, 45),
            'high_risk_areas': np.random.randint(8, 15),
            'amount_involved': {
                'today': np.random.uniform(50000, 200000),
                'this_week': np.random.uniform(500000, 1000000),
                'this_month': np.random.uniform(2000000, 5000000)
            },
            'recovery_rate': np.random.uniform(0.15, 0.35),
            'prediction_accuracy': np.random.uniform(0.75, 0.92)
        }
        
        return jsonify({
            'success': True,
            'statistics': stats,
            'last_updated': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@dashboard_bp.route('/trends', methods=['GET'])
def get_trends():
    """Get trend data for charts"""
    try:
        days = request.args.get('days', 30, type=int)
        
        # Generate mock trend data
        dates = []
        complaints = []
        predictions = []
        
        for i in range(days):
            date = datetime.now() - timedelta(days=days-i-1)
            dates.append(date.strftime('%Y-%m-%d'))
            complaints.append(np.random.randint(180, 350))
            predictions.append(np.random.randint(200, 400))
        
        trends = {
            'daily_complaints': {
                'dates': dates,
                'values': complaints
            },
            'prediction_trends': {
                'dates': dates,
                'values': predictions
            },
            'crime_categories': {
                'categories': ['UPI Fraud', 'Phishing', 'Investment Scam', 'Romance Scam', 'OTP Fraud'],
                'percentages': [35, 25, 15, 12, 13]
            }
        }
        
        return jsonify({
            'success': True,
            'trends': trends
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@dashboard_bp.route('/live-feed', methods=['GET'])
def get_live_feed():
    """Get live complaint feed"""
    try:
        # Mock live feed data
        feed_items = []
        
        for i in range(10):
            feed_items.append({
                'id': f'complaint_{i+1}',
                'timestamp': (datetime.now() - timedelta(minutes=np.random.randint(1, 120))).isoformat(),
                'location': np.random.choice(['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Hyderabad']),
                'category': np.random.choice(['UPI Fraud', 'Phishing', 'Investment Scam', 'OTP Fraud']),
                'amount': np.random.randint(5000, 500000),
                'status': np.random.choice(['new', 'investigating', 'resolved']),
                'risk_score': np.random.uniform(0.3, 0.9)
            })
        
        return jsonify({
            'success': True,
            'live_feed': sorted(feed_items, key=lambda x: x['timestamp'], reverse=True)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500