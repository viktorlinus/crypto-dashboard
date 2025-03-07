import React from 'react';

interface ScaleModeToggleProps {
  isSharedScale: boolean;
  onToggle: () => void;
}

const ScaleModeToggle: React.FC<ScaleModeToggleProps> = ({ isSharedScale, onToggle }) => {
  return (
    <div className="inline-flex items-center">
      <span className="text-sm text-gray-600 mr-2">Scale Mode:</span>
      <button
        onClick={onToggle}
        className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
        title={isSharedScale ? "Currently using a shared Y-axis for all coins" : "Currently using independent Y-axes for each coin"}
      >
        <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none bg-gray-200">
          <span className={`inline-block h-5 w-5 transform rounded-full transition-transform ${
            isSharedScale ? 'translate-x-5 bg-blue-600' : 'translate-x-1 bg-gray-500'
          }`} />
        </div>
        <span className="ml-2">
          {isSharedScale ? 'Shared Scale' : 'Independent Scales'}
        </span>
      </button>
    </div>
  );
};

export default ScaleModeToggle;