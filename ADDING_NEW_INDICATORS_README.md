# Adding New Indicators to the Crypto Dashboard

This guide explains how to efficiently add a new indicator to the dashboard when you have a Python file that generates a Plotly chart.

## Overview

The process involves:

1. Creating an indicator CI module
2. Setting up the CI update script
3. Updating the GitHub Actions workflow
4. Adding frontend components
5. Configuring credentials safely

## Step 1: Create the Indicator CI Module

Create a new Python file in the `indicators` directory named `your_indicator_ci.py`:

```python
"""
CI-specific version of your indicator module.
"""

import os
import json
import pandas as pd
import re
import plotly.graph_objects as go
# Import other necessary libraries for your indicator

# Configure logging
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class YourIndicator:
    """
    Your indicator class - this should be self-contained.
    """
    
    def __init__(self):
        """Initialize the indicator"""
        self.name = "your-indicator-name"
        self.description = "Brief description of your indicator"
        
        # Configuration 
        self.creds_file = 'your_credentials.json'  # JSON credentials file
        
        # Default parameters
        self.default_params = {
            # Add your indicator parameters/thresholds here
            'parameter1': 0.5,
            'parameter2': 10,
        }
        
        # Get Supabase client
        supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        supabase_key = os.environ.get("SUPABASE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        
        # Try reading from .env.local if environment variables not found
        if not supabase_url or not supabase_key:
            logger.info("Trying to read Supabase credentials from .env.local")
            try:
                if os.path.exists('.env.local'):
                    with open('.env.local', 'r') as f:
                        for line in f:
                            line = line.strip()
                            if line and not line.startswith('#'):
                                match = re.match(r'^([A-Za-z0-9_]+)=(.*)$', line)
                                if match:
                                    key, value = match.groups()
                                    if key == "SUPABASE_URL" or key == "NEXT_PUBLIC_SUPABASE_URL":
                                        supabase_url = value
                                    elif key in ["SUPABASE_KEY", "SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]:
                                        supabase_key = value
                else:
                    logger.warning(".env.local file not found")
            except Exception as e:
                logger.warning(f"Error reading .env.local file: {e}")
        
        if not supabase_url or not supabase_key:
            raise ValueError("Supabase credentials required - add them to .env.local or set as environment variables")
        
        from supabase import create_client
        self.supabase = create_client(supabase_url, supabase_key)
    
    def generate_data(self, params=None):
        """
        Generate data for the indicator.
        
        Args:
            params (dict, optional): Parameters for customizing the indicator
            
        Returns:
            dict: A dictionary with the indicator data and plotly chart
        """
        try:
            # Process parameters
            custom_params = self.validate_params(params or {})
            chart_params = self.default_params.copy()
            
            # Merge any custom parameters
            for key, value in custom_params.items():
                if key in chart_params:
                    if isinstance(chart_params[key], int):
                        chart_params[key] = int(value)
                    elif isinstance(chart_params[key], float):
                        chart_params[key] = float(value)
            
            # Load your data - replace with your data loading logic
            indicator_data = self.load_data()
            
            # Filter data if period specified
            period = custom_params.get('period', None)
            if period and period != 'all':
                indicator_data = self.filter_by_period(indicator_data, period)
            
            # Create the plot using your existing plot logic
            fig = self.create_plot(indicator_data, chart_params)
            
            # Get latest information for the dashboard display
            latest_data = self.get_latest_data(indicator_data)
            
            # Return both the chart and the data
            return {
                "plotly_json": fig.to_json(),
                "latest_data": latest_data
            }
        except Exception as e:
            logger.exception(f"Error generating {self.name} data")
            return {"error": str(e)}
    
    # Implement these methods for your specific indicator:
    
    def validate_params(self, params):
        """Validate and filter parameters"""
        # Your parameter validation logic here
        pass
        
    def load_data(self):
        """Load the data for your indicator"""
        # Your data loading logic here
        pass
        
    def filter_by_period(self, data, period):
        """Filter data by time period"""
        # Your period filtering logic here
        pass
        
    def create_plot(self, data, params):
        """Create the Plotly figure"""
        # Your plotting logic here - adapt from your existing plot code
        pass
        
    def get_latest_data(self, data):
        """Get the latest data for the dashboard display"""
        # Extract and format the most recent data
        pass
```

## Step 2: Create the CI Update Script

Create a new Python script named `ci_update_your_indicator.py` in the project root:

```python
#!/usr/bin/env python
"""
CI-specific script to update your indicator

If running this script locally, make sure you have a .env.local file with:
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_service_role_key_here
"""

import os
import json
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ci_your_indicator_update")

def update_your_indicator():
    try:
        logger.info("Starting your indicator update")
        
        # Import the CI-specific version of your indicator
        from indicators.your_indicator_ci import YourIndicator
        
        # Create indicator instance
        indicator = YourIndicator()
        
        # Generate indicator data
        logger.info("Generating indicator data")
        result = indicator.generate_data({"period": "all", "theme": "light"})
        
        # Convert JSON string to a Python dictionary
        plotly_json = json.loads(result["plotly_json"])
        
        # Prepare data for insertion
        data = {
            "indicator_name": "your_indicator_name",
            "date": datetime.now().strftime('%Y-%m-%d'),
            "plotly_json": plotly_json,
            "latest_data": result["latest_data"]
        }
        
        # Delete existing record first
        logger.info("Deleting existing indicator")
        indicator.supabase.table("indicators").delete().eq("indicator_name", "your_indicator_name").execute()
        
        # Insert new record
        logger.info("Inserting new indicator")
        response = indicator.supabase.table("indicators").insert(data).execute()
        
        logger.info("✅ Your indicator updated successfully")
        return True
    except Exception as e:
        logger.error(f"Error updating your indicator: {e}")
        return False

if __name__ == "__main__":
    success = update_your_indicator()
    exit(0 if success else 1)
```

## Step 3: Update the GitHub Actions Workflow

Edit the existing workflow file at `.github/workflows/funding-indicator-update.yml`:

```yaml
# Add your indicator steps to the existing workflow
- name: Create your indicator credentials file
  run: echo '${{ secrets.YOUR_INDICATOR_CREDENTIALS_JSON }}' > your_credentials.json

- name: Run your indicator update
  run: python ci_update_your_indicator.py
  env:
    SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
    SUPABASE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

Make sure to also update the workflow name and description to include your new indicator.

## Step 4: Add Frontend Components

### 1. Create the Indicator Component

Create a new file in `components/indicators/YourIndicator.jsx`:

```jsx
'use client';

import { useState, useEffect } from 'react';
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import PasswordProtection from "../PasswordProtection";

// Dynamically import Plotly to prevent server-side rendering issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export function YourIndicator() {
  // Get password from environment variable (use the same password as other indicators)
  const correctPassword = process.env.NEXT_PUBLIC_FUNDING_PASSWORD || 'alpha1';
  
  // Protected content component
  const ProtectedContent = () => {
    const [latestData, setLatestData] = useState(null);
    const [plotData, setPlotData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
      async function fetchLatestData() {
        try {
          setLoading(true);
          
          // Fetch the latest indicator data from Supabase
          const { data, error } = await supabase
            .from("indicators")
            .select("*")
            .eq("indicator_name", "your_indicator_name")
            .order("date", { ascending: false })
            .limit(1)
            .single();

          if (error) throw error;

          setLatestData(data.latest_data);
          setPlotData(data.plotly_json);
          setError(null);
        } catch (err) {
          console.error("Error fetching data:", err);
          setError("Failed to load indicator data");
        } finally {
          setLoading(false);
        }
      }

      fetchLatestData();
    }, []);

    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Your Indicator Title</h2>
        </div>
        
        <div className="p-4">
          {loading ? (
            <div className="flex h-[400px] items-center justify-center">
              <p className="text-gray-500">Loading indicator...</p>
            </div>
          ) : error ? (
            <div className="flex h-[400px] items-center justify-center">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <>
              {/* Render Plotly Chart */}
              {plotData && (
                <div className="w-full max-w-[1400px] mx-auto">
                  <Plot 
                    data={plotData.data} 
                    layout={{ 
                      ...plotData.layout, 
                      autosize: true
                    }} 
                    useResizeHandler={true}
                    className="w-full h-[600px]"
                  />
                </div>
              )}

              {/* Display latest data metrics */}
              {latestData && (
                <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                  {/* Add your metrics cards here */}
                  <MetricCard title="Metric 1" value={latestData.value1} />
                  <MetricCard title="Metric 2" value={latestData.value2} />
                  {/* Add more metrics as needed */}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <PasswordProtection correctPassword={correctPassword}>
      <ProtectedContent />
    </PasswordProtection>
  );
}

// Helper component for displaying metrics
function MetricCard({ title, value, type = 'neutral', customColor }) {
  const typeStyles = {
    positive: "bg-green-200 text-green-800",
    negative: "bg-red-200 text-red-800",
    warning: "bg-orange-200 text-orange-800",
    neutral: "bg-gray-200 text-gray-700"
  };
  
  const colorClass = customColor || typeStyles[type];

  return (
    <div className="rounded-lg p-3 border">
      <h4 className="text-sm font-medium text-gray-500">{title}</h4>
      <p className={`mt-1 rounded-md px-2 py-1 text-lg font-bold ${colorClass}`}>
        {value}
      </p>
    </div>
  );
}
```

### 2. Create the Indicator Page

Create a new file in `app/indicators/your-indicator/page.tsx`:

```tsx
'use client';

import { YourIndicator } from '../../../components/indicators/YourIndicator';

export default function YourIndicatorPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Indicator Title</h1>
      
      <div className="mb-6">
        <p className="text-gray-700">
          Description of your indicator and what it's used for.
        </p>
      </div>
      
      <div className="mb-8">
        <YourIndicator />
      </div>
      
      <div className="prose max-w-none">
        <h2 className="text-xl font-bold mb-4">How It Works</h2>
        
        {/* Add more sections explaining how your indicator works */}
        <h3 className="text-lg font-semibold mb-2">Section 1</h3>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2"><strong>Point 1:</strong> Explanation of point 1.</li>
          <li className="mb-2"><strong>Point 2:</strong> Explanation of point 2.</li>
        </ul>
        
        <h3 className="text-lg font-semibold mb-2">Section 2</h3>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2"><strong>Point 1:</strong> Explanation of point 1.</li>
          <li className="mb-2"><strong>Point 2:</strong> Explanation of point 2.</li>
        </ul>
        
        <h2 className="text-xl font-bold mb-4 mt-6">Interpretation</h2>
        <p className="mb-4">
          Guidance on how to interpret and use this indicator.
        </p>
      </div>
    </div>
  );
}
```

### 3. Update the Main Indicators Page

Edit `app/indicators/page.tsx` to add your indicator to the list of featured indicators:

```tsx
{/* Your Indicator Card */}
<div className="bg-white rounded-lg shadow overflow-hidden">
  <div className="p-4">
    <h3 className="text-lg font-semibold mb-2">Your Indicator Title</h3>
    <p className="text-gray-600 text-sm mb-4">
      Brief description of your indicator
    </p>
    <div className="h-32 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg mb-4 flex items-center justify-center">
      <span className="text-2xl font-bold text-blue-700">
        Indicator Name
      </span>
    </div>
    <Link 
      href="/indicators/your-indicator" 
      className="block text-center py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
    >
      View Indicator
    </Link>
  </div>
</div>
```

## Step 5: GitHub Secrets Configuration

Add the required secrets to your GitHub repository:

1. Go to your GitHub repository
2. Click on "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret" and add:
   - `YOUR_INDICATOR_CREDENTIALS_JSON`: Content of your indicator credentials file

## Best Practices

1. **Separate Concerns**: Keep your indicator logic modular and separate from the main app.
2. **Error Handling**: Add robust error handling in both Python and frontend code.
3. **Documentation**: Create a README file for your indicator with details on its methodology.
4. **Local Testing**: Test the update script locally before pushing to GitHub.
5. **Credentials Security**:
   - Keep your credential files in `.gitignore`
   - Use GitHub secrets for CI/CD
   - Store credentials in `.env.local` for local development

## Adapting Existing Python Code

When adapting an existing Python file with a Plotly chart:

1. Extract the core data processing and plotting logic
2. Refactor to fit the class-based structure
3. Ensure the output is in a format compatible with Supabase storage
4. Make sure the Plotly chart is JSON serializable

## Example Checklist

- [ ] Create indicator CI module (`indicators/your_indicator_ci.py`)
- [ ] Create CI update script (`ci_update_your_indicator.py`)
- [ ] Update GitHub Actions workflow
- [ ] Create frontend component (`components/indicators/YourIndicator.jsx`)
- [ ] Create indicator page (`app/indicators/your-indicator/page.tsx`)
- [ ] Update main indicators page
- [ ] Add GitHub secrets
- [ ] Test locally
- [ ] Create documentation

By following this guide, you should be able to efficiently integrate new indicators into the dashboard with minimal effort.
