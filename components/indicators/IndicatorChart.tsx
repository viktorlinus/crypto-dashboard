import { useEffect, useRef } from 'react';
import { Chart, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { format, parseISO } from 'date-fns';

// Register Chart.js components
Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

// Define IndicatorData interface
interface IndicatorData {
  id: string;
  date: string;
  indicator_name: string;
  base_coin: string;
  value: number | null;
  data: any;
  metadata: any;
}

interface IndicatorChartProps {
  data: IndicatorData[];
  indicatorName: string;
}

const IndicatorChart: React.FC<IndicatorChartProps> = ({ data, indicatorName }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  // Format the date for display
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM d, yyyy');
    } catch (e) {
      return dateStr;
    }
  };
  
  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;
    
    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    // Sort data by date (ascending)
    const sortedData = [...data].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Prepare chart data
    const labels = sortedData.map(d => formatDate(d.date));
    const values = sortedData.map(d => d.value || 0);
    
    // Create chart
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    
    // Extract metadata for tooltips if available
    const metadata = data[0]?.metadata || {};
    
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: indicatorName,
          data: values,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.2,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            callbacks: {
              afterLabel: function(context) {
                // Add interpretation if available
                if (metadata.interpretation) {
                  return `Interpretation: ${metadata.interpretation}`;
                }
                return '';
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
            beginAtZero: false,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          }
        }
      }
    });
    
    // Cleanup on component unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, indicatorName]);

  // If no data is available, show a message
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4 h-64 flex items-center justify-center">
        <p className="text-gray-500">No data available for this indicator</p>
      </div>
    );
  }

  // Extract metadata for display
  const metadata = data[0]?.metadata || {};
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold">{indicatorName}</h2>
          {metadata.description && (
            <p className="text-gray-600 mt-1">{metadata.description}</p>
          )}
        </div>
        
        {/* Display current value */}
        {data.length > 0 && (
          <div className="bg-gray-100 px-4 py-2 rounded-lg">
            <p className="text-sm text-gray-500">Latest Value</p>
            <p className="text-lg font-bold">
              {(() => {
                const latestValue = data[data.length - 1]?.value;
                return latestValue !== null && typeof latestValue === 'number' 
                  ? latestValue.toFixed(2) 
                  : 'N/A';
              })()}
            </p>
          </div>
        )}
      </div>
      
      {/* Chart container */}
      <div className="h-64 md:h-96">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default IndicatorChart;
