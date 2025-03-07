import os
import requests
import pandas as pd
import time
import json
from datetime import datetime, UTC, timedelta
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv('.env.local')

# === Supabase Configuration ===
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
COINGECKO_API_KEY = os.getenv('COINGECKO_API_KEY')

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ------------------------------
# Functions for tracking coins and rankings
# ------------------------------
def update_tracked_coins(supabase, new_coins):
    """
    Updates the tracked_coins table by:
    - Adding new coins that weren't previously tracked
    - Updating the last_in_top100 date for existing coins
    """
    today = datetime.now(UTC).strftime('%Y-%m-%d')
    
    # Get existing tracked coins
    try:
        response = supabase.table('tracked_coins').select('symbol').execute()
        existing_coins = [item['symbol'] for item in response.data]
    except Exception as e:
        print(f"Error getting tracked coins: {e}")
        existing_coins = []
    
    # Prepare data for newly discovered coins
    coins_to_add = []
    current_top100_symbols = [coin["Symbol"] for coin in new_coins]
    
    for coin in new_coins:
        symbol = coin["Symbol"]
        if symbol not in existing_coins:
            coins_to_add.append({
                'symbol': symbol,
                'id': coin["ID"],
                'first_tracked': today,
                'last_in_top100': today,
                'active': True
            })
    
    # Update last_in_top100 date for coins currently in top 100
    for symbol in existing_coins:
        if symbol in current_top100_symbols:
            try:
                supabase.table('tracked_coins').update({
                    'last_in_top100': today
                }).eq('symbol', symbol).execute()
            except Exception as e:
                print(f"Error updating last_in_top100 for {symbol}: {e}")
    
    # Add new coins to tracking
    if coins_to_add:
        try:
            supabase.table('tracked_coins').insert(coins_to_add).execute()
            print(f"Added {len(coins_to_add)} new coins to tracking")
        except Exception as e:
            print(f"Error adding new coins to tracking: {e}")
        
    return current_top100_symbols

def update_rankings(supabase, coins):
    """
    Records today's rankings in the crypto_rankings table
    """
    today = datetime.now(UTC).strftime('%Y-%m-%d')
    rankings = {}
    
    # Create rankings dictionary with position for each coin
    for position, coin in enumerate(coins, 1):
        symbol = coin["Symbol"]
        rankings[symbol] = position
    
    # Prepare ranking data for Supabase
    ranking_data = {
        'date': today,
        'rankings': rankings
    }
    
    # Upsert to rankings table
    try:
        supabase.table('crypto_rankings').upsert([ranking_data]).execute()
        print(f"✅ Updated rankings for {today}")
    except Exception as e:
        print(f"Error updating rankings: {e}")

def get_all_active_coins(supabase, current_top100, max_days_out=30):
    """
    Gets all coins that should be tracked:
    - Current top 100
    - Previously tracked coins that were in top 100 within the cutoff period
    """
    today = datetime.now(UTC)
    cutoff_date = (today - timedelta(days=max_days_out)).strftime('%Y-%m-%d')
    
    # Get previously tracked coins still within cutoff
    try:
        response = supabase.table('tracked_coins').select('symbol, id').gte('last_in_top100', cutoff_date).execute()
        
        # Convert to the same format as current_top100
        current_symbols = [coin["Symbol"] for coin in current_top100]
        additional_coins = []
        
        for item in response.data:
            if item['symbol'] not in current_symbols:
                additional_coins.append({"ID": item['id'], "Symbol": item['symbol']})
        
        combined_coins = current_top100 + additional_coins
        print(f"Tracking {len(combined_coins)} coins: {len(current_top100)} in top 100 + {len(additional_coins)} historical")
        return combined_coins
        
    except Exception as e:
        print(f"Error getting tracked coins, defaulting to current top 100: {e}")
        return current_top100

# ------------------------------
# Get top coins from CoinGecko (fetch up to 250) and filter out excluded coins
# ------------------------------
url_markets = "https://pro-api.coingecko.com/api/v3/coins/markets"
params_markets = {
    "vs_currency": "usd",
    "order": "market_cap_desc",
    "per_page": 250,  # fetch up to 250 coins
    "page": 1,
    "sparkline": False
}
headers_markets = {
    "x-cg-pro-api-key": COINGECKO_API_KEY,
    "Accept": "application/json"
}

response_markets = requests.get(url_markets, params=params_markets, headers=headers_markets)
response_markets.raise_for_status()
coins_data = response_markets.json()

# Exclusion list (CoinGecko IDs) – coins to be skipped
exclude_ids = [
    "tether", "usd-coin", "staked-ether", "wrapped-bitcoin", "wrapped-steth", "usds",
    "weth", "ethena-usde", "wrapped-eeth", "dai", "susds", "ethereum-classic",
    "coinbase-wrapped-btc", "first-digital-usd", "binance-peg-weth", "kelp-dao-restaked-eth",
    "solv-btc", "rocket-pool-eth", "binance-staked-sol", "mantle-staked-ether", "usual-usd",
    "solv-protocol-solvbtc-bbn", "renzo-restaked-eth", "msol", "wbnb",
    "arbitrum-bridged-wbtc-arbitrum-one", "jupiter-staked-sol", "mantle-restaked-eth",
    "binance-peg-dogecoin", "l2-standard-bridged-weth-base", "usdx-money-usdx"
]

# Filter out excluded coins from the fetched list
filtered_coins = [coin for coin in coins_data if coin["id"] not in exclude_ids]

# Select the top 100 coins from the filtered list (if available)
selected_coins = filtered_coins[:100]
print(f"Total coins after exclusion and selection: {len(selected_coins)}")

# Build a list of coin dictionaries with "ID" and "Symbol"
coins = [{"ID": coin["id"], "Symbol": coin["symbol"].upper()} for coin in selected_coins]

# ------------------------------
# Update rankings and tracked coins
# ------------------------------
print("Updating coin rankings...")
update_rankings(supabase, coins)

print("Updating tracked coins list...")
update_tracked_coins(supabase, coins)

# Get all coins that should be tracked (current top 100 + recently relevant)
all_coins_to_track = get_all_active_coins(supabase, coins, max_days_out=30)

# ------------------------------
# API settings for historical data
# ------------------------------
base_url = "https://pro-api.coingecko.com/api/v3/coins/{}/market_chart/range"
headers = {
    "x-cg-pro-api-key": COINGECKO_API_KEY,
    "Accept": "application/json"
}
# Here we fetch data from January 1, 2023 until now (adjust as needed)
params = {
    "vs_currency": "usd",
    "from": int(datetime(2023, 1, 1, tzinfo=UTC).timestamp()),
    "to": int(datetime.now(UTC).timestamp())
}

# Storage for price, market cap, and volume data
price_data = {}
market_cap_data = {}
volume_data = {}

# ------------------------------
# Fetch historical data for each coin
# ------------------------------
def fetch_coin_data(coin_id, symbol):
    print(f"Fetching data for {symbol} (ID: {coin_id})...")
    url = base_url.format(coin_id)
    
    try:
        response = requests.get(url, params=params, headers=headers)
        
        # Check for rate limiting
        if response.status_code == 429:
            retry_after = int(response.headers.get('Retry-After', 60))
            print(f"Rate limited. Waiting {retry_after} seconds...")
            time.sleep(retry_after)
            # Retry the request
            response = requests.get(url, params=params, headers=headers)
        
        response.raise_for_status()
        data = response.json()
        
        # Extract daily prices WITHOUT ROUNDING
        prices = {datetime.fromtimestamp(d[0] // 1000, UTC).strftime('%Y-%m-%d'): float(d[1]) 
                  for d in data.get("prices", [])}
        
        # Extract market caps
        market_caps = {datetime.fromtimestamp(d[0] // 1000, UTC).strftime('%Y-%m-%d'): float(d[1]) 
                      for d in data.get("market_caps", [])}
        
        # Extract total volumes
        volumes = {datetime.fromtimestamp(d[0] // 1000, UTC).strftime('%Y-%m-%d'): float(d[1]) 
                  for d in data.get("total_volumes", [])}
        
        return prices, market_caps, volumes
    
    except requests.exceptions.RequestException as e:
        print(f"Failed to fetch {symbol}: {e}")
        return {}, {}, {}

# Fetch data for all coins to track, not just the top 100
for coin in all_coins_to_track:
    coin_id = coin["ID"]
    symbol = coin["Symbol"]
    
    prices, market_caps, volumes = fetch_coin_data(coin_id, symbol)
    
    if prices:
        price_data[symbol] = prices
        market_cap_data[symbol] = market_caps
        volume_data[symbol] = volumes

# ------------------------------
# Convert data dictionaries to DataFrames
# ------------------------------
def create_dataframe(data):
    df = pd.DataFrame(data)
    df.insert(0, "Date", df.index)
    return df

df_prices = create_dataframe(price_data)
df_market_caps = create_dataframe(market_cap_data)
df_volumes = create_dataframe(volume_data)

# Save locally as CSV (optional)
df_prices.to_csv("top_100_coins_prices.csv", index=False)
df_market_caps.to_csv("top_100_coins_market_caps.csv", index=False)
df_volumes.to_csv("top_100_coins_volumes.csv", index=False)
print("✅ Saved historical data locally.")

# Modify the batch_insert function
def batch_insert(supabase, table_name, data, batch_size=100):
    if data.empty:
        print(f"No data to insert for {table_name}")
        return

    supabase_data = []
    for _, row in data.iterrows():
        # Convert row to a dictionary, filtering out NaN values
        row_data = row.dropna().to_dict()
        
        # Remove 'Date' from the data to be stored in JSON
        coin_data = {k: float(v) for k, v in row_data.items() if k != 'Date' and pd.notna(v)}
        
        # Only add if coin_data is not empty
        if coin_data:
            supabase_data.append({
                'date': row_data['Date'],
                'prices': coin_data
            })

    if not supabase_data:
        print(f"No valid data to insert for {table_name}")
        return

    for i in range(0, len(supabase_data), batch_size):
        batch = supabase_data[i:i+batch_size]
        try:
            # Upsert to handle potential duplicate dates
            response = supabase.table(table_name).upsert(batch).execute()
            print(f"Inserted/Updated {table_name} batch {i//batch_size + 1}")
        except Exception as e:
            print(f"Error inserting {table_name} batch {i//batch_size + 1}: {e}")

# Perform batch inserts
batch_insert(supabase, 'crypto_prices', df_prices)
batch_insert(supabase, 'crypto_market_caps', df_market_caps)
batch_insert(supabase, 'crypto_volumes', df_volumes)

print("🚀 Supabase upload complete!")