import React from 'react';

interface SingleAxisToggleProps {
  useSingleAxis: boolean;
  onToggle: () => void;
}

const SingleAxisToggle: React.FC<SingleAxisToggleProps> = ({ 
  useSingleAxis, 
  onToggle 
}) => {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-700 font-medium">
        {useSingleAxis ? 'Single Y-Axis' : 'Multiple Y-Axes'}
      </span>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
          useSingleAxis ? 'bg-blue-600' : 'bg-gray-300'
        }`}
        role="switch"
        aria-checked={useSingleAxis}
      >
        <span className="sr-only">Use single axis</span>
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            useSingleAxis ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

export default SingleAxisToggle;