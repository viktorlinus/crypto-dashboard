import React from 'react';

interface TimeRangeSelectorProps {
  selectedRange: string;
  onRangeChange: (range: string) => void;
  ranges: string[];
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  selectedRange,
  onRangeChange,
  ranges
}) => {
  return (
    <div className="inline-flex bg-gray-100 rounded-lg p-1">
      {ranges.map(range => (
        <button
          key={range}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            selectedRange === range
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => onRangeChange(range)}
        >
          {range}
        </button>
      ))}
    </div>
  );
};

export default TimeRangeSelector;
