import React from 'react';

interface DataTypeSelectorProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
}

const DataTypeSelector: React.FC<DataTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
}) => {
  const dataTypes = [
    { label: 'Price', value: 'prices', icon: '$' },
    { label: 'Market Cap', value: 'market-caps', icon: '◎' },
    { label: 'Volume', value: 'volumes', icon: '⟳' },
  ];

  return (
    <div className="flex space-x-2">
      {dataTypes.map((type) => (
        <button
          key={type.value}
          className={`px-4 py-3 rounded-lg flex items-center justify-center focus:outline-none transition-all ${
            selectedType === type.value
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
          }`}
          onClick={() => onTypeChange(type.value)}
        >
          <span className="mr-2 text-lg font-medium">{type.icon}</span>
          <span>{type.label}</span>
        </button>
      ))}
    </div>
  );
};

export default DataTypeSelector;