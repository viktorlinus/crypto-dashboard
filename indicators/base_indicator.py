"""
Base Indicator Class

This module defines the BaseIndicator class that all indicators should inherit from.
It provides common functionality and a standard interface for all indicators.
"""

import abc
import logging

logger = logging.getLogger(__name__)

class BaseIndicator(abc.ABC):
    """
    Base class for all indicators. 
    
    All indicators should inherit from this class and implement the required methods.
    """
    
    def __init__(self, name, description):
        """
        Initialize the base indicator.
        
        Args:
            name (str): The name of the indicator, used in API endpoints
            description (str): A short description of what the indicator does
        """
        self.name = name
        self.description = description
    
    @abc.abstractmethod
    def generate_data(self, params=None):
        """
        Generate data for the indicator.
        
        This method should be implemented by all indicator classes.
        
        Args:
            params (dict, optional): Parameters for customizing the indicator output
            
        Returns:
            dict: A dictionary with the indicator data, which should contain at least:
                - plotly_json: JSON representation of the plotly figure
                - latest_data: Dictionary with the latest data/signals
        """
        pass
    
    def get_info(self):
        """
        Get basic information about the indicator.
        
        Returns:
            dict: Information about the indicator
        """
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self.get_parameters()
        }
    
    def get_parameters(self):
        """
        Get the parameters that this indicator accepts.
        
        Returns:
            dict: A dictionary of parameter names and their descriptions
        """
        return {}  # Default implementation returns no parameters
    
    def validate_params(self, params):
        """
        Validate the parameters passed to the indicator.
        
        Args:
            params (dict): The parameters to validate
            
        Returns:
            dict: The validated and possibly transformed parameters
            
        Raises:
            ValueError: If the parameters are invalid
        """
        # Default implementation does no validation
        return params or {}
