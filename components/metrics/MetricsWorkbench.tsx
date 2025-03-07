import React, { useState, useEffect } from 'react';
import MetricBuilder, { CustomMetric } from './MetricBuilder';
import { v4 as uuidv4 } from 'uuid';

interface MetricsWorkbenchProps {
  sampleData?: any[];
  onMetricSelect: (metric: CustomMetric | null) => void;
}

// Function to save metrics to localStorage
const saveMetricsToStorage = (metrics: CustomMetric[]) => {
  localStorage.setItem('customMetrics', JSON.stringify(metrics));
};

// Function to load metrics from localStorage
const loadMetricsFromStorage = (): CustomMetric[] => {
  const storedMetrics = localStorage.getItem('customMetrics');
  if (!storedMetrics) return [];
  
  try {
    const parsed = JSON.parse(storedMetrics);
    
    // Validate the loaded metrics to ensure they have all required fields
    return parsed.filter((metric: any) => {
      const isValid = 
        metric && 
        typeof metric === 'object' &&
        typeof metric.id === 'string' && 
        typeof metric.name === 'string' && 
        typeof metric.formula === 'string';
      
      if (!isValid) {
        console.error('Invalid metric found in storage:', metric);
      }
      
      return isValid;
    });
  } catch (e) {
    console.error('Failed to parse stored metrics:', e instanceof Error ? e.message : 'Unknown error');
    // Clear corrupted storage
    localStorage.removeItem('customMetrics');
    return [];
  }
};

const MetricsWorkbench: React.FC<MetricsWorkbenchProps> = ({ sampleData = [], onMetricSelect }) => {
  const [metrics, setMetrics] = useState<CustomMetric[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [selectedMetricId, setSelectedMetricId] = useState<string | null>(null);

  // Load saved metrics on initial render
  useEffect(() => {
    setMetrics(loadMetricsFromStorage());
  }, []);

  // Save a new custom metric
  const handleSaveMetric = (metricData: Omit<CustomMetric, 'id' | 'createdAt'>) => {
    const newMetric: CustomMetric = {
      ...metricData,
      id: uuidv4(),
      createdAt: new Date(),
    };
    
    const updatedMetrics = [...metrics, newMetric];
    setMetrics(updatedMetrics);
    saveMetricsToStorage(updatedMetrics);
    setIsCreatingNew(false);
    
    // Select the newly created metric
    setSelectedMetricId(newMetric.id);
    onMetricSelect(newMetric);
  };

  // Delete a custom metric
  const handleDeleteMetric = (id: string) => {
    const updatedMetrics = metrics.filter(metric => metric.id !== id);
    setMetrics(updatedMetrics);
    saveMetricsToStorage(updatedMetrics);
    
    // Deselect if the deleted metric was selected
    if (selectedMetricId === id) {
      setSelectedMetricId(null);
      onMetricSelect(null);
    }
  };

  // Handle metric selection
  const handleSelectMetric = (metric: CustomMetric) => {
    const isAlreadySelected = selectedMetricId === metric.id;
    
    if (isAlreadySelected) {
      // Deselect if already selected
      setSelectedMetricId(null);
      onMetricSelect(null);
    } else {
      // Select the metric
      setSelectedMetricId(metric.id);
      onMetricSelect(metric);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">
            Metrics Workbench
          </h2>
          {!isCreatingNew && (
            <button
              onClick={() => setIsCreatingNew(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create New Metric
            </button>
          )}
        </div>
      </div>

      {isCreatingNew ? (
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-medium">Create New Metric</h3>
            <button
              onClick={() => setIsCreatingNew(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
          <MetricBuilder 
            onSave={handleSaveMetric} 
            savedMetrics={metrics}
            sampleData={sampleData}
          />
        </div>
      ) : (
        <div className="p-6">
          {metrics.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 mb-4">
                No custom metrics created yet.
              </p>
              <button
                onClick={() => setIsCreatingNew(true)}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              >
                Create your first metric
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-md font-medium">Saved Metrics</h3>
              <div className="grid gap-4">
                {metrics.map(metric => (
                  <div
                    key={metric.id}
                    className={`border rounded-lg p-4 transition-colors cursor-pointer ${
                      selectedMetricId === metric.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => handleSelectMetric(metric)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{metric.name}</h4>
                        <p className="text-sm text-gray-500 mt-1 font-mono">
                          {metric.formula}
                        </p>
                        {metric.description && (
                          <p className="text-sm text-gray-600 mt-2">
                            {metric.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMetric(metric.id);
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="Delete metric"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MetricsWorkbench;