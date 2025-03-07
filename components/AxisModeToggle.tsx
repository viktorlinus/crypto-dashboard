import React from 'react';

interface AxisModeToggleProps {
  useSingleAxis: boolean;
  onToggle: () => void;
}

const AxisModeToggle: React.FC<AxisModeToggleProps> = ({ useSingleAxis, onToggle }) => {
  return (
    <div className="flex items-center">
      <span className="text-sm text-gray-600 mr-2">Y-Axis:</span>
      <button
        onClick={onToggle}
        className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        style={{
          backgroundColor: useSingleAxis ? '#8b5cf6' : '#e5e7eb',
        }}
      >
        <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
            useSingleAxis ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
        <span className="sr-only">{useSingleAxis ? 'Use Multiple Axes' : 'Use Single Axis'}</span>
      </button>
      <span className="text-sm text-gray-600 ml-2">{useSingleAxis ? 'Shared' : 'Individual'}</span>
      <div className="ml-2 group relative">
        <span className="cursor-help text-sm text-gray-500">
          <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-52 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity">
          Shared Y-axis is better for direct comparison, while individual axes help visualize trends when values have different ranges.
        </div>
      </div>
    </div>
  );
};

export default AxisModeToggle;
