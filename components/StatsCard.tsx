import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string | number;
  isPositive?: boolean;
  isNegative?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  isPositive,
  isNegative,
}) => {
  return (
    <div className="p-6 transition-all">
      <div className="flex items-center mb-1">
        <div className="text-sm font-medium text-gray-500">{title}</div>
        {title === 'BTC' && <div className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0.5 rounded-md font-medium">Bitcoin</div>}
        {title === 'ETH' && <div className="ml-2 bg-indigo-100 text-indigo-800 text-xs px-1.5 py-0.5 rounded-md font-medium">Ethereum</div>}
        {title === 'SOL' && <div className="ml-2 bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded-md font-medium">Solana</div>}
        {title === 'BNB' && <div className="ml-2 bg-amber-100 text-amber-800 text-xs px-1.5 py-0.5 rounded-md font-medium">Binance</div>}
      </div>
      <div className="text-2xl font-bold mt-2">{value}</div>
      {change && (
        <div
          className={`mt-2 flex items-center text-sm font-medium ${
            isPositive
              ? 'text-green-600'
              : isNegative
              ? 'text-red-600'
              : 'text-gray-500'
          }`}
        >
          {isPositive ? (
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : isNegative ? (
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          ) : null}
          {change}
        </div>
      )}
    </div>
  );
};

export default StatsCard;