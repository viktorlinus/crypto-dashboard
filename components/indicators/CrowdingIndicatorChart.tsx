'use client';

import { useEffect, useRef, useState } from 'react';
import { Chart, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, BarController, BarElement, LogarithmicScale } from 'chart.js';
import { format, parseISO } from 'date-fns';

// Register Chart.js components
Chart.register(
  LineController, 
  LineElement, 
  PointElement, 
  CategoryScale, 
  LinearScale, 
  LogarithmicScale,
  Tooltip, 
  Legend,
  BarController,
  BarElement
);

interface CrowdingIndicatorChartProps {
  data: any[];
}

const CrowdingIndicatorChart: React.FC<CrowdingIndicatorChartProps> = ({ data }) => {
  const priceChartRef = useRef<HTMLCanvasElement>(null);
  const indicatorChartRef = useRef<HTMLCanvasElement>(null);
  const priceChartInstance = useRef<Chart | null>(null);
  const indicatorChartInstance = useRef<Chart | null>(null);
  const [hasData, setHasData] = useState(true);
  
  // Format the date for display
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM d, yyyy');
    } catch (e) {
      return dateStr;
    }
  };
  
  useEffect(() => {
    if (!priceChartRef.current || !indicatorChartRef.current) {
      console.warn('Chart refs not available');
      return;
    }
    
    if (!data || data.length === 0) {
      console.warn('No data provided to CrowdingIndicatorChart');
      setHasData(false);
      return;
    }
    
    // Destroy previous charts if they exist
    if (priceChartInstance.current) {
      priceChartInstance.current.destroy();
    }
    
    if (indicatorChartInstance.current) {
      indicatorChartInstance.current.destroy();
    }
    
    // Sort data by date (ascending)
    const sortedData = [...data].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Prepare chart data
    const labels = sortedData.map(d => formatDate(d.date));
    
    // Print entire dataset for better debugging
    if (sortedData.length > 0) {
      console.log(`Processing ${sortedData.length} data points`);
      console.log('First data point structure:', JSON.stringify(sortedData[0], null, 2));
      setHasData(true);
    } else {
      console.warn('No data points to process');
      setHasData(false);
      return;
    }
    
    // Try to extract the data according to the database structure
    console.log('First data point to analyze:', sortedData[0]);
    
    // Extract price and indicator values - very tolerant of different formats
    const prices = sortedData.map(d => {
      // Try all the various possible paths to the price data
      if (typeof d.data?.BTC?.price === 'number') return d.data.BTC.price;
      if (typeof d.data?.specific?.price === 'number') return d.data.specific.price;
      if (typeof d.value === 'number' && d.indicator_name === 'price') return d.value;
      console.warn('Could not find price in data point:', d);
      return 0;
    });
    
    // Get crowding values and color information
    const crowdingValues = sortedData.map(d => {
      // Try all the various possible paths to the crowding data
      if (typeof d.data?.BTC?.Crowding?.value === 'number') return d.data.BTC.Crowding.value;
      if (typeof d.data?.specific?.value === 'number') return d.data.specific.value;
      if (typeof d.value === 'number' && d.indicator_name === 'Crowding') return d.value;
      console.warn('Could not find crowding value in data point:', d);
      return 0;
    });
    
    // Get RSI values - only used in the secondary chart
    const rsiValues = sortedData.map(d => {
      if (typeof d.data?.BTC?.RSI?.value === 'number') return d.data.BTC.RSI.value;
      if (typeof d.data?.RSI?.value === 'number') return d.data.RSI.value;
      console.warn('Could not find RSI value in data point:', d);
      return 50; // Default to middle RSI value
    });
    
    // Get Z-Score values - only used in the secondary chart
    const zScoreValues = sortedData.map(d => {
      if (typeof d.data?.BTC?.Crowding?.zScore === 'number') return d.data.BTC.Crowding.zScore;
      if (typeof d.data?.specific?.zScore === 'number') return d.data.specific.zScore;
      console.warn('Could not find Z-Score value in data point:', d);
      return 0;
    });
    
    // Get contexts for both charts
    const priceCtx = priceChartRef.current.getContext('2d');
    const indicatorCtx = indicatorChartRef.current.getContext('2d');
    
    if (!priceCtx || !indicatorCtx) return;
    
    // Create price chart
    priceChartInstance.current = new Chart(priceCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Bitcoin Price',
          data: prices,
          borderColor: '#F7931A', // Bitcoin orange
          backgroundColor: 'rgba(247, 147, 26, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          yAxisID: 'y',
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            type: 'logarithmic',
            position: 'left',
            title: {
              display: true,
              text: 'Price (USD)'
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          }
        }
      }
    });
    
    // Create indicator chart
    indicatorChartInstance.current = new Chart(indicatorCtx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          type: 'bar',
          label: 'Crowding Index',
          data: crowdingValues,
          backgroundColor: crowdingValues.map(value => 
            value >= 0 ? 'rgba(0, 154, 154, 0.7)' : 'rgba(86, 253, 164, 0.7)'
          ),
          borderColor: crowdingValues.map(value => 
            value >= 0 ? 'rgba(0, 154, 154, 1)' : 'rgba(86, 253, 164, 1)'
          ),
          borderWidth: 1,
          yAxisID: 'y'
        }, 
        {
          type: 'line',
          label: 'RSI',
          data: rsiValues,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0)',
          borderWidth: 1.5,
          pointRadius: 0,
          yAxisID: 'rsi',
          hidden: true // Initially hidden
        },
        {
          type: 'line',
          label: 'Z-Score',
          data: zScoreValues,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0)',
          borderWidth: 1.5,
          pointRadius: 0,
          yAxisID: 'zscore',
          hidden: true // Initially hidden
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            callbacks: {
              afterTitle: function() {
                // Add explanation in tooltip
                return '\nPositive: potentially crowded\nNegative: potentially uncrowded';
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            position: 'left',
            title: {
              display: true,
              text: 'Crowding Index'
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          rsi: {
            position: 'right',
            title: {
              display: true,
              text: 'RSI'
            },
            min: 0,
            max: 100,
            grid: {
              drawOnChartArea: false,
            }
          },
          zscore: {
            position: 'right',
            title: {
              display: true,
              text: 'Z-Score'
            },
            grid: {
              drawOnChartArea: false,
            }
          }
        }
      }
    });
    
    // Cleanup on component unmount
    return () => {
      if (priceChartInstance.current) {
        priceChartInstance.current.destroy();
      }
      if (indicatorChartInstance.current) {
        indicatorChartInstance.current.destroy();
      }
    };
  }, [data]);

  return (
    <div>
      {!hasData ? (
        <div className="bg-white p-4 h-64 flex items-center justify-center">
          <p className="text-gray-500">No data available for the crowding indicator</p>
        </div>
      ) : (
        <div>
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2">Bitcoin Price</h3>
            <div className="h-64">
              <canvas ref={priceChartRef}></canvas>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Crowding Index</h3>
            <p className="text-sm text-gray-600 mb-4">
              Based on RSI × Z-score of 90-day ROC. Toggle RSI and Z-score in the legend to see these components.
            </p>
            <div className="h-64">
              <canvas ref={indicatorChartRef}></canvas>
            </div>
          </div>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">How to Read This Indicator</h4>
              <ul className="list-disc pl-5 text-sm">
                <li className="mb-1"><span className="text-teal-700 font-medium">Positive values (teal):</span> Potentially crowded market conditions</li>
                <li className="mb-1"><span className="text-green-600 font-medium">Negative values (green):</span> Potentially uncrowded market conditions</li>
                <li>Extreme readings often precede major market reversals</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Indicator Components</h4>
              <ul className="list-disc pl-5 text-sm">
                <li className="mb-1"><strong>RSI (14):</strong> Measures the speed and magnitude of price movements</li>
                <li className="mb-1"><strong>ROC (90):</strong> 90-day rate of change in price</li>
                <li><strong>Z-Score:</strong> Measures deviation from the mean (how unusual the current ROC is)</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrowdingIndicatorChart;