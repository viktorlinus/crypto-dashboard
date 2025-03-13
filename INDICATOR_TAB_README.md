# Indicator Tab for Crypto Dashboard

This feature adds a dedicated tab for technical and on-chain indicators to the Crypto Dashboard, with a particular focus on the Bitcoin Crowding Indicator.

## Overview

The Indicator Tab allows you to:
1. View Bitcoin's Crowding Indicator that identifies potentially crowded/uncrowded market conditions
2. Compare price action against the indicator
3. Analyze indicator components (RSI and Z-score)
4. Select different time ranges for analysis

## Setup Instructions

### 1. Ensure Supabase Table Exists

Make sure you have the indicators table in your Supabase database. If not, run the following SQL:

```sql
-- Drop the existing indicators table and create a better one
DROP TABLE IF EXISTS indicators;

-- Create a cleaner indicators table
CREATE TABLE indicators (
  -- Use date as the primary key for simplicity
  date DATE PRIMARY KEY,
  
  -- Store all indicator data in a single JSONB column
  data JSONB NOT NULL,
  
  -- Track when records are updated
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on date for faster queries
CREATE INDEX idx_indicators_date ON indicators(date);

-- Add RLS policies
ALTER TABLE indicators ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated read access
CREATE POLICY "Allow authenticated read access to indicators" 
  ON indicators FOR SELECT 
  TO authenticated
  USING (true);
```

### 2. Install Required Python Packages

```bash
pip install pandas numpy supabase
```

### 3. Run the Indicator Uploader Script

```bash
# Make sure your .env.local file has the Supabase credentials
python indicators_uploader.py
```

## Features

### Bitcoin Crowding Indicator

The Bitcoin Crowding Indicator combines two technical measures:
- RSI (Relative Strength Index, 14-period)
- Z-score of the 90-day ROC (Rate of Change)

The formula is: `Crowding = RSI × Z-score`

Interpretation:
- **Positive Values (Teal)**: Market may be crowded/overvalued
- **Negative Values (Green)**: Market may be uncrowded/undervalued

### Interactive Chart Features

- Toggle between components (RSI, Z-score) in the legend
- Select different time ranges (7D, 1M, 3M, 6M, 1Y, ALL)
- See Bitcoin price chart and indicator chart aligned by date
- Hover for detailed values

## Code Structure

- `/components/indicators/IndicatorTab.tsx` - Main tab component
- `/components/indicators/CrowdingIndicatorChart.tsx` - Chart visualization
- `/app/page.tsx` - Updated with tab navigation
- `indicators_uploader.py` - Script to process and upload indicator data

## Usage

1. Run the `indicators_uploader.py` script to populate the indicators table
2. Start your Next.js app
3. Navigate to the "Indicators" tab in the main UI

## Adding New Indicators

To add more indicators:

1. Modify the `indicators_uploader.py` script to calculate additional indicators
2. Update the data structure in `prepare_indicators_data()` to include your new indicators
3. Create new visualization components in the `/components/indicators/` directory
4. Add links or tabs to access your new indicators

## Troubleshooting

If the indicators don't appear:
1. Check that the Supabase table exists and has data
2. Verify that your API routes are working correctly
3. Look for errors in the browser console
4. Make sure the indicator data format matches what the UI components expect
