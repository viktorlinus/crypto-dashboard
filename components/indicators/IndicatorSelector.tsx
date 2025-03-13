import { useState } from 'react';

interface IndicatorSelectorProps {
  indicators: string[];
  selectedIndicator: string | null;
  onSelectIndicator: (indicator: string) => void;
}

const IndicatorSelector: React.FC<IndicatorSelectorProps> = ({
  indicators,
  selectedIndicator,
  onSelectIndicator
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter indicators based on search term
  const filteredIndicators = indicators.filter(indicator => 
    indicator.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4">Available Indicators</h2>
      
      {/* Search input */}
      <div className="mb-4">
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="Search indicators..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* Indicators list */}
      <div className="max-h-96 overflow-y-auto">
        {filteredIndicators.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No indicators found</p>
        ) : (
          <ul className="space-y-2">
            {filteredIndicators.map(indicator => (
              <li key={indicator}>
                <button
                  className={`w-full text-left px-3 py-2 rounded transition duration-150 ${
                    selectedIndicator === indicator 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => onSelectIndicator(indicator)}
                >
                  {indicator}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default IndicatorSelector;
