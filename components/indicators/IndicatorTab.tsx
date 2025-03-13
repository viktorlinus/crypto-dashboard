'use client';

import React, { useState, useEffect } from 'react';
import TimeRangeSelector from '../TimeRangeSelector';
import CrowdingIndicatorChart from './CrowdingIndicatorChart';
import { format, subDays, subMonths, subYears } from 'date-fns';

interface IndicatorTabProps {
  className?: string;
}

const IndicatorTab: React.FC<IndicatorTabProps> = ({ className = '' }) => {
  const [timeRange, setTimeRange] = useState<string>('1M');
  const [indicatorData, setIndicatorData] = useState<any[]>([]);
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
        
        const params = new URLSearchParams({
          indicator: 'Crowding',
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          coin: 'BTC'
        });
        
        const response = await fetch(`/api/indicators/fetch?${params}`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const responseData = await response.json();
        
        if (responseData.data && Array.isArray(responseData.data)) {
          setIndicatorData(responseData.data);
        } else {
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
    <div className={`p-4 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Bitcoin Crowding Indicator</h2>
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
};

export default IndicatorTab;