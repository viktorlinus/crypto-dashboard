import os
import json
import re
from supabase import create_client
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("check_indicators")

# Load environment variables from .env.local
def load_env_from_dotenv():
    try:
        with open('.env.local', 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    match = re.match(r'^([A-Za-z0-9_]+)=(.*)$', line)
                    if match:
                        key, value = match.groups()
                        os.environ[key] = value
                        logger.info(f"Loaded environment variable: {key}")
    except Exception as e:
        logger.warning(f"Error loading .env.local file: {e}")

# Supabase client setup
def get_supabase_client():
    # Try to use NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    
    # Try service role key first, if not available, fallback to anon key
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_key:
        logger.warning("SUPABASE_SERVICE_ROLE_KEY not found, trying NEXT_PUBLIC_SUPABASE_ANON_KEY instead")
        supabase_key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        logger.error("Supabase URL or key not found in environment variables")
        raise ValueError("Supabase URL or key not found in .env.local")
    
    logger.info(f"Connecting to Supabase at: {supabase_url}")
    return create_client(supabase_url, supabase_key)

def check_table():
    try:
        # Load environment variables
        load_env_from_dotenv()
        
        # Connect to Supabase
        supabase = get_supabase_client()
        
        # Check if indicators table exists
        logger.info("Checking for indicators table...")
        try:
            result = supabase.table("indicators").select("count").execute()
            logger.info(f"Indicators table exists with {result.count if hasattr(result, 'count') else 'unknown'} rows")
        except Exception as e:
            logger.error(f"Error checking indicators table: {e}")
            return
        
        # Get a sample row
        logger.info("Fetching a sample row...")
        sample = supabase.table("indicators").select("*").limit(1).execute()
        
        if sample.data and len(sample.data) > 0:
            logger.info("Found a sample row")
            logger.info(f"Sample row date: {sample.data[0].get('date')}")
            logger.info(f"Sample row data structure: {json.dumps(sample.data[0], indent=2)}")
            
            # Check for BTC data specifically
            if 'data' in sample.data[0]:
                data = sample.data[0]['data']
                if isinstance(data, str):
                    data = json.loads(data)
                
                logger.info(f"Data keys: {list(data.keys())}")
                
                if 'BTC' in data:
                    logger.info("BTC data found:")
                    logger.info(f"BTC keys: {list(data['BTC'].keys())}")
                    
                    if 'Crowding' in data['BTC']:
                        logger.info(f"BTC Crowding data structure: {json.dumps(data['BTC']['Crowding'], indent=2)}")
                    else:
                        logger.info("No Crowding data found for BTC")
                else:
                    logger.info("No BTC data found")
            else:
                logger.info("No 'data' field found in the row")
        else:
            logger.info("No data found in the indicators table")
            
        # Get total row count
        count = supabase.table("indicators").select("*", count='exact').execute()
        logger.info(f"Total rows in indicators table: {count.count if hasattr(count, 'count') else 'unknown'}")
        
    except Exception as e:
        logger.error(f"Error checking table: {e}")

if __name__ == "__main__":
    check_table()
