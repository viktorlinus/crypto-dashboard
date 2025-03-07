import React from 'react';

interface SharedScaleToggleProps {
  isSharedScale: boolean;
  onToggle: () => void;
}

const SharedScaleToggle: React.FC<SharedScaleToggleProps> = ({ isSharedScale, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors text-sm flex items-center"
      title={isSharedScale ? "Switch to individual scales" : "Switch to shared scale"}
    >
      <span>
        {isSharedScale ? 'Shared Scale' : 'Individual Scales'}
      </span>
      <svg 
        className="w-4 h-4 ml-1.5"
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {isSharedScale ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
        )}
      </svg>
    </button>
  );
};

export default SharedScaleToggle;