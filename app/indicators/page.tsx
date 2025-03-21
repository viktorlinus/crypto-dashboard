'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import IndicatorSelector from '../../components/indicators/IndicatorSelector';
import IndicatorChart from '../../components/indicators/IndicatorChart';
import TimeRangeSelector from '../../components/TimeRangeSelector';
import { FundingIndicator } from '../../components/indicators/FundingIndicator';
import { format, subDays, subMonths, subYears } from 'date-fns';

// Types
interface IndicatorData {
  id: string;
  date: string;
  indicator_name: string;
  base_coin: string;
  value: number | null;
  data: any;
  metadata: any;
}

export default function IndicatorsPage() {
  const [selectedIndicator, setSelectedIndicator] = useState<string | null>(null);
  const [availableIndicators, setAvailableIndicators] = useState<string[]>([]);
  const [indicatorData, setIndicatorData] = useState<IndicatorData[]>([]);
  const [timeRange, setTimeRange] = useState<string>('1M');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available indicators on component mount
  useEffect(() => {
    async function fetchAvailableIndicators() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/indicators/list');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.indicators && Array.isArray(data.indicators)) {
          setAvailableIndicators(data.indicators);
          
          // Select first indicator by default if none selected
          if (data.indicators.length > 0 && !selectedIndicator) {
            setSelectedIndicator(data.indicators[0]);
          }
        } else {
          setAvailableIndicators([]);
        }
      } catch (err: any) {
        console.error('Error fetching indicators:', err);
        setError('Failed to load available indicators');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAvailableIndicators();
  }, []);
  
  // Fetch indicator data when selection or time range changes
  useEffect(() => {
    if (!selectedIndicator) return;
    
    async function fetchIndicatorData() {
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
            // Just use a far past date for "ALL"
            startDate = new Date('2010-01-01');
            break;
        }
        
        const formattedStartDate = format(startDate, 'yyyy-MM-dd');
        const formattedEndDate = format(endDate, 'yyyy-MM-dd');
        
        const params = new URLSearchParams({
          indicator: selectedIndicator || '',
          startDate: formattedStartDate,
          endDate: formattedEndDate
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
    }
    
    fetchIndicatorData();
  }, [selectedIndicator, timeRange]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Technical Indicators</h1>
      
      {/* Featured Indicators */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Featured Indicators</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Crowding Indicator Card */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">BTC Crowding Indicator</h3>
              <p className="text-gray-600 text-sm mb-4">
                Combines RSI and price momentum to identify crowded market conditions
              </p>
              <div className="h-32 bg-gradient-to-r from-teal-100 to-green-100 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-teal-700">
                  Crowding Index
                </span>
              </div>
              <Link 
                href="/indicators/crowding" 
                className="block text-center py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                View Indicator
              </Link>
            </div>
          </div>
          
          {/* Funding Rate Indicator Card */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">BTC Funding Indicator</h3>
              <p className="text-gray-600 text-sm mb-4">
                Buy/sell signals based on funding rates and technical analysis
              </p>
              <div className="h-32 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-700">
                  Funding Signals
                </span>
              </div>
              <Link 
                href="/indicators/funding" 
                className="block text-center py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                View Indicator
              </Link>
            </div>
          </div>
          
          {/* AVS Average Indicator Card */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">BTC Value Range System</h3>
              <p className="text-gray-600 text-sm mb-4">
                Identifies optimal buy/sell zones based on the AVS average
              </p>
              <div className="h-32 bg-gradient-to-r from-green-100 to-red-100 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-700">
                  AVS Average
                </span>
              </div>
              <Link 
                href="/indicators/avs" 
                className="block text-center py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                View Indicator
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Standard Indicators Browser */}
      <div>
        <h2 className="text-xl font-semibold mb-4">All Indicators</h2>
        
        <div className="flex flex-wrap items-center justify-between mb-6">
          <div className="w-full md:w-auto mb-4 md:mb-0">
            <TimeRangeSelector 
              selectedRange={timeRange}
              onRangeChange={setTimeRange}
              ranges={['7D', '1M', '3M', '6M', '1Y', 'ALL']}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-3">
            <IndicatorSelector 
              indicators={availableIndicators}
              selectedIndicator={selectedIndicator}
              onSelectIndicator={setSelectedIndicator}
            />
          </div>
          
          <div className="md:col-span-9">
            {error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                <p className="text-gray-500">Loading indicator data...</p>
              </div>
            ) : !selectedIndicator ? (
              <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                <p className="text-gray-500">Select an indicator to view</p>
              </div>
            ) : indicatorData.length === 0 ? (
              <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                <p className="text-gray-500">No data available for the selected time range</p>
              </div>
            ) : (
              <IndicatorChart 
                data={indicatorData}
                indicatorName={selectedIndicator}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}