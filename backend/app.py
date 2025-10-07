from flask import Flask
from flask_cors import CORS
from app.routes.analytics_simple import analytics_bp
from app.routes.dashboard import dashboard_bp
from app.routes.alerts import alerts_bp
from app.routes.auth import auth_bp
from app.routes.realtime import realtime_bp
from app.routes.location_routes import location_bp
from config.settings import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS for React frontend
    CORS(app, origins=['http://localhost:3000'])
    
    # Register blueprints
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(alerts_bp, url_prefix='/api/alerts')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(realtime_bp, url_prefix='/api/realtime')
    app.register_blueprint(location_bp, url_prefix='/api/location')
    
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'message': 'Cybercrime Analytics API is running'}
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)