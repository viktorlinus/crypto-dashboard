import os
import json
from flask import Flask, jsonify, send_file, request
from flask_caching import Cache
from io import BytesIO
import importlib
import logging

# Suppress noisy Google API client warnings
import warnings
warnings.filterwarnings('ignore', message='file_cache is only supported with oauth2client<4.0.0')

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app and cache
app = Flask(__name__)
cache = Cache(config={'CACHE_TYPE': 'simple'})
cache.init_app(app)

# Dictionary to store loaded indicators
INDICATORS = {}

@app.route('/')
def index():
    """Main API index showing available indicators"""
    available_indicators = list(INDICATORS.keys())
    return jsonify({
        "api": "Crypto Dashboard API",
        "version": "1.0.0",
        "available_indicators": available_indicators
    })

@app.route('/api/indicators/<indicator_name>', methods=['GET'])
def get_indicator_data(indicator_name):
    """Return the indicator data as JSON"""
    if indicator_name not in INDICATORS:
        return jsonify({"error": f"Indicator '{indicator_name}' not found"}), 404
    
    # Get any query parameters
    params = request.args.to_dict()
    
    # Generate the indicator data with caching
    try:
        result = generate_indicator_data(indicator_name, params)
        return jsonify(result)
    except Exception as e:
        logger.exception(f"Error generating indicator data for {indicator_name}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/indicators/<indicator_name>/plot', methods=['GET'])
def get_indicator_plot(indicator_name):
    """Return the indicator as an interactive HTML plot"""
    if indicator_name not in INDICATORS:
        return jsonify({"error": f"Indicator '{indicator_name}' not found"}), 404
    
    params = request.args.to_dict()
    
    try:
        result = generate_indicator_data(indicator_name, params)
        
        if "error" in result:
            return jsonify({"error": result["error"]}), 500
        
        # Create an HTML representation of the plot
        import plotly.io as pio
        fig_json = result["plotly_json"]
        import plotly.graph_objects as go
        
        # Validate JSON parsing before returning
        try:
            fig = go.Figure(json.loads(fig_json))
        except json.JSONDecodeError as json_err:
            logger.error(f"JSON parsing error: {json_err}")
            return jsonify({"error": f"Invalid JSON data: {str(json_err)}"}), 500
        
        # Use pio.to_html with the full_html option and responsive config
        html = pio.to_html(
            fig, 
            full_html=True, 
            include_plotlyjs='cdn', 
            config={
                'responsive': True,
                'displayModeBar': False,
                'scrollZoom': False
            }
        )
        
        # Add responsive CSS to the HTML
        html = html.replace('</head>', '''
        <style>
        body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }
        .js-plotly-plot, .plot-container {
            width: 100%;
            height: 100%;
        }
        </style>
        </head>''')
        
        # Return as HTML content
        return html, 200, {'Content-Type': 'text/html; charset=utf-8'}
    except Exception as e:
        logger.exception(f"Error generating plot for {indicator_name}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/indicators/<indicator_name>/image', methods=['GET'])
def get_indicator_image(indicator_name):
    """Return the indicator as a PNG image"""
    if indicator_name not in INDICATORS:
        return jsonify({"error": f"Indicator '{indicator_name}' not found"}), 404
    
    params = request.args.to_dict()
    
    try:
        result = generate_indicator_data(indicator_name, params)
        
        if "error" in result:
            return jsonify({"error": result["error"]}), 500
        
        # Create a PNG image from the plot
        fig_json = result["plotly_json"]
        import plotly.graph_objects as go
        fig = go.Figure(json.loads(fig_json))
        
        # Create a BytesIO object to hold the image data
        img_bytes = BytesIO()
        fig.write_image(img_bytes, format='png', width=1400, height=800)
        img_bytes.seek(0)
        
        # Return the PNG image
        return send_file(img_bytes, mimetype='image/png')
    except Exception as e:
        logger.exception(f"Error generating image for {indicator_name}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/indicators/<indicator_name>/latest', methods=['GET'])
def get_indicator_latest(indicator_name):
    """Return just the latest signals and metrics"""
    if indicator_name not in INDICATORS:
        return jsonify({"error": f"Indicator '{indicator_name}' not found"}), 404
    
    params = request.args.to_dict()
    
    try:
        result = generate_indicator_data(indicator_name, params)
        
        if "error" in result:
            return jsonify({"error": result["error"]}), 500
        
        return jsonify(result["latest_data"])
    except Exception as e:
        logger.exception(f"Error getting latest data for {indicator_name}")
        return jsonify({"error": str(e)}), 500

@cache.memoize(timeout=14400)  # Cache for 4 hours (14400 seconds)
def generate_indicator_data(indicator_name, params=None):
    """Generate data for a specific indicator with parameters"""
    if params is None:
        params = {}
    
    try:
        indicator = INDICATORS[indicator_name]
        return indicator.generate_data(params)
    except Exception as e:
        logger.exception(f"Error in generate_indicator_data for {indicator_name}")
        return {"error": str(e)}

def load_indicators():
    """Load all indicators from the indicators directory"""
    indicators_dir = os.path.join(os.path.dirname(__file__), 'indicators')
    
    if not os.path.exists(indicators_dir):
        os.makedirs(indicators_dir)
        logger.info(f"Created indicators directory at {indicators_dir}")
    
    # Get all Python files in the indicators directory, excluding base classes and utilities
    indicator_files = [f for f in os.listdir(indicators_dir) 
                     if f.endswith('.py') and not f.startswith('__') 
                     and not f == 'base_indicator.py' and not f == 'utils.py']
    
    for indicator_file in indicator_files:
        module_name = indicator_file[:-3]  # Remove .py extension
        try:
            # Import the module dynamically
            module_path = f"indicators.{module_name}"
            module = importlib.import_module(module_path)
            
            # Each indicator module should have a class with the same name
            indicator_class_name = ''.join(word.capitalize() for word in module_name.split('_'))
            
            if hasattr(module, indicator_class_name):
                indicator_class = getattr(module, indicator_class_name)
                indicator = indicator_class()
                
                # Register the indicator
                INDICATORS[indicator.name] = indicator
                logger.info(f"Loaded indicator: {indicator.name}")
            else:
                logger.warning(f"Could not find class {indicator_class_name} in {module_path}")
        except Exception as e:
            logger.exception(f"Error loading indicator from {indicator_file}")

if __name__ == '__main__':
    # Load all indicators
    load_indicators()
    
    # Print available indicators
    logger.info(f"Loaded {len(INDICATORS)} indicators: {list(INDICATORS.keys())}")
    
    # Run the Flask app
    app.run(debug=True, host='0.0.0.0', port=5000)
