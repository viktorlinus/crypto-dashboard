import React from 'react';

interface ScaleToggleProps {
  isLogarithmic: boolean;
  onToggle: () => void;
}

const ScaleToggle: React.FC<ScaleToggleProps> = ({ isLogarithmic, onToggle }) => {
  return (
    <div className="flex items-center">
      <span className="text-sm text-gray-600 mr-2">Scale:</span>
      <button
        onClick={onToggle}
        className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        style={{
          backgroundColor: isLogarithmic ? '#8b5cf6' : '#e5e7eb',
        }}
      >
        <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
            isLogarithmic ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
        <span className="sr-only">{isLogarithmic ? 'Linear Scale' : 'Logarithmic Scale'}</span>
      </button>
      <span className="text-sm text-gray-600 ml-2">{isLogarithmic ? 'Log' : 'Linear'}</span>
      <div className="ml-2 group relative">
        <span className="cursor-help text-sm text-gray-500">
          <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-52 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity">
          Logarithmic scale helps compare coins with vastly different values by showing relative percentage changes.
        </div>
      </div>
    </div>
  );
};

export default ScaleToggle;
