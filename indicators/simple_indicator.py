"""
Simple Test Indicator

This is a basic indicator that doesn't depend on external APIs, just to verify the system works.
"""

import pandas as pd
import numpy as np
import plotly.graph_objects as go
from datetime import datetime, timedelta
import logging

from .base_indicator import BaseIndicator

logger = logging.getLogger(__name__)

class SimpleIndicator(BaseIndicator):
    """
    A simple indicator that generates random data for testing purposes.
    """
    
    def __init__(self):
        """Initialize the Simple Indicator"""
        super().__init__(
            name="simple-indicator",
            description="A simple test indicator with random data"
        )
    
    def get_parameters(self):
        """
        Get the parameters that this indicator accepts.
        
        Returns:
            dict: A dictionary of parameter descriptions
        """
        return {
            "period": "Number of days to show (default: 30)",
            "theme": "Chart theme ('light' or 'dark')"
        }
    
    def generate_data(self, params=None):
        """
        Generate data for the simple indicator.
        
        Args:
            params (dict, optional): Parameters for customizing the indicator
            
        Returns:
            dict: A dictionary with the indicator data
        """
        try:
            # Validate and process parameters
            custom_params = self.validate_params(params or {})
            days = int(custom_params.get('period', 30))
            theme = custom_params.get('theme', 'light')
            
            # Generate random price data
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            date_range = pd.date_range(start=start_date, end=end_date, freq='D')
            
            # Create synthetic price and oscillator data
            np.random.seed(42)  # For reproducibility
            base_price = 50000
            price_changes = np.random.normal(0, 500, len(date_range)).cumsum()
            prices = base_price + price_changes
            
            # Create oscillator between 0-100
            oscillator = 50 + np.random.normal(0, 10, len(date_range)).cumsum() % 50
            
            # Calculate some signals based on the oscillator
            buy_signals = oscillator < 30
            sell_signals = oscillator > 70
            
            # Create the plot
            fig = self.create_plot(date_range, prices, oscillator, buy_signals, sell_signals, theme)
            
            # Return the results
            return {
                "plotly_json": fig.to_json(),
                "latest_data": {
                    "timestamp": date_range[-1].strftime('%Y-%m-%d'),
                    "price": float(prices[-1]),
                    "oscillator": float(oscillator[-1]),
                    "buy_signal": bool(buy_signals[-1]),
                    "sell_signal": bool(sell_signals[-1])
                }
            }
        except Exception as e:
            logger.exception("Error generating simple indicator data")
            return {"error": str(e)}
    
    def validate_params(self, params):
        """
        Validate the parameters for the simple indicator.
        
        Args:
            params (dict): The parameters to validate
            
        Returns:
            dict: The validated parameters
        """
        valid_params = {}
        
        # Period validation
        if 'period' in params:
            try:
                period = int(params['period'])
                if 1 <= period <= 365:
                    valid_params['period'] = period
                else:
                    valid_params['period'] = 30  # Default
            except (ValueError, TypeError):
                valid_params['period'] = 30  # Default
        
        # Theme validation
        if 'theme' in params:
            theme = params['theme']
            if theme in ['light', 'dark']:
                valid_params['theme'] = theme
            else:
                valid_params['theme'] = 'light'  # Default
        
        return valid_params
    
    def create_plot(self, dates, prices, oscillator, buy_signals, sell_signals, theme):
        """
        Create a plotly figure with the indicator data.
        
        Args:
            dates (array): Array of dates
            prices (array): Array of prices
            oscillator (array): Array of oscillator values
            buy_signals (array): Boolean array indicating buy signals
            sell_signals (array): Boolean array indicating sell signals
            theme (str): Chart theme ('light' or 'dark')
            
        Returns:
            Figure: A plotly figure
        """
        # Set theme colors
        if theme == 'dark':
            bg_color = 'rgba(40, 40, 40, 1)'
            paper_bg = 'rgba(30, 30, 30, 1)'
            grid_color = 'rgba(80, 80, 80, 0.3)'
            text_color = '#ffffff'
        else:  # light theme
            bg_color = 'rgba(255, 255, 255, 1)'
            paper_bg = 'rgba(245, 245, 245, 1)'
            grid_color = 'rgba(200, 200, 200, 0.3)'
            text_color = '#333333'
        
        # Create a subplot with 2 rows
        fig = go.Figure()
        
        # Add price chart
        fig.add_trace(go.Scatter(
            x=dates,
            y=prices,
            mode='lines',
            name='Price',
            line=dict(color='blue', width=2)
        ))
        
        # Add buy signals
        fig.add_trace(go.Scatter(
            x=dates[buy_signals],
            y=prices[buy_signals],
            mode='markers',
            name='Buy Signal',
            marker=dict(
                symbol='triangle-up',
                size=12,
                color='green',
                line=dict(color='black', width=1)
            )
        ))
        
        # Add sell signals
        fig.add_trace(go.Scatter(
            x=dates[sell_signals],
            y=prices[sell_signals],
            mode='markers',
            name='Sell Signal',
            marker=dict(
                symbol='triangle-down',
                size=12,
                color='red',
                line=dict(color='black', width=1)
            )
        ))
        
        # Update layout
        fig.update_layout(
            title='Simple Test Indicator',
            height=600,
            plot_bgcolor=bg_color,
            paper_bgcolor=paper_bg,
            font=dict(color=text_color),
            xaxis=dict(
                title='Date',
                gridcolor=grid_color,
                showgrid=True
            ),
            yaxis=dict(
                title='Price',
                gridcolor=grid_color,
                showgrid=True
            ),
            legend=dict(
                orientation='h',
                yanchor='bottom',
                y=1.02,
                xanchor='center',
                x=0.5
            ),
            hovermode='x unified'
        )
        
        return fig
