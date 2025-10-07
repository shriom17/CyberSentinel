from flask import Blueprint, request, jsonify
import numpy as np
from datetime import datetime, timedelta

alerts_bp = Blueprint('alerts', __name__)

class AlertSystem:
    def __init__(self):
        self.active_alerts = []
    
    def generate_alert(self, alert_data):
        """Generate new alert"""
        alert = {
            'id': f'alert_{len(self.active_alerts) + 1}',
            'timestamp': datetime.now().isoformat(),
            'severity': alert_data.get('severity', 'medium'),
            'location': alert_data.get('location'),
            'predicted_risk': alert_data.get('risk_score', 0.5),
            'alert_type': alert_data.get('type', 'hotspot_prediction'),
            'message': alert_data.get('message'),
            'status': 'active',
            'assigned_officers': [],
            'actions_taken': []
        }
        self.active_alerts.append(alert)
        return alert
    
    def send_notifications(self, alert, recipients):
        """Send notifications via multiple channels"""
        # Mock notification sending
        notifications_sent = []
        
        for recipient in recipients:
            if recipient.get('sms_enabled'):
                notifications_sent.append({
                    'channel': 'sms',
                    'recipient': recipient['phone'],
                    'status': 'sent',
                    'timestamp': datetime.now().isoformat()
                })
            
            if recipient.get('email_enabled'):
                notifications_sent.append({
                    'channel': 'email',
                    'recipient': recipient['email'],
                    'status': 'sent',
                    'timestamp': datetime.now().isoformat()
                })
        
        return notifications_sent

alert_system = AlertSystem()

@alerts_bp.route('/create', methods=['POST'])
def create_alert():
    """Create new alert"""
    try:
        data = request.get_json()
        alert = alert_system.generate_alert(data)
        
        # Send notifications to relevant officers
        recipients = data.get('recipients', [])
        if recipients:
            notifications = alert_system.send_notifications(alert, recipients)
            alert['notifications_sent'] = notifications
        
        return jsonify({
            'success': True,
            'alert': alert
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@alerts_bp.route('/active', methods=['GET'])
def get_active_alerts():
    """Get all active alerts"""
    try:
        # Add some mock active alerts if none exist
        if not alert_system.active_alerts:
            mock_alerts = [
                {
                    'id': 'alert_1',
                    'timestamp': (datetime.now() - timedelta(minutes=30)).isoformat(),
                    'severity': 'high',
                    'location': 'Connaught Place, Delhi',
                    'predicted_risk': 0.87,
                    'alert_type': 'hotspot_prediction',
                    'message': 'High probability of cash withdrawal fraud in next 2 hours',
                    'status': 'active',
                    'assigned_officers': ['Officer Kumar', 'Inspector Singh'],
                    'actions_taken': ['Patrol deployed', 'Banks notified']
                },
                {
                    'id': 'alert_2',
                    'timestamp': (datetime.now() - timedelta(hours=1)).isoformat(),
                    'severity': 'medium',
                    'location': 'Gurgaon Cyber City',
                    'predicted_risk': 0.72,
                    'alert_type': 'pattern_anomaly',
                    'message': 'Unusual spike in UPI fraud complaints detected',
                    'status': 'investigating',
                    'assigned_officers': ['Sub-Inspector Patel'],
                    'actions_taken': ['Investigation initiated']
                }
            ]
            alert_system.active_alerts = mock_alerts
        
        return jsonify({
            'success': True,
            'alerts': alert_system.active_alerts,
            'total_count': len(alert_system.active_alerts)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@alerts_bp.route('/<alert_id>/update', methods=['PUT'])
def update_alert(alert_id):
    """Update alert status or add actions"""
    try:
        data = request.get_json()
        
        # Find alert
        alert = next((a for a in alert_system.active_alerts if a['id'] == alert_id), None)
        if not alert:
            return jsonify({'success': False, 'error': 'Alert not found'}), 404
        
        # Update alert
        if 'status' in data:
            alert['status'] = data['status']
        
        if 'action' in data:
            alert['actions_taken'].append({
                'action': data['action'],
                'timestamp': datetime.now().isoformat(),
                'officer': data.get('officer', 'Unknown')
            })
        
        if 'assign_officer' in data:
            if data['assign_officer'] not in alert['assigned_officers']:
                alert['assigned_officers'].append(data['assign_officer'])
        
        return jsonify({
            'success': True,
            'alert': alert
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@alerts_bp.route('/statistics', methods=['GET'])
def get_alert_statistics():
    """Get alert statistics"""
    try:
        stats = {
            'total_alerts_today': np.random.randint(15, 35),
            'active_alerts': len([a for a in alert_system.active_alerts if a['status'] == 'active']),
            'resolved_alerts': np.random.randint(8, 20),
            'high_priority': len([a for a in alert_system.active_alerts if a['severity'] == 'high']),
            'response_time_avg': np.random.uniform(8, 15),  # minutes
            'success_rate': np.random.uniform(0.65, 0.85)
        }
        
        return jsonify({
            'success': True,
            'statistics': stats
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@alerts_bp.route('/send-notification', methods=['POST'])
def send_notification():
    """Send manual notification"""
    try:
        data = request.get_json()
        
        notification = {
            'id': f'notif_{datetime.now().timestamp()}',
            'message': data.get('message'),
            'recipients': data.get('recipients', []),
            'channels': data.get('channels', ['email']),
            'priority': data.get('priority', 'normal'),
            'sent_at': datetime.now().isoformat(),
            'status': 'sent'
        }
        
        return jsonify({
            'success': True,
            'notification': notification
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500