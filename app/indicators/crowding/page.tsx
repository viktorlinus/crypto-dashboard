'use client';

import { useState, useEffect } from 'react';
import CrowdingIndicatorChart from '../../../components/indicators/CrowdingIndicatorChart';
import TimeRangeSelector from '../../../components/TimeRangeSelector';
import { format, subDays, subMonths, subYears } from 'date-fns';

// Types
interface IndicatorData {
  id?: string;
  date: string;
  indicator_name?: string;
  base_coin?: string;
  value: number | null;
  data: any;
  metadata?: any;
}

export default function CrowdingIndicatorPage() {
  const [timeRange, setTimeRange] = useState<string>('ALL');
  const [indicatorData, setIndicatorData] = useState<IndicatorData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIndicatorData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Calculate date range based on selected time range
        const endDate = new Date();
        let startDate = new Date();
        
        switch (timeRange) {
          case '7D':
            startDate = subDays(endDate, 7);
            break;
          case '1M':
            startDate = subMonths(endDate, 1);
            break;
          case '3M':
            startDate = subMonths(endDate, 3);
            break;
          case '6M':
            startDate = subMonths(endDate, 6);
            break;
          case '1Y':
            startDate = subYears(endDate, 1);
            break;
          case 'ALL':
            // Use a far past date for "ALL"
            startDate = new Date('2010-01-01');
            break;
        }
        
        const formattedStartDate = format(startDate, 'yyyy-MM-dd');
        const formattedEndDate = format(endDate, 'yyyy-MM-dd');
        
        // First check if we have any data in the database
        console.log('Checking database status...');
        const debugResponse = await fetch('/api/indicators/debug');
        const debugData = await debugResponse.json();
        console.log('Debug response:', debugData);
        
        // Now use the simplified crowding endpoint that doesn't filter by date
        const apiUrl = `/api/indicators/crowding`;
        console.log(`Fetching crowding indicator from ${apiUrl}`);
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          console.error('API response not OK:', response.status, response.statusText);
          throw new Error(`Error: ${response.status}`);
        }
        
        const responseData = await response.json();
        console.log('API response data:', responseData);
        
        if (responseData.data && Array.isArray(responseData.data)) {
          console.log(`Received ${responseData.data.length} data points`); 
          setIndicatorData(responseData.data);
        } else {
          console.warn('No data array found in response', responseData);
          setIndicatorData([]);
        }
      } catch (err: any) {
        console.error('Error fetching indicator data:', err);
        setError(`Failed to load indicator data: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchIndicatorData();
  }, [timeRange]);

  // Extract the latest crowding value if available
  const latestCrowdingValue = indicatorData.length > 0 ? 
    indicatorData[indicatorData.length - 1]?.data?.BTC?.Crowding?.value || null : 
    null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Bitcoin Crowding Indicator</h1>
        <p className="text-gray-600">
          This indicator combines RSI and price momentum Z-score to identify crowded market conditions.
          Positive values suggest the market may be crowded/overvalued, while negative values suggest uncrowded/undervalued conditions.
        </p>
      </div>
      
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div className="flex items-center">
          <TimeRangeSelector
            selectedRange={timeRange}
            onRangeChange={setTimeRange}
            ranges={['7D', '1M', '3M', '6M', '1Y', 'ALL']}
          />
        </div>
        
        {latestCrowdingValue !== null && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-4 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="mr-3">
                <p className="text-sm text-gray-500">Current Crowding Value</p>
                <p className={`text-2xl font-bold ${latestCrowdingValue >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {latestCrowdingValue.toFixed(2)}
                </p>
              </div>
              <div className="text-xs">
                <div className={`py-1 px-3 rounded-full ${latestCrowdingValue >= 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {latestCrowdingValue >= 0 ? 'Potentially Crowded' : 'Potentially Undervalued'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-6">
        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : indicatorData.length === 0 ? (
          <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
            <p className="text-gray-500">No data available for Bitcoin Crowding Indicator</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <CrowdingIndicatorChart data={indicatorData} />
          </div>
        )}
      </div>
    </div>
  );
}