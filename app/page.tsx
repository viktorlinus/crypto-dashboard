'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PriceChart from '@/components/PriceChart';
import CoinSelector from '@/components/CoinSelector';
import DateRangeSelector, { getDateRangeFromSelection } from '@/components/DateRangeSelector';
import DataTypeSelector from '@/components/DataTypeSelector';
import StatsCard from '@/components/StatsCard';
import ScaleToggle from '@/components/ScaleToggle';
import MetricsWorkbench from '@/components/metrics/MetricsWorkbench';
import { CustomMetric } from '@/components/metrics/MetricBuilder';
import { calculateCustomMetrics, prepareDataForMetrics, formatMetricDataForChart } from '@/lib/metricEvaluator';

export default function Home() {
  // State variables
  const [availableCoins, setAvailableCoins] = useState<string[]>([]);
  const [selectedCoins, setSelectedCoins] = useState<string[]>(['BTC', 'ETH', 'SOL', 'BNB']);
  const [coinScope, setCoinScope] = useState<string>('current'); // 'current' or 'all'
  const [timeRange, setTimeRange] = useState<string>('3m');
  const [dataType, setDataType] = useState<string>('prices');
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ [key: string]: any }>({});
  const [isLogarithmic, setIsLogarithmic] = useState<boolean>(false);
  const [showMetricsWorkbench, setShowMetricsWorkbench] = useState<boolean>(false);
  const [selectedMetric, setSelectedMetric] = useState<CustomMetric | null>(null);
  const [metricChartData, setMetricChartData] = useState<any[]>([]);
  const [marketCapData, setMarketCapData] = useState<any[]>([]);
  const [volumeData, setVolumeData] = useState<any[]>([]);

  // Update metric chart data
  const updateMetricChartData = () => {
    if (!selectedMetric || chartData.length === 0) return;
    
    // Prepare data for metric calculation
    const preparedData = prepareDataForMetrics(
      chartData,
      marketCapData,
      volumeData,
      selectedCoins
    );
    
    // Calculate the custom metric for all selected coins
    const metricsData = calculateCustomMetrics(preparedData, [selectedMetric], selectedCoins);
    
    // Format the data for the chart to work with multiple coins
    const formattedData = formatMetricDataForChart(metricsData, selectedMetric.name, selectedCoins);
    
    setMetricChartData(formattedData);
  };

  // Handle metric selection
  const handleMetricSelect = (metric: CustomMetric | null) => {
    setSelectedMetric(metric);
    
    if (metric) {
      // Switch to custom metric view
      updateMetricChartData();
    }
  };

  // Fetch available coins based on the selected scope
  useEffect(() => {
    const fetchCoins = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('/api/crypto/coins', {
          params: { scope: coinScope }
        });
        setAvailableCoins(response.data);
      } catch (err) {
        console.error('Failed to fetch coins:', err);
        setError('Failed to fetch available cryptocurrencies.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoins();
  }, [coinScope]);

  // Handle coin scope change
  const handleScopeChange = (scope: string) => {
    setCoinScope(scope);
  };

  // Fetch chart data when dependencies change
  useEffect(() => {
    const fetchData = async () => {
      if (selectedCoins.length === 0) {
        setChartData([]);
        setMarketCapData([]);
        setVolumeData([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { startDate, endDate } = getDateRangeFromSelection(timeRange);
        
        // Fetch price data
        const priceResponse = await axios.get('/api/crypto/prices', {
          params: {
            start: startDate,
            end: endDate,
            coins: selectedCoins.join(','),
          },
        });

        // Also fetch market cap and volume data for metrics
        const [marketCapResponse, volumeResponse] = await Promise.all([
          axios.get('/api/crypto/market-caps', {
            params: {
              start: startDate,
              end: endDate,
              coins: selectedCoins.join(','),
            },
          }),
          axios.get('/api/crypto/volumes', {
            params: {
              start: startDate,
              end: endDate,
              coins: selectedCoins.join(','),
            },
          })
        ]);

        // Store all data types
        setChartData(priceResponse.data);
        setMarketCapData(marketCapResponse.data);
        setVolumeData(volumeResponse.data);

        // Process for currently selected data type
        let displayData;
        switch (dataType) {
          case 'market-caps':
            displayData = marketCapResponse.data;
            break;
          case 'volumes':
            displayData = volumeResponse.data;
            break;
          default:
            displayData = priceResponse.data;
        }

        // Calculate stats
        calculateStats(displayData);

        // Update metric data if a metric is selected
        if (selectedMetric) {
          updateMetricChartData();
        }
      } catch (err) {
        console.error(`Failed to fetch ${dataType}:`, err);
        setError(`Failed to fetch cryptocurrency ${dataType.replace('-', ' ')}.`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedCoins, timeRange]);

  // Handle data type changes
  useEffect(() => {
    if (chartData.length === 0) return;
    
    // Select the appropriate dataset based on data type
    let displayData;
    switch (dataType) {
      case 'market-caps':
        displayData = marketCapData;
        break;
      case 'volumes':
        displayData = volumeData;
        break;
      default:
        displayData = chartData; // prices
    }
    
    // Calculate stats for the selected data type
    if (displayData && displayData.length > 0) {
      calculateStats(displayData);
    }
  }, [dataType, chartData, marketCapData, volumeData]);

  // Toggle logarithmic scale
  const toggleScale = () => {
    setIsLogarithmic(!isLogarithmic);
  };

  // Toggle metrics workbench visibility
  const toggleMetricsWorkbench = () => {
    setShowMetricsWorkbench(!showMetricsWorkbench);
  };

  // Automatically switch to logarithmic scale when multiple coins with large price differences are selected
  useEffect(() => {
    if (selectedCoins.length <= 1) {
      // Only one coin selected, no need for logarithmic scale
      return;
    }

    // Check if we should suggest logarithmic scale based on price differences
    if (chartData.length > 0 && dataType === 'prices') {
      let minPrice = Number.MAX_VALUE;
      let maxPrice = 0;

      // Get latest prices for selected coins
      const latestData = chartData[chartData.length - 1];
      
      selectedCoins.forEach(coin => {
        if (latestData[coin]) {
          minPrice = Math.min(minPrice, latestData[coin]);
          maxPrice = Math.max(maxPrice, latestData[coin]);
        }
      });

      // If there's a significant difference (e.g., 100x), suggest using logarithmic scale
      const priceDifference = maxPrice / minPrice;
      
      // Enable logarithmic scale automatically if there's a big difference and more than one coin
      if (priceDifference > 50 && !isLogarithmic && selectedCoins.length > 1) {
        // For better UX, we automatically enable logarithmic scale for large differences
        setIsLogarithmic(true);
      }
    }
  }, [chartData, selectedCoins, dataType]);

  // Calculate statistics for selected coins
  const calculateStats = (data: any[]) => {
    if (!data || data.length === 0) {
      setStats({});
      return;
    }

    const newStats: { [key: string]: any } = {};

    selectedCoins.forEach(coin => {
      // Get current and previous values
      const currentValue = data[data.length - 1][coin];
      const previousValue = data[0][coin];
      
      if (currentValue === undefined || previousValue === undefined) {
        return;
      }

      // Calculate percentage change
      const change = currentValue - previousValue;
      const percentChange = (change / previousValue) * 100;

      // Format values
      const formattedValue = formatValue(currentValue, dataType);
      const formattedChange = `${percentChange.toFixed(2)}%`;

      newStats[coin] = {
        value: formattedValue,
        change: formattedChange,
        isPositive: percentChange > 0,
        isNegative: percentChange < 0,
      };
    });

    setStats(newStats);
  };

  // Format values based on data type
  const formatValue = (value: number, type: string): string => {
    if (type === 'prices') {
      return value < 1 ? `$${value.toFixed(4)}` : `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (type === 'market-caps') {
      return formatMarketCap(value);
    } else { // volumes
      return formatVolume(value);
    }
  };

  const formatMarketCap = (value: number): string => {
    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(2)}B`;
    } else if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    } else if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(2)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  };

  const formatVolume = (value: number): string => {
    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(2)}B`;
    } else if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    } else if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(2)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  };

  // Generate chart title
  const getChartTitle = (): string => {
    if (selectedMetric) {
      return `Custom Metric: ${selectedMetric.name}`;
    } else if (dataType === 'prices') {
      return 'Cryptocurrency Prices';
    } else if (dataType === 'market-caps') {
      return 'Market Capitalization';
    } else {
      return 'Trading Volume';
    }
  };

  // Generate Y-axis label
  const getYAxisLabel = (): string => {
    if (selectedMetric) {
      return selectedMetric.name;
    } else if (dataType === 'prices') {
      return 'Price (USD)';
    } else if (dataType === 'market-caps') {
      return 'Market Cap (USD)';
    } else {
      return 'Volume (USD)';
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="container mx-auto px-6">
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Crypto Dashboard</h1>
          <p className="text-gray-600 mt-2">Real-time cryptocurrency market insights</p>
        </header>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-10 border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-lg font-medium text-gray-700 mb-4">Select Cryptocurrencies</h2>
                <CoinSelector
                  availableCoins={availableCoins}
                  selectedCoins={selectedCoins}
                  onChange={setSelectedCoins}
                  onScopeChange={handleScopeChange}
                  currentScope={coinScope}
                  maxCoins={5}
                />
              </div>
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-700 mb-4">Data Type</h2>
                  <DataTypeSelector 
                    selectedType={dataType} 
                    onTypeChange={setDataType} 
                  />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-700 mb-4">Time Range</h2>
                  <DateRangeSelector
                    selectedRange={timeRange}
                    onRangeChange={setTimeRange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-0 bg-gray-50">
            {selectedCoins.map(coin => {
              const coinStats = stats[coin] || { value: 'N/A' };
              return (
                <div key={coin} className="border-r border-gray-100 last:border-r-0 border-b md:border-b-0">
                  <StatsCard
                    title={coin}
                    value={coinStats.value}
                    change={coinStats.change}
                    isPositive={coinStats.isPositive}
                    isNegative={coinStats.isNegative}
                  />
                </div>
              );
            })}
          </div>

          {/* Chart Section */}
          <div className="p-6">
            <div className="flex justify-between mb-4">
              <div className="text-sm text-gray-500">
                {selectedMetric ? (
                  `Showing custom metric: ${selectedMetric.name}`
                ) : coinScope === 'all' ? (
                  'Showing data from all tracked coins (including historical)'
                ) : (
                  'Showing data from current top 100 coins only'
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={toggleMetricsWorkbench}
                  className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors text-sm flex items-center"
                >
                  {showMetricsWorkbench ? 'Hide Metrics Workbench' : 'Metrics Workbench'}
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </button>
                
                {selectedCoins.length > 1 && dataType === 'prices' && !selectedMetric && (
                  <ScaleToggle 
                    isLogarithmic={isLogarithmic}
                    onToggle={toggleScale}
                  />
                )}
              </div>
            </div>
            
            {/* Metrics Workbench Section */}
            {showMetricsWorkbench && (
              <div className="mb-6">
                <MetricsWorkbench 
                  sampleData={chartData.length > 0 ? prepareDataForMetrics(chartData, marketCapData, volumeData, selectedCoins) : []}
                  onMetricSelect={handleMetricSelect}
                />
              </div>
            )}
            
            <div className="relative h-96">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : error ? (
                <div className="absolute inset-0 flex items-center justify-center text-red-500 bg-red-50 rounded-lg p-6">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>{error}</p>
                  </div>
                </div>
              ) : chartData.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
                  <div className="text-center p-6">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>No data available. Please select at least one cryptocurrency.</p>
                  </div>
                </div>
              ) : (
                <PriceChart
                  data={selectedMetric ? metricChartData : (
                    dataType === 'market-caps' ? marketCapData : 
                    dataType === 'volumes' ? volumeData : 
                    chartData
                  )}
                  coins={selectedMetric ? selectedCoins : selectedCoins}
                  title={getChartTitle()}
                  yAxisLabel={getYAxisLabel()}
                  timeRange={timeRange}
                  isLogarithmic={isLogarithmic}
                />
              )}
            </div>
            
            {selectedCoins.length > 1 && dataType === 'prices' && !isLogarithmic && !selectedMetric && (
              <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-lg text-sm">
                <div className="flex">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>
                    <strong>Pro tip:</strong> When comparing cryptocurrencies with different price ranges (like BTC vs. lower-priced coins), 
                    try using logarithmic scale to better visualize relative price movements.
                  </p>
                </div>
              </div>
            )}
            
            {selectedMetric && (
              <div className="mt-4 flex justify-between">
                <div className="p-4 bg-purple-50 text-purple-700 rounded-lg text-sm">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <div>
                      <strong>Custom Metric:</strong> {selectedMetric.name}
                      <p className="mt-1 text-sm text-purple-600 font-mono">{selectedMetric.formula}</p>
                      {selectedMetric.description && (
                        <p className="mt-1 text-sm">{selectedMetric.description}</p>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMetric(null)}
                  className="px-3 py-2 h-10 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                >
                  Back to Standard View
                </button>
              </div>
            )}
          </div>
        </div>
        
        <footer className="text-center text-gray-500 text-sm">
          <p>Data updated in real-time • {new Date().toLocaleDateString()}</p>
        </footer>
      </div>
    </main>
  );
}