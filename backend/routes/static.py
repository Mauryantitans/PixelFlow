"""
Static file serving routes for PixelFlow backend.
"""

import os
from flask import Blueprint, send_file, jsonify, current_app

static_bp = Blueprint('static', __name__)


@static_bp.route('/')
def serve_index():
    """Serve the index.html file for the frontend application"""
    # Get the project root directory (parent of backend directory)
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    project_root = os.path.dirname(backend_dir)
    frontend_path = os.path.join(project_root, 'frontend', 'index.html')
    
    current_app.logger.info(f"Looking for frontend file at: {frontend_path}")
    
    if not os.path.exists(frontend_path):
        return jsonify({
            'error': 'Frontend file not found', 
            'details': f'index.html is missing from {frontend_path}'
        }), 404
    
    try:
        return send_file(frontend_path, mimetype='text/html')
    except Exception as e:
        return jsonify({
            'error': 'Failed to serve frontend', 
            'details': str(e)
        }), 500

@static_bp.route('/css/<path:filename>')
def serve_css(filename):
    """Serve CSS files from the frontend/css directory (supports nested paths)"""
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    project_root = os.path.dirname(backend_dir)
    css_dir = os.path.join(project_root, 'frontend', 'css')
    css_path = os.path.join(css_dir, filename)

    current_app.logger.info(f"Looking for CSS file at: {css_path}")

    if not os.path.exists(css_path):
        return jsonify({'error': 'CSS file not found', 'path': css_path}), 404

    return send_file(css_path, mimetype='text/css')


@static_bp.route('/script/<path:filename>')
def serve_script(filename):
    """Serve JS files from the frontend/script directory (supports nested paths)"""
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    project_root = os.path.dirname(backend_dir)
    script_dir = os.path.join(project_root, 'frontend', 'script')
    js_path = os.path.join(script_dir, filename)

    current_app.logger.info(f"Looking for JS file at: {js_path}")

    if not os.path.exists(js_path):
        return jsonify({'error': 'JS file not found', 'path': js_path}), 404

    return send_file(js_path, mimetype='application/javascript')



@static_bp.route('/health')
def health_check():
    """Basic health check endpoint"""
    return jsonify({'status': 'healthy'}), 200