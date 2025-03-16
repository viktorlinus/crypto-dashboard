"""
Simplified Funding Indicator for CI/CD

This is a simplified version of the funding indicator that doesn't depend on BaseIndicator.
It's specifically designed to run in GitHub Actions.
"""

import os
import json
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from google.oauth2 import service_account
from googleapiclient.discovery import build
import ta  # Technical Analysis library
import logging
from supabase import create_client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FundingIndicator:
    """
    Simplified Bitcoin Funding Rate Indicator for CI/CD
    """
    
    def __init__(self):
        """Initialize the Funding Indicator"""
        self.name = "funding-indicator"
        self.description = "Bitcoin buy/sell signals based on funding rates and technical analysis"
        
        # Configuration
        self.creds_file = 'funding-435016-442a60c70683.json'
        self.spreadsheet_id = '1Xn9Q1io5Fwm0s3JillXyDR2eMoySC_vCgde_oJCx64w'
        
        # Default parameters for indicator calculations
        self.default_params = {
            'longShortEmaLength': 168,
            'shortEma1Length': 47,
            'longEma1Length': 55,
            'shortEma2Length': 79,
            'longEma2Multiplier': 0.99,
            'bullEma1': 50,
            'bullEma2': 140,
            'rsiLength': 9,
            'rsiBuyThreshold': 32,
            'fundingRateThreshold': 0.00,
            'longShortEmaLengthSell': 131,
            'shortEma1LengthSell': 222,
            'longEma1LengthSell': 148,
            'shortEma2LengthSell': 57,
            'longEma2MultiplierSell': 1.29,
            'rsiSellThreshold': 48,
            'fundingRateMAWindow': 55,
            'frThreshold': 0.005,
            'weakShortEmaLength': 5,
            'weakLongEmaLength': 6,
            'rsiWeakSellThreshold': 20,
            'frThresholdWeak': 0.009,
            'fundingRateMAWindowWeak': 30,
            'soprMAWindow': 20,
            'soprBuyThreshold': 1,
            'soprSellThreshold': 1,
            'rocLength': 22,
            'stdLength': 7,
            'upperBand': 0.2,
            'lowerBand': 0.1,
        }
        
        # Get Supabase client
        supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        supabase_key = os.environ.get("SUPABASE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("Supabase credentials required")
        
        self.supabase = create_client(supabase_url, supabase_key)
    
    def generate_data(self, params=None):
        """
        Generate data for the funding indicator.
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
            ohlc_data = self.load_google_sheets_data('cleaned_price_data!A:E')
            funding_data = self.load_google_sheets_data('fr2!A:F')
            
            # Process the funding data
            funding_data.rename(columns={'FundingRateIndex': 'fr'}, inplace=True)
            funding_data['fr'] = pd.to_numeric(funding_data['fr'], errors='coerce')
            funding_data['fr'] = funding_data['fr'].ffill()
            
            # Filter by period if specified
            period = custom_params.get('period', None)
            if period and period != 'all':
                ohlc_data, funding_data = self.filter_by_period(ohlc_data, funding_data, period)
            
            # Merge OHLC and funding data
            start_date = max(ohlc_data.index.min(), funding_data.index.min())
            ohlc_data = ohlc_data.loc[start_date:]
            funding_data = funding_data.loc[start_date:]
            full_data = ohlc_data.join(funding_data[['fr']], how='inner')
            
            # Run the indicator calculations
            processed_data = self.dip_hunter_with_funding_and_sopr(full_data, chart_params)
            
            # Create the plot
            theme = custom_params.get('theme', 'light')
            fig = self.plot_signals(processed_data, theme)
            
            # Return the results
            return {
                "plotly_json": fig.to_json(),
                "latest_data": {
                    "timestamp": processed_data.index[-1].strftime('%Y-%m-%d'),
                    "close": float(processed_data['close'].iloc[-1]),
                    "funding_rate": float(processed_data['fr'].iloc[-1]),
                    "rsi": float(processed_data['rsi'].iloc[-1]),
                    "bull_buy_signal": bool(processed_data['bullBuy'].iloc[-1]),
                    "bear_buy_signal": bool(processed_data['bearBuy'].iloc[-1]),
                    "sell_signal": bool(processed_data['sellSignal'].iloc[-1]),
                    "weak_sell_signal": bool(processed_data['weakSellSignal'].iloc[-1])
                }
            }
        except Exception as e:
            logger.exception("Error generating funding indicator data")
            return {"error": str(e)}
    
    def validate_params(self, params):
        """Validate the parameters for the funding indicator."""
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
    
    def filter_by_period(self, ohlc_data, funding_data, period):
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
            return ohlc_data, funding_data
        
        ohlc_filtered = ohlc_data[ohlc_data.index >= start_date]
        funding_filtered = funding_data[funding_data.index >= start_date]
        
        return ohlc_filtered, funding_filtered
    
    def load_google_sheets_data(self, range_name):
        """Load data from Google Sheets."""
        logger.info(f"Loading data from Google Sheets: {range_name}")
        creds = service_account.Credentials.from_service_account_file(
            self.creds_file, 
            scopes=["https://www.googleapis.com/auth/spreadsheets.readonly"]
        )
        service = build('sheets', 'v4', credentials=creds)
        sheet = service.spreadsheets()
        result = sheet.values().get(spreadsheetId=self.spreadsheet_id, range=range_name).execute()
        values = result.get('values', [])
        
        if not values:
            return pd.DataFrame()

        # Create DataFrame from the values and format appropriately
        df = pd.DataFrame(values[1:], columns=values[0])  # Use the first row as headers
        df['timestamp'] = pd.to_datetime(df['timestamp'])  # Convert timestamp to datetime
        df.set_index('timestamp', inplace=True)
        df = df.apply(pd.to_numeric, errors='coerce')  # Convert all columns to numeric
        # Drop duplicates by timestamp, keeping only the first occurrence
        df = df[~df.index.duplicated(keep='first')]
        return df
    
    def dip_hunter_with_funding_and_sopr(self, data, params):
        """Execute the funding rate indicator logic."""
        # Function to calculate Exponential Moving Average (EMA)
        def ema(series, window, multiplier=1.0):
            return series.ewm(span=window, adjust=False).mean() * multiplier

        # Function to calculate Simple Moving Average (SMA)
        def sma(series, window):
            return series.rolling(window=window).mean()
        
        # Buy signals based on EMA logic
        data['longShortEmaBuy'] = ema(data['close'], params['longShortEmaLength'], params['longEma2Multiplier'])
        data['shortEma1Buy'] = ema(data['close'], params['shortEma1Length'], params['longEma2Multiplier'])
        data['longEma1Buy'] = ema(data['close'], params['longEma1Length'], params['longEma2Multiplier'])
        data['shortEma2Buy'] = ema(data['close'], params['shortEma2Length'], params['longEma2Multiplier'])

        # Calculate adaptive EMA for buy signal
        data['adaptiveEmaBuy'] = data.apply(
            lambda row: row['longEma1Buy'] if row['close'] > row['longShortEmaBuy'] 
            else (row['shortEma1Buy'] if row['close'] > row['shortEma1Buy'] 
            else row['shortEma2Buy']), 
            axis=1
        )

        # Calculate RSI
        data['rsi'] = ta.momentum.RSIIndicator(close=data['close'], window=params['rsiLength']).rsi()

        # Calculate EMA1 and EMA2 for Buy Signal
        data['ema1'] = ema(data['close'], params['bullEma1'])
        data['ema2'] = ema(data['close'], params['bullEma2'])

        # Calculate Rate of Change (RoC)
        data['roc'] = 100 * (data['close'] - data['close'].shift(params['rocLength'])) / data['close'].shift(params['rocLength'])

        # Calculate Moving Average of ROC and Standard Deviation
        data['rocSma'] = data['roc'].rolling(window=params['stdLength']).mean()
        data['rocStd'] = data['roc'].rolling(window=params['stdLength']).std()

        # Calculate upper and lower bands based on standard deviation
        data['upperBand'] = data['rocSma'] + params['upperBand'] * data['rocStd']
        data['lowerBand'] = data['rocSma'] - params['lowerBand'] * data['rocStd']

        # Buy signal logic with ROC and StdDev Bands
        data['buySignal'] = (data['close'] < data['adaptiveEmaBuy']) & \
                            (data['rsi'] < params['rsiBuyThreshold']) & \
                            (data['fr'] < params['fundingRateThreshold']) & \
                            (data['roc'] < data['lowerBand'])  # ROC condition

        # Classify buy signals as bull or bear based on EMA1 and EMA2
        data['bullBuy'] = data['buySignal'] & (data['ema1'] > data['ema2'])
        data['bearBuy'] = data['buySignal'] & (data['ema1'] < data['ema2'])

        # Sell signals based on EMA logic with ROC
        data['longShortEmaSell'] = ema(data['close'], params['longShortEmaLengthSell'], params['longEma2MultiplierSell'])
        data['shortEma1Sell'] = ema(data['close'], params['shortEma1LengthSell'], params['longEma2MultiplierSell'])
        data['longEma1Sell'] = ema(data['close'], params['longEma1LengthSell'], params['longEma2MultiplierSell'])
        data['shortEma2Sell'] = ema(data['close'], params['shortEma2LengthSell'], params['longEma2MultiplierSell'])

        data['adaptiveEmaSell'] = data['shortEma2Sell']

        # Calculate MA for the funding rate
        data['fundingRateMA'] = sma(data['fr'], params['fundingRateMAWindow'])

        # Sell signal logic
        data['sellSignal'] = (data['close'].shift(1) >= data['adaptiveEmaSell'].shift(1)) & \
                             (data['close'] < data['adaptiveEmaSell']) & \
                             (data['rsi'] > params['rsiSellThreshold']) & \
                             (data['fr'] > data['fundingRateMA']) & \
                             (data['fr'] > params['frThreshold']) & \
                             (data['roc'] > data['upperBand'])

        # Weak sell signal logic
        data['weakShortEma'] = ema(data['close'], params['weakShortEmaLength'])
        data['weakLongEma'] = ema(data['close'], params['weakLongEmaLength'])
        data['fundingRateMAWeak'] = sma(data['fr'], params['fundingRateMAWindowWeak'])

        data['weakSellSignal'] = (data['close'].shift(1) >= data['weakLongEma'].shift(1)) & \
                                 (data['close'] < data['weakLongEma']) & \
                                 (data['rsi'] > params['rsiWeakSellThreshold']) & \
                                 (data['fr'] > data['fundingRateMAWeak']) & \
                                 (data['fr'] > params['frThresholdWeak'])

        # Find crossovers
        data['cross_up'] = (data['ema1'] > data['ema2']) & (data['ema1'].shift(1) <= data['ema2'].shift(1))
        data['cross_down'] = (data['ema1'] < data['ema2']) & (data['ema1'].shift(1) >= data['ema2'].shift(1))

        return data
    
    def plot_signals(self, data, theme='light'):
        """Create a plot of the signals."""
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
        
        # Create a single-row plot with two y-axes
        fig = make_subplots(specs=[[{"secondary_y": True}]])
        
        # Main price data and signals on the left y-axis
        fig.add_trace(go.Scatter(
            x=data.index,
            y=data['close'],
            mode='lines',
            name='Price',
            text=[f"<b style='color:white;background:black;padding:2px;border-radius:3px;'>Price</b><br>Date: {d.strftime('%Y-%m-%d')}<br>Value: {v:.0f}" 
                for d, v in zip(data.index, data['close'])],
            line=dict(color=price_line_color, width=2.5)
        ), secondary_y=False)

        fig.add_trace(go.Scatter(
            x=data.index, 
            y=data['adaptiveEmaBuy'], 
            mode='lines', 
            name='Buy Line', 
            line=dict(color='green', dash='dot')
        ), secondary_y=False)
        
        fig.add_trace(go.Scatter(
            x=data.index, 
            y=data['adaptiveEmaSell'], 
            mode='lines', 
            name='Sell Line', 
            line=dict(color='red', dash='dot')
        ), secondary_y=False)

        # Buy and Sell Signals with custom shapes and colors
        fig.add_trace(go.Scatter(
            x=data.index[data['bullBuy']], 
            y=data['close'][data['bullBuy']] * 0.95, 
            mode='markers', 
            name='Bull Buy Signals', 
            marker=dict(
                symbol='triangle-up', 
                color='rgba(34, 139, 34, 0.8)', 
                size=12, 
                line=dict(color='black', width=1)
            )
        ), secondary_y=False)
        
        fig.add_trace(go.Scatter(
            x=data.index[data['bearBuy']], 
            y=data['close'][data['bearBuy']] * 0.95, 
            mode='markers', 
            name='Bear Buy Signals', 
            marker=dict(
                symbol='triangle-up', 
                color='orange', 
                size=12, 
                line=dict(color='black', width=1)
            )
        ), secondary_y=False)
        
        fig.add_trace(go.Scatter(
            x=data.index[data['sellSignal']], 
            y=data['close'][data['sellSignal']] * 1.05, 
            mode='markers', 
            name='Sell Signals', 
            marker=dict(
                symbol='triangle-down', 
                color='red', 
                size=12, 
                line=dict(color='black', width=1)
            )
        ), secondary_y=False)
        
        fig.add_trace(go.Scatter(
            x=data.index[data['weakSellSignal']], 
            y=data['close'][data['weakSellSignal']] * 1.03, 
            mode='markers', 
            name='Weak Sell Signals', 
            marker=dict(
                symbol='x', 
                color='orange', 
                size=10, 
                line=dict(color='black', width=1)
            )
        ), secondary_y=False)

        # Funding Rate on the right y-axis with color coding
        fig.add_trace(go.Bar(
            x=data.index, 
            y=data['fr'], 
            name='Funding Rate', 
            marker_color=['rgba(34, 139, 34, 0.7)' if v > 0 else 'rgba(220, 20, 60, 0.7)' for v in data['fr']]
        ), secondary_y=True)
        
        # Calculate padding by extending the x-axis range by 2% on both sides
        x_min = data.index[0]
        x_max = data.index[-1]
        x_range_padding = (x_max - x_min) * 0.02

        # Update layout
        fig.update_layout(
            title={
                'text': "Bitcoin Funding Rate Indicator", 
                'x': 0.5, 
                'y': 0.95, 
                'xanchor': 'center', 
                'yanchor': 'top', 
                'font': {'size': 24, 'color': text_color}
            },
            xaxis_title='',
            yaxis_title='BTC Price (log scale)',
            yaxis2_title='Funding Rate',
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
                range=[x_min - x_range_padding, x_max + x_range_padding],
                showgrid=False,
                tickfont=dict(color=text_color),
                tickangle=30,
                tickformat='%b %Y'
            ),
            yaxis=dict(
                showgrid=False,
                gridcolor=grid_color,
                tickfont=dict(color=text_color)
            ),
            yaxis2=dict(
                showgrid=True,
                gridcolor=grid_color,
                tickfont=dict(color=text_color)
            ),
        )
        
        # Update y-axes with log scale and limit range for Funding Rate
        fig.update_yaxes(type='log', secondary_y=False, color=text_color)
        fig.update_yaxes(range=[-0.06, 0.3], fixedrange=False, secondary_y=True, color=text_color)

        return fig
