# Flask Server for Crypto Dashboard Indicators

This document explains how to set up and run the Flask server that powers advanced indicators for the Crypto Dashboard.

## Overview

The Flask server provides Python-based indicator calculations that are integrated with the Next.js frontend. It offers:

- Modular indicator system for easy extension
- Caching to reduce API calls to data sources
- Interactive charts and data endpoints
- Support for Google Sheets data sources

## Setup Instructions

### 1. Install Python Dependencies

First, make sure you have Python 3.7+ installed. Then install the required packages:

```bash
pip install -r requirements.txt
```

### 2. Configure Google Sheets Credentials

The funding indicator uses Google Sheets as a data source. Make sure the credentials file is properly set up:

- Ensure `funding-435016-442a60c70683.json` is in the root directory
- Verify the Google Sheet has proper sharing permissions for the service account

### 3. Running the Server

There are two ways to run the system:

#### Option A: Separately (recommended for development)

Run the Flask server in one terminal:
```bash
python server.py
```

Run the Next.js frontend in another terminal:
```bash
npm run dev
```

#### Option B: Using the Dev Script (convenience method)

On Windows:
```bash
dev.bat
```

On Linux/Mac:
```bash
chmod +x dev.sh
./dev.sh
```

## Accessing the Indicators

The Flask server provides these endpoints:

- `/api/indicators/<indicator_name>` - JSON data
- `/api/indicators/<indicator_name>/plot` - Interactive HTML plot
- `/api/indicators/<indicator_name>/image` - Static PNG image
- `/api/indicators/<indicator_name>/latest` - Latest signals only

However, you should access these through the Next.js proxy routes at:

- `/api/indicators/<indicator_name>` - which proxies to the Flask server

## Adding New Indicators

To add a new indicator:

1. Create a Python file in the `indicators` directory (e.g., `my_indicator.py`)
2. Inherit from the `BaseIndicator` class
3. Implement the required methods, particularly `generate_data()`
4. The server will automatically detect and load the indicator

Example:

```python
from .base_indicator import BaseIndicator
import plotly.graph_objects as go

class MyNewIndicator(BaseIndicator):
    def __init__(self):
        super().__init__(
            name="my-new-indicator",
            description="Description of my indicator"
        )
    
    def generate_data(self, params=None):
        # Your indicator calculation logic
        fig = go.Figure()
        # ... create your plot
        
        return {
            "plotly_json": fig.to_json(),
            "latest_data": {
                # Latest metrics
            }
        }
```

## Frontend Integration

To add a new indicator to the frontend:

1. Create a React component in `components/indicators/`
2. Add a card to the indicators page
3. Create a dedicated page in `app/indicators/[indicator-name]/`

## Production Deployment Considerations

For production:

1. Use environment variables for sensitive configuration
2. Consider setting up a proper process manager (PM2, Supervisor)
3. Use Gunicorn instead of the Flask development server:
   ```
   gunicorn -w 4 -b 0.0.0.0:5000 server:app
   ```
4. Set up proper monitoring and logging
5. Consider Docker for containerization

## Troubleshooting

If the Flask server isn't responding:

1. Check if it's running on port 5000
2. Verify the API routes are correctly set up
3. Check the network console in your browser for errors
4. Look at the Flask server logs for exceptions

If indicators aren't loading properly:

1. Check your Google Sheets credentials
2. Make sure data is available in the expected format
3. Test the Flask endpoints directly to isolate frontend vs. backend issues