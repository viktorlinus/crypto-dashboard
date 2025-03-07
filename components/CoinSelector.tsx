import React, { useState, useEffect } from 'react';

interface CoinSelectorProps {
  availableCoins: string[];
  selectedCoins: string[];
  onChange: (coins: string[]) => void;
  onScopeChange?: (scope: string) => void;
  maxCoins?: number;
  currentScope?: string;
}

const CoinSelector: React.FC<CoinSelectorProps> = ({
  availableCoins,
  selectedCoins,
  onChange,
  onScopeChange,
  maxCoins = 5,
  currentScope = 'current',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredCoins = availableCoins.filter(
    (coin) => coin.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCoinToggle = (coin: string) => {
    if (selectedCoins.includes(coin)) {
      onChange(selectedCoins.filter((c) => c !== coin));
    } else {
      if (selectedCoins.length < maxCoins) {
        onChange([...selectedCoins, coin]);
      } else {
        alert(`You can select a maximum of ${maxCoins} coins`);
      }
    }
  };

  const handleScopeChange = (scope: string) => {
    if (onScopeChange) {
      onScopeChange(scope);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.coin-selector')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="coin-selector relative">
      {/* Scope Toggle */}
      {onScopeChange && (
        <div className="flex space-x-2 mb-4">
          <button
            className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
              currentScope === 'current'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => handleScopeChange('current')}
          >
            Current Top 100
          </button>
          <button
            className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
              currentScope === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => handleScopeChange('all')}
          >
            All Tracked Coins
          </button>
        </div>
      )}

      {/* Selected Coins */}
      <div className="flex flex-wrap gap-2 mb-4">
        {selectedCoins.map((coin) => (
          <div
            key={coin}
            className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center shadow-sm"
          >
            {coin}
            <button
              onClick={() => handleCoinToggle(coin)}
              className="ml-2 p-0.5 text-blue-400 hover:text-blue-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search for cryptocurrencies..."
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowDropdown(true)}
        />
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-lg max-h-64 overflow-auto border border-gray-100">
          <div className="sticky top-0 bg-gray-50 p-2 border-b border-gray-100 text-xs text-gray-500 font-medium">
            {filteredCoins.length} coins available
          </div>
          {filteredCoins.length > 0 ? (
            filteredCoins.map((coin) => (
              <div
                key={coin}
                className={`p-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-0 transition-colors ${
                  selectedCoins.includes(coin) ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleCoinToggle(coin)}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 flex items-center justify-center rounded mr-3 ${
                    selectedCoins.includes(coin) ? 'bg-blue-500 text-white' : 'border border-gray-300'
                  }`}>
                    {selectedCoins.includes(coin) && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="font-medium">{coin}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-gray-500 text-center">No coins found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CoinSelector;