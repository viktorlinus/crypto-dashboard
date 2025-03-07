import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import AxisModeToggle from './AxisModeToggle';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Define chart colors for different cryptocurrencies
const COIN_COLORS: Record<string, string> = {
  BTC: 'rgba(247, 147, 26, 1)', // Bitcoin orange
  ETH: 'rgba(98, 126, 234, 1)',  // Ethereum blue
  SOL: 'rgba(20, 241, 149, 1)',  // Solana green
  BNB: 'rgba(243, 186, 47, 1)',  // Binance yellow
  ADA: 'rgba(0, 51, 173, 1)',    // Cardano blue
  XRP: 'rgba(35, 41, 47, 1)',    // Ripple gray
  DOT: 'rgba(230, 0, 122, 1)',   // Polkadot pink
  AVAX: 'rgba(232, 65, 66, 1)',  // Avalanche red
  DOGE: 'rgba(194, 162, 72, 1)', // Dogecoin gold
  SHIB: 'rgba(255, 152, 0, 1)',  // Shiba Inu orange
};

// Default fallback colors for coins not in the predefined list
const DEFAULT_COLORS = [
  'rgba(75, 192, 192, 1)',
  'rgba(153, 102, 255, 1)',
  'rgba(255, 99, 132, 1)',
  'rgba(54, 162, 235, 1)',
  'rgba(255, 159, 64, 1)',
  'rgba(255, 205, 86, 1)',
  'rgba(201, 203, 207, 1)',
];

interface PriceChartProps {
  data: any[];
  coins: string[];
  title: string;
  yAxisLabel: string;
  timeRange: string;
  isLogarithmic: boolean;
  useSingleAxis?: boolean;
}

const PriceChart: React.FC<PriceChartProps> = ({
  data,
  coins,
  title,
  yAxisLabel,
  timeRange,
  isLogarithmic,
  useSingleAxis: initialUseSingleAxis = false,
}) => {
  const [useSingleAxis, setUseSingleAxis] = useState(initialUseSingleAxis);

  if (!data || data.length === 0) {
    return <div className="p-4 text-center">No data available</div>;
  }

  // Format dates based on the time range
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (timeRange === '7d' || timeRange === '1m') {
      return format(date, 'MMM d');
    } else if (timeRange === '3m' || timeRange === '6m') {
      return format(date, 'MMM yyyy');
    } else {
      return format(date, 'MMM yyyy');
    }
  };

  const labels = data.map((d) => formatDate(d.date));

  // Compute ranges for scaling
  const ranges: { [key: string]: { min: number; max: number; firstValue: number } } = {};
  
  coins.forEach(coin => {
    let min = Number.MAX_VALUE;
    let max = 0;
    let firstValue = 0;
    
    data.forEach(day => {
      if (day[coin] && day[coin] > 0) {
        min = Math.min(min, day[coin]);
        max = Math.max(max, day[coin]);
        
        // Track the first valid value for normalization
        if (firstValue === 0) {
          firstValue = day[coin];
        }
      }
    });
    
    // Handle extreme cases
    if (min === Number.MAX_VALUE) min = 0;
    if (max === 0) max = 1;
    
    ranges[coin] = { min, max, firstValue };
  });

  // Generate datasets
  const datasets = coins.map((coin, index) => {
    const coinColor = COIN_COLORS[coin] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
    const axisID = useSingleAxis ? 'y' : `y-axis-${coin}`;
    
    return {
      label: coin,
      data: data.map((d) => d[coin] || null),
      borderColor: coinColor,
      backgroundColor: coinColor.replace('1)', '0.1)'),
      borderWidth: 2,
      pointRadius: data.length > 60 ? 0 : 3,
      pointHoverRadius: 6,
      pointBackgroundColor: coinColor,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      tension: 0.2,
      fill: false,
      yAxisID: axisID,
    };
  });

  const chartData = {
    labels,
    datasets,
  };

  // Price formatting utility
  const formatPrice = (value: number) => {
    if (value >= 1000000000) {
      return '$' + (value / 1000000000).toFixed(1) + 'B';
    } else if (value >= 1000000) {
      return '$' + (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return '$' + (value / 1000).toFixed(1) + 'K';
    } else if (value < 1) {
      return '$' + value.toFixed(value < 0.0001 ? 6 : 4);
    } else {
      return '$' + value.toFixed(2);
    }
  };

  // Logarithmic value formatter
  const formatLogValue = (value: number) => {
    if (value < 0.01) return '$' + value.toExponential(0);
    if (value < 1) return '$' + value.toFixed(3);
    if (value < 10) return '$' + value.toFixed(2);
    if (value < 100) return '$' + value.toFixed(1);
    if (value < 1000) return '$' + value.toFixed(0);
    if (value >= 1000000000) return '$' + (value / 1000000000).toFixed(1) + 'B';
    if (value >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return '$' + (value / 1000).toFixed(1) + 'K';
    return '$' + value.toFixed(0);
  };

  // Scales configuration
  const scales: any = {
    x: {
      grid: {
        display: false,
        drawBorder: false,
      },
      ticks: {
        maxTicksLimit: 10,
        padding: 10,
        font: {
          size: 11,
        },
        color: '#64748b',
      },
    },
  };

  // Single axis configuration
  if (useSingleAxis) {
    let globalMin = Number.MAX_VALUE;
    let globalMax = 0;
    
    // Find min/max across all coins
    coins.forEach(coin => {
      data.forEach(day => {
        if (day[coin] && day[coin] > 0) {
          globalMin = Math.min(globalMin, day[coin]);
          globalMax = Math.max(globalMax, day[coin]);
        }
      });
    });
    
    // Add padding to the range
    const padding = 0.1;
    let min = globalMin * (1 - padding);
    let max = globalMax * (1 + padding);
    
    // For logarithmic scale, ensure min is positive
    if (isLogarithmic && min <= 0) {
      min = globalMin * 0.9;
      if (min <= 0) min = 0.000001;
    }
    
    // Single Y axis
    scales['y'] = {
      type: isLogarithmic ? 'logarithmic' : 'linear',
      position: 'right',
      display: true,
      grid: {
        drawOnChartArea: true,
        color: 'rgba(0, 0, 0, 0.05)',
        drawBorder: false,
      },
      title: {
        display: true,
        text: yAxisLabel,
        font: {
          size: 12,
          weight: '600',
        },
      },
      min: isLogarithmic ? min : undefined,
      max: isLogarithmic ? undefined : max,
      ticks: {
        color: '#64748b',
        font: {
          size: 11,
        },
        padding: 8,
        callback: function(value: number) {
          return isLogarithmic ? formatLogValue(value) : formatPrice(value);
        }
      }
    };
  } else {
    // Multiple Y-axes configuration
    coins.forEach((coin, index) => {
      const isFirst = index === 0;
      const coinColor = COIN_COLORS[coin] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
      const range = ranges[coin];
      const axisID = `y-axis-${coin}`;
      
      // Add padding to the range
      const padding = 0.1;
      let min = range.min * (1 - padding);
      let max = range.max * (1 + padding);
      
      // For logarithmic scale, ensure min is positive
      if (isLogarithmic && min <= 0) {
        min = range.min * 0.9;
        if (min <= 0) min = 0.000001;
      }
      
      scales[axisID] = {
        type: isLogarithmic ? 'logarithmic' : 'linear',
        position: index % 2 === 0 ? 'left' : 'right',
        display: true,
        grid: {
          drawOnChartArea: isFirst,
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        title: {
          display: true,
          text: coin,
          color: coinColor,
          font: {
            size: 12,
            weight: '600',
          },
        },
        min: isLogarithmic ? min : undefined,
        max: isLogarithmic ? undefined : max,
        ticks: {
          display: true,
          color: coinColor,
          font: {
            size: 11,
          },
          padding: 8,
          callback: function(value: number) {
            return isLogarithmic ? formatLogValue(value) : formatPrice(value);
          }
        }
      };
    });
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 12,
            weight: '600' as const,
          }
        }
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: '600' as const,
        },
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#333',
        bodyColor: '#333',
        bodyFont: {
          size: 13,
        },
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        boxPadding: 4,
        usePointStyle: true,
      },
    },
    scales: scales,
    elements: {
      line: {
        borderWidth: 2,
      },
      point: {
        hoverRadius: 6,
        hoverBorderWidth: 2,
      }
    }
  };

  return (
    <div className="relative w-full h-full">
      {coins.length > 1 && (
        <div className="absolute top-0 right-0 z-10 p-2">
          <AxisModeToggle 
            useSingleAxis={useSingleAxis}
            onToggle={() => setUseSingleAxis(!useSingleAxis)}
          />
        </div>
      )}
      <Line data={chartData} options={options} />
    </div>
  );
};

export default PriceChart;
