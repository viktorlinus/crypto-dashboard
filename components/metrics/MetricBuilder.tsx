import React, { useState, useEffect } from 'react';
import { evaluate } from 'mathjs';

// Define types for custom metrics
export interface CustomMetric {
  id: string;
  name: string;
  formula: string;
  description?: string;
  createdAt: Date;
}

// Define available metrics and operations
const AVAILABLE_METRICS = [
  { label: 'Price', value: 'price' },
  { label: 'Volume', value: 'volume' },
  { label: 'Market Cap', value: 'marketCap' },
];

const AVAILABLE_OPERATIONS = [
  { label: 'Add (+)', value: '+' },
  { label: 'Subtract (-)', value: '-' },
  { label: 'Multiply (×)', value: '*' },
  { label: 'Divide (÷)', value: '/' },
  { label: 'Square Root', value: 'sqrt' },
  { label: 'Log', value: 'log10' },
  { label: 'Absolute Value', value: 'abs' },
];

interface MetricBuilderProps {
  onSave: (metric: Omit<CustomMetric, 'id' | 'createdAt'>) => void;
  savedMetrics?: CustomMetric[];
  sampleData?: any[];
}

const MetricBuilder: React.FC<MetricBuilderProps> = ({ onSave, savedMetrics = [], sampleData = [] }) => {
  const [name, setName] = useState<string>('');
  const [formula, setFormula] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [selectedOperation, setSelectedOperation] = useState<string>('');

  // Include saved metrics in available metrics
  const allMetrics = [
    ...AVAILABLE_METRICS,
    ...savedMetrics.map(metric => ({
      label: metric.name,
      value: `custom.${metric.id}`,
    })),
  ];

  // Parse and evaluate formula to generate preview data
  useEffect(() => {
    // Don't try to evaluate if formula is too short or missing data
    if (!formula || formula.length < 3 || !sampleData || sampleData.length === 0) {
      setPreviewData(null);
      return;
    }

    try {
      const processedData = sampleData.map(dataPoint => {
        // Create a scope with data variables
        const scope: {
          price: number;
          volume: number;
          marketCap: number;
          [key: string]: number;
        } = {
          price: dataPoint.price || 0,
          volume: dataPoint.volume || 0,
          marketCap: dataPoint.marketCap || 0,
        };

        // Add custom metrics to scope
        savedMetrics.forEach(metric => {
          try {
            scope[`custom_${metric.id}`] = evaluate(metric.formula, scope);
          } catch (e) {
            // If a custom metric fails, just set it to 0
            scope[`custom_${metric.id}`] = 0;
            console.error(`Failed to evaluate metric ${metric.id}:`, e instanceof Error ? e.message : 'Unknown error');
          }
        });

        // Evaluate formula with the current scope
        let result;
        try {
          result = evaluate(formula, scope);
        } catch (e) {
          console.warn(`Failed to evaluate formula: ${formula}`, e instanceof Error ? e.message : 'Unknown error');
          result = null;
        }

        return {
          date: dataPoint.date,
          value: result,
        };
      });

      setPreviewData(processedData);
      setError(null);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setError('Invalid formula: ' + errorMessage);
      setPreviewData(null);
    }
  }, [formula, sampleData, savedMetrics]);

  // Add selected metric to formula
  const addMetricToFormula = () => {
    if (!selectedMetric) return;
    setFormula(currentFormula => {
      if (!currentFormula) return selectedMetric;
      return `${currentFormula} ${selectedMetric}`;
    });
    setSelectedMetric('');
  };

  // Add selected operation to formula
  const addOperationToFormula = () => {
    if (!selectedOperation) return;
    
    const operationText = selectedOperation.includes('(') 
      ? `${selectedOperation}() ` 
      : `${selectedOperation} `;
    
    setFormula(currentFormula => {
      if (!currentFormula) return operationText;
      return `${currentFormula} ${operationText}`;
    });
    setSelectedOperation('');
  };

  // Handle save
  const handleSave = () => {
    if (!name || !formula) {
      setError('Name and formula are required');
      return;
    }

    if (!previewData) {
      setError('Please create a valid formula');
      return;
    }

    onSave({
      name,
      formula,
      description,
    });

    // Reset form
    setName('');
    setFormula('');
    setDescription('');
    setError(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Create Custom Metric</h2>
      
      {/* Metric Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Metric Name
        </label>
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Volume to Market Cap Ratio"
        />
      </div>
      
      {/* Formula Builder */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Formula
        </label>
        <div className="flex items-center mb-2 space-x-2">
          <select
            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
          >
            <option value="">Select Metric</option>
            {allMetrics.map((metric) => (
              <option key={metric.value} value={metric.value}>
                {metric.label}
              </option>
            ))}
          </select>
          <button
            onClick={addMetricToFormula}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            disabled={!selectedMetric}
          >
            Add
          </button>
          
          <select
            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedOperation}
            onChange={(e) => setSelectedOperation(e.target.value)}
          >
            <option value="">Select Operation</option>
            {AVAILABLE_OPERATIONS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
          <button
            onClick={addOperationToFormula}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            disabled={!selectedOperation}
          >
            Add
          </button>
        </div>
        
        <textarea
          className="w-full h-24 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          placeholder="e.g., volume / marketCap"
        />
      </div>
      
      {/* Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (Optional)
        </label>
        <textarea
          className="w-full h-20 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what this metric shows"
        />
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {/* Preview Section */}
      {previewData && previewData.length > 0 && (
        <div className="mb-4">
          <h3 className="text-md font-medium mb-2">Preview</h3>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-500">
            Sample values: {previewData.slice(-3).map(d => d.value !== null && d.value !== undefined && typeof d.value === 'number' ? d.value.toFixed(6) : 'N/A').join(', ')}
            </p>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          disabled={!name || !formula || !previewData}
        >
          Save Custom Metric
        </button>
      </div>
    </div>
  );
};

export default MetricBuilder;