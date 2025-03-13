import os
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from supabase import create_client
import logging
from typing import Dict, List, Any
import re

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("crowding_indicator")

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

# Load service account
def load_service_account(file_path: str) -> Dict[str, Any]:
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load service account file: {e}")
        raise

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

# Get BTC price data from Supabase
def get_btc_price_data(supabase):
    try:
        # Query the crypto_prices table
        logger.info("Querying the crypto_prices table...")
        query = supabase.table("crypto_prices").select("*").order("date").execute()
        
        if len(query.data) == 0:
            logger.error("No price data found in crypto_prices table")
            return None
        
        logger.info(f"Retrieved {len(query.data)} days of price data")
        
        # Initialize empty lists for dates and prices
        dates = []
        btc_prices = []
        
        # Extract BTC prices from the JSON structure
        for row in query.data:
            date = row['date']
            prices_json = row['prices']
            
            # If prices is already a dictionary (parsed by Supabase client)
            if isinstance(prices_json, dict):
                prices_data = prices_json
            else:
                # Otherwise parse it as JSON
                prices_data = json.loads(prices_json)
            
            # Look for BTC price - try "GT" since we saw that in the sample data
            btc_price = None
            if "GT" in prices_data:
                btc_price = float(prices_data["GT"])
            
            # If we found a valid price, add to our lists
            if btc_price is not None:
                dates.append(date)
                btc_prices.append(btc_price)
            
        # Create dataframe from extracted data
        df = pd.DataFrame({
            'date': dates,
            'BTC': btc_prices
        })
        
        df['date'] = pd.to_datetime(df['date'])
        df.set_index('date', inplace=True)
        df = df.sort_index()
        
        logger.info(f"Created dataframe with {len(df)} rows of BTC price data")
        logger.info(f"Sample data (first 5 rows):\n{df.head()}")
        
        return df
    except Exception as e:
        logger.error(f"Error fetching BTC price data: {e}")
        return None

# Calculate RSI manually 
def calculate_rsi(series, period=14):
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    
    avg_gain = gain.rolling(window=period).mean()
    avg_loss = loss.rolling(window=period).mean()
    
    # Handle division by zero
    avg_loss = avg_loss.replace(0, np.finfo(float).eps)
    
    # Calculate RS
    rs = avg_gain / avg_loss
    
    # Calculate RSI
    rsi = 100 - (100 / (1 + rs))
    
    return rsi

# Calculate Rate of Change manually
def calculate_roc(series, period=90):
    return series.pct_change(period) * 100

# Calculate crowding indicator
def calculate_crowding_indicator(df):
    if df is None or df.empty:
        logger.error("Cannot calculate indicator: No data available")
        return None
    
    try:
        # Calculate technical indicators manually
        logger.info("Calculating RSI...")
        df['RSI'] = calculate_rsi(df['BTC'], 14)
        
        logger.info("Calculating ROC...")
        df['ROC'] = calculate_roc(df['BTC'], 90)
        
        # Calculate rolling Z-score
        logger.info("Calculating Z-score...")
        window = 100
        df['rolling_mean'] = df['ROC'].rolling(window).mean()
        df['rolling_std'] = df['ROC'].rolling(window).std()
        
        # Handle division by zero by replacing 0 with a small number
        df['rolling_std'] = df['rolling_std'].replace(0, np.finfo(float).eps)
        
        df['zScore'] = (df['ROC'] - df['rolling_mean']) / df['rolling_std']
        
        # Calculate crowding signal
        df['Signal'] = df['RSI'] * df['zScore']
        
        # Drop NaN values
        df = df.dropna()
        logger.info(f"Final dataframe has {len(df)} records after dropping NaNs")
        
        return df
    except Exception as e:
        logger.error(f"Error calculating crowding indicator: {e}")
        return None

# Prepare data for Supabase - now using a cleaner structure
def prepare_indicators_data(df):
    if df is None or df.empty:
        logger.warning("No data available to prepare indicators")
        return []
    
    indicators_by_date = {}
    logger.info("Preparing indicator data for Supabase...")
    
    for date, row in df.iterrows():
        date_str = date.strftime('%Y-%m-%d')  # Format date as YYYY-MM-DD
        
        # Create or update the data for this date
        if date_str not in indicators_by_date:
            indicators_by_date[date_str] = {
                "date": date_str,
                "data": {}
            }
        
        # Add the indicator data
        indicators_by_date[date_str]["data"].update({
            "BTC": {
                "price": float(row['BTC']),
                "RSI": {
                    "value": float(row['RSI']),
                    "period": 14,
                    "description": "Relative Strength Index",
                    "interpretation": "Values above 70 indicate overbought, below 30 indicate oversold"
                },
                "Crowding": {
                    "value": float(row['Signal']),
                    "roc": float(row['ROC']),
                    "zScore": float(row['zScore']),
                    "window": 100,
                    "roc_period": 90,
                    "rsi_period": 14,
                    "description": "Bitcoin Crowding Index combining RSI and price rate of change Z-score",
                    "interpretation": "Positive values indicate crowded markets, negative values indicate uncrowded markets"
                }
            }
        })
    
    # Convert the dictionary to a list of records
    records = list(indicators_by_date.values())
    logger.info(f"Prepared {len(records)} indicator records")
    return records

# Upload indicators to Supabase
def upload_indicators(supabase, indicators):
    if not indicators:
        logger.warning("No indicators to upload")
        return
    
    try:
        # Check if table exists
        try:
            check = supabase.table("indicators").select("*").limit(1).execute()
            logger.info("Indicators table exists")
        except Exception as e:
            logger.warning(f"Error checking indicators table: {e}")
            logger.warning("Please run the better_indicators_table.sql script in your Supabase SQL editor")
            return
        
        # Split into chunks to avoid hitting request size limits
        chunk_size = 50  
        for i in range(0, len(indicators), chunk_size):
            chunk = indicators[i:i + chunk_size]
            
            logger.info(f"Uploading chunk {i//chunk_size + 1}/{(len(indicators) + chunk_size - 1)//chunk_size}...")
            try:
                # Use upsert with the date as the conflict key
                result = supabase.table("indicators").upsert(
                    chunk, 
                    on_conflict="date"
                ).execute()
                logger.info(f"Uploaded chunk {i//chunk_size + 1}")
            except Exception as e:
                logger.error(f"Error uploading chunk: {e}")
                logger.error(f"First record in chunk: {chunk[0]}")
        
        logger.info(f"Successfully uploaded indicators to Supabase")
    except Exception as e:
        logger.error(f"Error in upload_indicators: {e}")
        raise

# Main process function
def process_crowding_indicator():
    try:
        logger.info("Starting crowding indicator process...")
        
        # Load environment variables from .env.local
        load_env_from_dotenv()
        
        # Load service account
        logger.info("Loading service account...")
        service_account = load_service_account("liquidity-435820-92a5f57b22d7.json")
        
        # Initialize Supabase client
        logger.info("Initializing Supabase client...")
        supabase = get_supabase_client()
        
        # Get BTC price data
        logger.info("Fetching BTC price data...")
        df = get_btc_price_data(supabase)
        
        if df is not None and not df.empty:
            # Calculate indicator
            logger.info("Calculating crowding indicator...")
            df = calculate_crowding_indicator(df)
            
            # Prepare data for Supabase
            indicators = prepare_indicators_data(df)
            
            # Upload to Supabase
            if indicators:
                logger.info("Uploading indicators to Supabase...")
                upload_indicators(supabase, indicators)
                return True
            else:
                logger.warning("No indicators generated")
                return False
        else:
            logger.error("No price data available")
            return False
    except Exception as e:
        logger.error(f"Error in process_crowding_indicator: {e}")
        return False

if __name__ == "__main__":
    success = process_crowding_indicator()
    if success:
        logger.info("Successfully processed and uploaded crowding indicator")
    else:
        logger.error("Failed to process crowding indicator")
