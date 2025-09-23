"""
PixelFlow Backend - Main Flask Application

A modular Flask backend for real-time image processing with performance monitoring.
"""

import os
import sys
import logging
from flask import Flask

# Add the backend directory to Python path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from routes.static import static_bp
from routes.api import api_bp


def create_app():
    """Create and configure the Flask application"""
    app = Flask(__name__)
    
    # Configure logging
    if not app.debug:
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        )
        app.logger.setLevel(logging.INFO)
        app.logger.info('PixelFlow Backend startup')
    
    # Configure Flask app with basic error handling
    @app.errorhandler(400)
    def bad_request(error):
        """Handle 400 Bad Request errors"""
        return {'error': 'Bad Request', 'details': str(error)}, 400

    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 Not Found errors"""
        return {'error': 'Not Found', 'details': str(error)}, 404

    @app.errorhandler(500)
    def internal_error(error):
        """Handle 500 Internal Server errors"""
        return {'error': 'Internal Server Error', 'details': str(error)}, 500
    
    # Register blueprints
    app.register_blueprint(static_bp)
    app.register_blueprint(api_bp)
    
    return app


def configure_app():
    """Configure Flask app for different environments"""
    # Get configuration from environment variables with defaults
    debug_mode = os.getenv('FLASK_DEBUG', 'True').lower() in ('true', '1', 'yes')
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', '5000'))
    
    return {
        'debug': debug_mode,
        'host': host,
        'port': port
    }


# Create the Flask app
app = create_app()


if __name__ == '__main__':
    config = configure_app()
    
    print(f"\n Starting PixelFlow Backend server...")
    print(f"\n Debug mode: {config['debug']}")
    print(f"\n Host: {config['host']}")
    print(f"\n Port: {config['port']}")
    print(f"\n Access the application at: http://{config['host']}:{config['port']}")
    
    app.run(
        debug=config['debug'],
        host=config['host'],
        port=config['port']
    )