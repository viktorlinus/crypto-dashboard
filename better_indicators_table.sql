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

-- Create policy for authenticated read access (only authenticated users can read)
CREATE POLICY "Allow authenticated read access to indicators" 
  ON indicators FOR SELECT 
  TO authenticated
  USING (true);
