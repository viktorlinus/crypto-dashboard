import json
import os
import logging
from supabase import create_client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("funding_updater")

def get_supabase_client():
    """Create and return a Supabase client using environment variables"""
    # Try to get Supabase credentials from environment
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")
    
    # If not found, try alternate names
    if not supabase_url:
        supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    
    if not supabase_key:
        # Try service role key first, then anon key
        supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        if not supabase_key:
            supabase_key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    # Validate credentials
    if not supabase_url or not supabase_key:
        logger.error("Supabase credentials not found in environment variables")
        raise ValueError("Supabase credentials required")
    
    logger.info(f"Creating Supabase client with URL: {supabase_url[:20]}...")
    return create_client(supabase_url, supabase_key)

def save_to_supabase():
    """Manually generate and save indicator data to Supabase"""
    logger.info("Starting funding indicator update process")
    
    # Initialize Supabase client
    supabase = get_supabase_client()
    
    try:
        # Now import the funding indicator module with supabase instance
        from indicators.funding_indicator import FundingIndicator
        
        # Create indicator instance
        logger.info("Creating funding indicator instance")
        indicator = FundingIndicator()
        
        # ✅ Get all available data
        logger.info("Generating indicator data")
        result = indicator.generate_data({"period": "all", "theme": "light"})  

        # ✅ Convert JSON string to a Python dictionary
        plotly_json = json.loads(result["plotly_json"])  # ✅ Fix this!

        # ✅ Insert the correct JSON format
        data = {
            "indicator_name": "funding_rate",
            "plotly_json": plotly_json,  # ✅ Now stored as a valid JSON object
            "latest_data": result["latest_data"]  # ✅ Already a dictionary
        }

        logger.info("Uploading data to Supabase")
        response = supabase.table("indicators").upsert(data, on_conflict="indicator_name").execute()
        logger.info("✅ Saved to Supabase successfully")
        
        return True
    except Exception as e:
        logger.error(f"Error in save_to_supabase: {e}")
        raise

# Run manually if script is executed
if __name__ == "__main__":
    save_to_supabase()
