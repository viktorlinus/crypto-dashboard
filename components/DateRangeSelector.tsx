import React from 'react';
import { subDays, subMonths, subYears, format } from 'date-fns';

interface DateRangeSelectorProps {
  selectedRange: string;
  onRangeChange: (range: string) => void;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  selectedRange,
  onRangeChange,
}) => {
  const ranges = [
    { label: '7D', value: '7d' },
    { label: '1M', value: '1m' },
    { label: '3M', value: '3m' },
    { label: '6M', value: '6m' },
    { label: '1Y', value: '1y' },
    { label: 'All', value: 'all' },
  ];

  return (
    <div className="inline-flex rounded-lg p-1 bg-gray-100 shadow-inner">
      {ranges.map((range) => (
        <button
          key={range.value}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all focus:outline-none ${
            selectedRange === range.value
              ? 'bg-white shadow-sm text-blue-600'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => onRangeChange(range.value)}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
};

// Helper function to get date range based on selection
export function getDateRangeFromSelection(range: string): { startDate: string; endDate: string } {
  const endDate = new Date();
  let startDate: Date;

  switch (range) {
    case '7d':
      startDate = subDays(endDate, 7);
      break;
    case '1m':
      startDate = subMonths(endDate, 1);
      break;
    case '3m':
      startDate = subMonths(endDate, 3);
      break;
    case '6m':
      startDate = subMonths(endDate, 6);
      break;
    case '1y':
      startDate = subYears(endDate, 1);
      break;
    case 'all':
    default:
      startDate = new Date('2022-12-31'); // The earliest date in our dataset
      break;
  }

  return {
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
  };
}

export default DateRangeSelector;