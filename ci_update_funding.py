#!/usr/bin/env python
"""
CI-specific script to update funding indicator

This script uses the funding_indicator_ci.py module which has no dependency on base_indicator.py
"""

import os
import json
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ci_funding_update")

def update_funding_indicator():
    try:
        logger.info("Starting funding indicator update")
        
        # Import the CI-specific version of the funding indicator
        from indicators.funding_indicator_ci import FundingIndicator
        
        # Create indicator instance
        indicator = FundingIndicator()
        
        # Generate indicator data
        logger.info("Generating indicator data")
        result = indicator.generate_data({"period": "all", "theme": "light"})
        
        # Convert JSON string to a Python dictionary
        plotly_json = json.loads(result["plotly_json"])
        
        # Prepare data for insertion
        data = {
            "indicator_name": "funding_rate",
            "date": datetime.now().strftime('%Y-%m-%d'),
            "plotly_json": plotly_json,
            "latest_data": result["latest_data"]
        }
        
        # Delete existing record first
        logger.info("Deleting existing funding rate indicator")
        indicator.supabase.table("indicators").delete().eq("indicator_name", "funding_rate").execute()
        
        # Insert new record
        logger.info("Inserting new funding rate indicator")
        response = indicator.supabase.table("indicators").insert(data).execute()
        
        logger.info("✅ Funding indicator updated successfully")
        return True
    except Exception as e:
        logger.error(f"Error updating funding indicator: {e}")
        return False

if __name__ == "__main__":
    success = update_funding_indicator()
    exit(0 if success else 1)
