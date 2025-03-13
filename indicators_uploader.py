import os
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from supabase import create_client
import logging
import re
from typing import Dict, List, Any, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("indicators_uploader")

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
            
            # Look for BTC price
            btc_price = None
            if "BTC" in prices_data:
                btc_price = float(prices_data["BTC"])
            
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

# Calculate crowding indicator
def calculate_indicators(df):
    if df is None or df.empty:
        logger.error("Cannot calculate indicators: No data available")
        return None
    
    try:
        indicators_df = df.copy()
        
        # 1. Calculate RSI (14-period)
        logger.info("Calculating RSI...")
        delta = indicators_df['BTC'].diff()
        gain = delta.clip(lower=0)
        loss = -delta.clip(upper=0)
        
        avg_gain = gain.rolling(window=14).mean()
        avg_loss = loss.rolling(window=14).mean()
        
        # Handle division by zero
        avg_loss = avg_loss.replace(0, np.finfo(float).eps)
        
        # Calculate RS and RSI
        rs = avg_gain / avg_loss
        indicators_df['RSI'] = 100 - (100 / (1 + rs))
        
        # 2. Calculate Rate of Change (90-day)
        logger.info("Calculating ROC...")
        indicators_df['ROC'] = indicators_df['BTC'].pct_change(90) * 100
        
        # 3. Calculate Z-score of ROC
        logger.info("Calculating Z-score...")
        window = 100
        indicators_df['ROC_Mean'] = indicators_df['ROC'].rolling(window=window).mean()
        indicators_df['ROC_Std'] = indicators_df['ROC'].rolling(window=window).std()
        
        # Handle division by zero for Z-score calculation
        indicators_df['ROC_Std'] = indicators_df['ROC_Std'].replace(0, np.finfo(float).eps)
        
        indicators_df['Z_Score'] = (indicators_df['ROC'] - indicators_df['ROC_Mean']) / indicators_df['ROC_Std']
        
        # 4. Calculate the crowding indicator (RSI * Z-Score)
        indicators_df['Crowding'] = indicators_df['RSI'] * indicators_df['Z_Score']
        
        # Drop NaN values
        indicators_df = indicators_df.dropna()
        logger.info(f"Final dataframe has {len(indicators_df)} records after dropping NaNs")
        
        # Print some sample data to verify calculations
        logger.info(f"Sample data:\n{indicators_df.head()}")
        
        return indicators_df
    except Exception as e:
        logger.error(f"Error calculating indicators: {e}")
        return None

# Prepare data for Supabase
def prepare_indicators_data(df):
    if df is None or df.empty:
        logger.warning("No data available to prepare indicators")
        return []
    
    records = []
    logger.info("Preparing indicator data for Supabase...")
    
    for date, row in df.iterrows():
        date_str = date.strftime('%Y-%m-%d')  # Format date as YYYY-MM-DD
        
        # Format for exact compatibility with the visualization
        # Make sure the structure exactly matches what the CrowdingIndicatorChart expects
        record = {
            "date": date_str,
            "data": {
                "BTC": {
                    "price": float(row['BTC']),
                    "RSI": {
                        "value": float(row['RSI']),
                        "period": 14,
                        "description": "Relative Strength Index",
                        "interpretation": "Values above 70 indicate overbought, below 30 indicate oversold"
                    },
                    "Crowding": {
                        "value": float(row['Crowding']),
                        "roc": float(row['ROC']),
                        "zScore": float(row['Z_Score']),
                        "window": 100,
                        "roc_period": 90,
                        "rsi_period": 14,
                        "description": "Bitcoin Crowding Index combining RSI and price rate of change Z-score",
                        "interpretation": "Positive values indicate crowded markets, negative values indicate uncrowded markets"
                    }
                }
            }
        }
        
        records.append(record)
    
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
        
        # Data validation
        for idx, record in enumerate(indicators):
            if not isinstance(record, dict):
                logger.error(f"Record at index {idx} is not a dictionary, skipping")
                continue
                
            if 'date' not in record:
                logger.error(f"Record at index {idx} is missing 'date', skipping")
                continue
                
            if 'data' not in record or not isinstance(record['data'], dict):
                logger.error(f"Record at index {idx} is missing or has invalid 'data' field, skipping")
                continue
                
            # Verify BTC and required fields exist
            if 'BTC' not in record['data'] or not isinstance(record['data']['BTC'], dict):
                logger.error(f"Record at index {idx} is missing BTC data, skipping")
                continue
                
            required_fields = ['price', 'RSI', 'Crowding']
            missing_fields = [f for f in required_fields if f not in record['data']['BTC']]
            if missing_fields:
                logger.error(f"Record at index {idx} is missing required fields: {missing_fields}, skipping")
                continue
        
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
                
                # Verify the upload was successful
                if not hasattr(result, 'data') or not result.data:
                    logger.warning(f"Upsert for chunk {i//chunk_size + 1} didn't return confirmation data")
            except Exception as e:
                logger.error(f"Error uploading chunk: {e}")
                logger.error(f"First record in chunk: {json.dumps(chunk[0], indent=2)}")
        
        logger.info(f"Successfully uploaded indicators to Supabase")
        
        # Verify the total count after upload
        try:
            count = supabase.table("indicators").select("count").execute()
            logger.info(f"Total rows in indicators table after upload: {count.count if hasattr(count, 'count') else 'unknown'}")
        except Exception as e:
            logger.warning(f"Error checking final row count: {e}")
    except Exception as e:
        logger.error(f"Error in upload_indicators: {e}")
        raise

# Main process function
def process_indicators():
    try:
        logger.info("Starting indicators process...")
        
        # Load environment variables from .env.local
        load_env_from_dotenv()
        
        # Initialize Supabase client
        logger.info("Initializing Supabase client...")
        supabase = get_supabase_client()
        
        # Get BTC price data
        logger.info("Fetching BTC price data...")
        df = get_btc_price_data(supabase)
        
        if df is not None and not df.empty:
            # Calculate indicators
            logger.info("Calculating indicators...")
            indicators_df = calculate_indicators(df)
            
            # Prepare data for Supabase
            indicators = prepare_indicators_data(indicators_df)
            
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
        logger.error(f"Error in process_indicators: {e}")
        return False

if __name__ == "__main__":
    success = process_indicators()
    if success:
        logger.info("Successfully processed and uploaded indicators")
    else:
        logger.error("Failed to process indicators")
