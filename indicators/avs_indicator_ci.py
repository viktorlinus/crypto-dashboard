"""
Simplified AVS Average Indicator for CI/CD

This is a simplified version of the AVS indicator that doesn't depend on BaseIndicator.
It's specifically designed to run in GitHub Actions.
"""

import os
import json
import pandas as pd
import re
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import gspread
from google.oauth2 import service_account
import logging
from supabase import create_client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AVSIndicator:
    """
    Simplified AVS Average Indicator for CI/CD
    """
    
    def __init__(self):
        """Initialize the AVS Indicator"""
        self.name = "avs-indicator"
        self.description = "Bitcoin buy/sell zones based on the AVS average"
        
        # Configuration
        self.creds_file = 'secret_key.json'
        self.spreadsheet_id = '1hqD9PV0FzSSn1VB_O8_HX575BmXZXQjEvokSEd5NxDI'
        
        # Default parameters
        self.default_params = {
            # Thresholds for coloring
            'strong_buy_threshold': 0.04,   # Strong buy when AVS average is below this
            'buy_threshold': 0.10,          # Buy when AVS average is below this
            'sell_threshold': 0.85,         # Sell when AVS average is above this
            'strong_sell_threshold': 0.95,  # Strong sell when AVS average is above this
        }
        
        # Get Supabase client
        supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        supabase_key = os.environ.get("SUPABASE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        
        # If credentials not found in environment, try to read from .env.local as fallback
        if not supabase_url or not supabase_key:
            logger.info("Trying to read Supabase credentials from .env.local")
            try:
                if os.path.exists('.env.local'):
                    with open('.env.local', 'r') as f:
                        for line in f:
                            line = line.strip()
                            if line and not line.startswith('#'):
                                match = re.match(r'^([A-Za-z0-9_]+)=(.*)$', line)
                                if match:
                                    key, value = match.groups()
                                    if key == "SUPABASE_URL" or key == "NEXT_PUBLIC_SUPABASE_URL":
                                        supabase_url = value
                                    elif key in ["SUPABASE_KEY", "SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]:
                                        supabase_key = value
                else:
                    logger.warning(".env.local file not found")
            except Exception as e:
                logger.warning(f"Error reading .env.local file: {e}")
        
        if not supabase_url or not supabase_key:
            raise ValueError("Supabase credentials required - add them to .env.local or set as environment variables")
        
        self.supabase = create_client(supabase_url, supabase_key)
    
    def generate_data(self, params=None):
        """
        Generate data for the AVS indicator.
        """
        try:
            # Merge default params with any custom params
            custom_params = self.validate_params(params or {})
            chart_params = self.default_params.copy()
            
            # Process any overrides of technical parameters
            for key, value in custom_params.items():
                if key in chart_params:
                    if isinstance(chart_params[key], int):
                        chart_params[key] = int(value)
                    elif isinstance(chart_params[key], float):
                        chart_params[key] = float(value)
            
            # Load data from Google Sheets
            avs_data = self.load_google_sheets_data('Complete AVS')
            
            # Filter by period if specified
            period = custom_params.get('period', None)
            if period and period != 'all':
                avs_data = self.filter_by_period(avs_data, period)
            
            # Create the plot
            theme = custom_params.get('theme', 'light')
            fig = self.plot_avs_chart(avs_data, chart_params, theme)
            
            # Get the latest data for the response
            latest_data = avs_data.iloc[-1]
            
            # Determine the current signal based on AVS average
            avg_value = float(latest_data['Average'])
            signal = "neutral"
            if avg_value <= chart_params['strong_buy_threshold']:
                signal = "strong_buy"
            elif avg_value <= chart_params['buy_threshold']:
                signal = "buy"
            elif avg_value >= chart_params['strong_sell_threshold']:
                signal = "strong_sell"
            elif avg_value >= chart_params['sell_threshold']:
                signal = "sell"
            
            # Return the results
            return {
                "plotly_json": fig.to_json(),
                "latest_data": {
                    "timestamp": avs_data.index[-1].strftime('%Y-%m-%d'),
                    "price": float(latest_data['Price']),
                    "avs_average": float(latest_data['Average']),
                    "signal": signal
                }
            }
        except Exception as e:
            logger.exception("Error generating AVS indicator data")
            return {"error": str(e)}
    
    def validate_params(self, params):
        """Validate the parameters for the AVS indicator."""
        valid_params = {}
        
        # Period validation
        if 'period' in params:
            period = params['period']
            valid_periods = ['7d', '14d', '30d', '90d', '180d', '1y', 'all']
            if period in valid_periods:
                valid_params['period'] = period
        
        # Theme validation
        if 'theme' in params:
            theme = params['theme']
            if theme in ['light', 'dark']:
                valid_params['theme'] = theme
        
        # Add any technical parameter overrides
        for key, value in params.items():
            if key in self.default_params:
                valid_params[key] = value
        
        return valid_params
    
    def filter_by_period(self, data, period):
        """Filter data by the specified time period."""
        from datetime import datetime, timedelta
        
        end_date = datetime.now()
        
        if period == '7d':
            start_date = end_date - timedelta(days=7)
        elif period == '14d':
            start_date = end_date - timedelta(days=14)
        elif period == '30d':
            start_date = end_date - timedelta(days=30)
        elif period == '90d':
            start_date = end_date - timedelta(days=90)
        elif period == '180d':
            start_date = end_date - timedelta(days=180)
        elif period == '1y':
            start_date = end_date - timedelta(days=365)
        else:  # 'all'
            start_date = pd.Timestamp('2013-05-01')
        
        filtered_data = data[data.index >= start_date]
        return filtered_data
    
    def load_google_sheets_data(self, worksheet_name):
        """Load data from Google Sheets."""
        logger.info(f"Loading data from Google Sheets: {worksheet_name}")
        
        # Using gspread with ServiceAccountCredentials
        scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly']
        creds = service_account.Credentials.from_service_account_file(
            self.creds_file, 
            scopes=scopes
        )
        
        # Use gspread client to access the data
        gc = gspread.authorize(creds)
        
        # Open the spreadsheet and get the specified worksheet
        spreadsheet = gc.open_by_key(self.spreadsheet_id)
        worksheet = spreadsheet.worksheet(worksheet_name)
        
        # Get all values from worksheet
        values = worksheet.get_all_values()
        
        if not values or len(values) <= 1:  # No data or only header row
            logger.warning("No data returned from Google Sheets")
            return pd.DataFrame()

        # Create DataFrame from the values
        df = pd.DataFrame(values[1:], columns=values[0])  # Use the first row as headers
        
        # Process the data - date as index, convert numeric columns
        df.rename(columns={df.columns[0]: 'Date'}, inplace=True)  # Ensure first column is named 'Date'
        df.set_index('Date', inplace=True)
        df.index = pd.to_datetime(df.index)
        
        # Convert numeric columns, replacing comma with dot for decimal separator
        for col in df.columns:
            if col != 'Date':  # Skip date column
                df[col] = df[col].str.replace(',', '.', regex=False)
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # Keep only data from May 2013 onwards
        df = df[df.index >= pd.Timestamp('2013-05-01')]
        
        return df
    
    def plot_avs_chart(self, data, params, theme='light'):
        """Create a plot for the AVS indicator."""
        # Set theme colors
        if theme == 'dark':
            bg_color = 'rgba(40, 40, 40, 1)'
            paper_bg = 'rgba(30, 30, 30, 1)'
            grid_color = 'rgba(80, 80, 80, 0.3)'
            text_color = '#ffffff'
            price_line_color = '#ffffff'
        else:  # light theme
            bg_color = 'rgba(250, 250, 250, 0.85)'
            paper_bg = 'rgba(245, 245, 245, 1)'
            grid_color = 'lightgrey'
            text_color = '#4B4B4B'
            price_line_color = 'black'
        
        # Create subplots: one for price, one for AVS average
        fig = make_subplots(rows=2, cols=1, shared_xaxes=True, vertical_spacing=0.1)
        
        # Add price line to first subplot
        fig.add_trace(
            go.Scatter(
                x=data.index, 
                y=data['Price'], 
                name='Price', 
                line=dict(color=price_line_color, width=2)
            ),
            row=1, col=1
        )
        
        # Add AVS average line to second subplot
        fig.add_trace(
            go.Scatter(
                x=data.index, 
                y=data['Average'], 
                name='AVS Average', 
                line=dict(color='darkblue', width=2)
            ),
            row=2, col=1
        )
        
        # Simplified shape logic for colored zones
        min_positive_price = data[data['Price'] > 0]['Price'].min()
        prev_index, prev_color = None, None
        shapes = []

        # Batch create shapes based on AVS average values
        for index, row in data.iterrows():
            color = None
            if row['Average'] >= params['strong_sell_threshold']:
                color = 'darkred'
            elif row['Average'] >= params['sell_threshold']:
                color = 'red'
            elif row['Average'] <= params['strong_buy_threshold']:
                color = 'darkgreen'
            elif row['Average'] <= params['buy_threshold']:
                color = 'green'

            if prev_index and color:
                shapes.append({
                    'type': 'rect', 
                    'x0': prev_index, 
                    'x1': index,
                    'y0': min_positive_price, 
                    'y1': row['Price'],
                    'xref': 'x', 
                    'yref': 'y',
                    'fillcolor': color, 
                    'opacity': 0.3, 
                    'line': {'width': 0}
                })
            if color:
                prev_index, prev_color = index, color
            else:
                prev_index = None

        # Add the last shape if needed
        if prev_index:
            last_row = data.iloc[-1]
            shapes.append({
                'type': 'rect', 
                'x0': prev_index, 
                'x1': data.index[-1],
                'y0': min_positive_price, 
                'y1': last_row['Price'],
                'xref': 'x', 
                'yref': 'y',
                'fillcolor': prev_color, 
                'opacity': 0.3, 
                'line': {'width': 0}
            })
        
        # Update layout
        fig.update_layout(
            title={
                'text': "Bitcoin Value Range System", 
                'x': 0.5, 
                'y': 0.95, 
                'xanchor': 'center', 
                'yanchor': 'top', 
                'font': {'size': 24, 'color': text_color}
            },
            shapes=shapes,
            autosize=True,
            height=700,
            margin=dict(l=50, r=50, t=80, b=100),
            plot_bgcolor=bg_color,
            paper_bgcolor=paper_bg,
            legend=dict(
                orientation='h',
                yanchor='top',
                xanchor='center',
                y=1.02,
                x=0.5,
                font=dict(size=12, color=text_color)
            ),
            xaxis=dict(
                showgrid=False,
                tickfont=dict(color=text_color),
                tickangle=30,
                tickformat='%b %Y'
            ),
            yaxis=dict(
                showgrid=False,
                type="log",
                tickfont=dict(color=text_color)
            ),
            xaxis2=dict(
                showgrid=False,
                tickfont=dict(color=text_color)
            ),
            yaxis2=dict(
                showgrid=False,
                tickfont=dict(color=text_color),
                title="AVS Average"
            ),
        )
        
        return fig