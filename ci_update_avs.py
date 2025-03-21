#!/usr/bin/env python
"""
If running this script locally, make sure you have a .env.local file with:
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_service_role_key_here


CI-specific script to update AVS indicator

This script uses the avs_indicator_ci.py module which has no dependency on base_indicator.py
"""

import os
import json
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ci_avs_update")

def update_avs_indicator():
    try:
        logger.info("Starting AVS indicator update")
        
        # Import the CI-specific version of the AVS indicator
        from indicators.avs_indicator_ci import AVSIndicator
        
        # Create indicator instance
        indicator = AVSIndicator()
        
        # Generate indicator data
        logger.info("Generating indicator data")
        result = indicator.generate_data({"period": "all", "theme": "light"})
        
        # Convert JSON string to a Python dictionary
        plotly_json = json.loads(result["plotly_json"])
        
        # Prepare data for insertion
        data = {
            "indicator_name": "avs_average",
            "date": datetime.now().strftime('%Y-%m-%d'),
            "plotly_json": plotly_json,
            "latest_data": result["latest_data"]
        }
        
        # Delete existing record first
        logger.info("Deleting existing AVS indicator")
        indicator.supabase.table("indicators").delete().eq("indicator_name", "avs_average").execute()
        
        # Insert new record
        logger.info("Inserting new AVS indicator")
        response = indicator.supabase.table("indicators").insert(data).execute()
        
        logger.info("✅ AVS indicator updated successfully")
        return True
    except Exception as e:
        logger.error(f"Error updating AVS indicator: {e}")
        return False

if __name__ == "__main__":
    success = update_avs_indicator()
    exit(0 if success else 1)
