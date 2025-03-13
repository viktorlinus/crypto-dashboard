# Indicators Module for Crypto Dashboard

This module adds technical indicators capabilities to the Crypto Dashboard, with a particular focus on custom Bitcoin on-chain indicators.

## Overview

The Indicators module allows you to:

1. Store and visualize technical indicators in Supabase
2. View a dedicated "BTC Crowding Indicator" that identifies crowded market conditions
3. Browse and view all available indicators

## Setup Instructions

### 1. Set Up Supabase Table

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create the indicators table
CREATE TABLE indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  indicator_name TEXT NOT NULL,
  base_coin TEXT NOT NULL,
  value FLOAT,
  data JSONB,
  metadata JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for common query patterns
CREATE INDEX idx_indicators_date ON indicators(date);
CREATE INDEX idx_indicators_name ON indicators(indicator_name);
CREATE INDEX idx_indicators_coin ON indicators(base_coin);
CREATE INDEX idx_indicators_date_name_coin ON indicators(date, indicator_name, base_coin);

-- Add RLS policies if needed
ALTER TABLE indicators ENABLE ROW LEVEL SECURITY;

-- Example policy for read access
CREATE POLICY "Allow read access to indicators" 
  ON indicators FOR SELECT 
  USING (true);

-- Example policy for insert/update (modify as needed)
CREATE POLICY "Allow insert access to authenticated users" 
  ON indicators FOR INSERT 
  TO authenticated
  WITH CHECK (true);
```

### 2. Set Environment Variables

Add these variables to your `.env.local`:

```
INDICATORS_API_SECRET=your_secret_key_here
```

And make sure you have these existing variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Run the Indicators Uploader Script

To populate indicators data:

```bash
# Set environment variables for the script
export SUPABASE_URL=your_supabase_url
export SUPABASE_KEY=your_service_role_key

# Run the crowding indicator script
python crowding_indicator_supabase.py
```

## Features

### BTC Crowding Indicator

This is a custom indicator that combines:

- RSI (Relative Strength Index)
- 90-day Rate of Change (ROC)
- Z-score of the ROC
- The final signal is: RSI × Z-score

Interpretation:
- **Positive Values**: Market may be crowded/overvalued
- **Negative Values**: Market may be uncrowded/undervalued

### Indicators Browser

The general indicators page allows you to:

- Browse all available indicators
- Filter by time range (7D, 1M, 3M, 6M, 1Y, ALL)
- View detailed charts with metadata

## Code Structure

- `/app/api/indicators/*` - API endpoints for indicators
- `/app/indicators/*` - Pages for viewing indicators
- `/components/indicators/*` - UI components for indicators
- `crowding_indicator_supabase.py` - Script to process and upload the crowding indicator

## API Documentation

### GET `/api/indicators/list`

Returns a list of all available indicators.

### GET `/api/indicators/fetch`

Fetches indicator data with filtering options.

Query parameters:
- `indicator`: Indicator name (required)
- `startDate`: Start date in YYYY-MM-DD format
- `endDate`: End date in YYYY-MM-DD format
- `coin`: Base coin (defaults to BTC)

### POST `/api/indicators/update`

Uploads new indicator data.

Headers:
- `Authorization`: Bearer token (INDICATORS_API_SECRET)

Body:
```json
{
  "indicators": [
    {
      "date": "2023-01-01T00:00:00.000Z",
      "indicator_name": "Example Indicator",
      "base_coin": "BTC",
      "value": 42.5,
      "data": { /* Additional data */ },
      "metadata": { /* Metadata */ }
    }
  ]
}
```

## Adding New Indicators

To add new indicators:

1. Create a Python script similar to `crowding_indicator_supabase.py`
2. Calculate your indicator values
3. Format the data using the indicators schema
4. Upload to Supabase using the API or direct client
