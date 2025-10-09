from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
import jwt
from datetime import datetime, timedelta
from config.settings import Config

auth_bp = Blueprint('auth', __name__)

# Mock user database - in production, use actual database
USERS = {
    'admin': {
        'id': 1,
        'username': 'admin',
        'password_hash': generate_password_hash('admin123'),
        'role': 'admin',
        'permissions': ['view_all', 'create_alerts', 'manage_users'],
        'department': 'I4C'
    },
    'officer1': {
        'id': 2,
        'username': 'officer1',
        'password_hash': generate_password_hash('officer123'),
        'role': 'investigator',
        'permissions': ['view_alerts', 'update_cases'],
        'department': 'Delhi Police'
    },
    'analyst1': {
        'id': 3,
        'username': 'analyst1',
        'password_hash': generate_password_hash('analyst123'),
        'role': 'analyst',
        'permissions': ['view_analytics', 'generate_reports'],
        'department': 'I4C Analytics'
    }
}

@auth_bp.route('/login', methods=['POST'])
def login():
    """User authentication"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'success': False, 'error': 'Username and password required'}), 400
        
        user = USERS.get(username)
        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
        
        # Generate JWT token
        token_payload = {
            'user_id': user['id'],
            'username': user['username'],
            'role': user['role'],
            'exp': datetime.utcnow() + timedelta(hours=24)
        }
        
        token = jwt.encode(token_payload, Config.JWT_SECRET_KEY, algorithm='HS256')
        
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'role': user['role'],
                'permissions': user['permissions'],
                'department': user['department']
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@auth_bp.route('/verify-token', methods=['POST'])
def verify_token():
    """Verify JWT token"""
    try:
        data = request.get_json()
        token = data.get('token')
        
        if not token:
            return jsonify({'success': False, 'error': 'Token required'}), 400
        
        try:
            payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
            return jsonify({
                'success': True,
                'valid': True,
                'user': {
                    'id': payload['user_id'],
                    'username': payload['username'],
                    'role': payload['role']
                }
            })
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'error': 'Invalid token'}), 401
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@auth_bp.route('/refresh-token', methods=['POST'])
def refresh_token():
    """Refresh JWT token"""
    try:
        data = request.get_json()
        token = data.get('token')
        
        if not token:
            return jsonify({'success': False, 'error': 'Token required'}), 400
        
        try:
            payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
            
            # Generate new token
            new_payload = {
                'user_id': payload['user_id'],
                'username': payload['username'],
                'role': payload['role'],
                'exp': datetime.utcnow() + timedelta(hours=24)
            }
            
            new_token = jwt.encode(new_payload, Config.JWT_SECRET_KEY, algorithm='HS256')
            
            return jsonify({
                'success': True,
                'token': new_token
            })
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'error': 'Invalid token'}), 401
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@auth_bp.route('/google', methods=['POST'])
def google_login():
    """Google OAuth authentication"""
    try:
        data = request.get_json()
        credential = data.get('credential')
        
        if not credential:
            return jsonify({'success': False, 'error': 'Google credential required'}), 400
        
        # In production, verify the Google token with Google's API
        # For demo purposes, we'll simulate the authentication
        try:
            # Decode the credential (JWT from Google)
            # In production: use google.oauth2 library to verify
            # from google.oauth2 import id_token
            # from google.auth.transport import requests
            # idinfo = id_token.verify_oauth2_token(credential, requests.Request(), GOOGLE_CLIENT_ID)
            
            # For demo: create a user based on Google auth
            demo_user = {
                'id': 999,
                'username': 'google_user',
                'email': 'user@gmail.com',
                'role': 'analyst',
                'permissions': ['view_analytics', 'view_alerts'],
                'department': 'I4C',
                'auth_provider': 'google'
            }
            
            # Generate JWT token
            token_payload = {
                'user_id': demo_user['id'],
                'username': demo_user['username'],
                'email': demo_user['email'],
                'role': demo_user['role'],
                'auth_provider': 'google',
                'exp': datetime.utcnow() + timedelta(hours=24)
            }
            
            token = jwt.encode(token_payload, Config.JWT_SECRET_KEY, algorithm='HS256')
            
            return jsonify({
                'success': True,
                'token': token,
                'user': demo_user,
                'message': 'Google authentication successful'
            })
            
        except Exception as verify_error:
            return jsonify({
                'success': False,
                'error': f'Failed to verify Google token: {str(verify_error)}'
            }), 401
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """User logout"""
    try:
        # In a real application, you might want to blacklist the token
        return jsonify({
            'success': True,
            'message': 'Logged out successfully'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@auth_bp.route('/users', methods=['GET'])
def get_users():
    """Get all users (admin only)"""
    try:
        # In production, add proper authentication middleware
        users_list = []
        for username, user in USERS.items():
            users_list.append({
                'id': user['id'],
                'username': user['username'],
                'role': user['role'],
                'department': user['department'],
                'permissions': user['permissions']
            })
        
        return jsonify({
            'success': True,
            'users': users_list
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500