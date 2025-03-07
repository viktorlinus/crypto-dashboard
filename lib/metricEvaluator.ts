import { evaluate } from 'mathjs';
import { CustomMetric } from '../components/metrics/MetricBuilder';

// Interface for raw data point
interface DataPoint {
  date: string;
  [key: string]: any;
}

// Interface for processed data with metrics
interface ProcessedDataPoint {
  date: string;
  [key: string]: any;
}

/**
 * Calculate custom metrics based on formulas for multiple coins
 * @param data Raw data points (with price, volume, etc.)
 * @param metrics Custom metrics to calculate
 * @param coins List of coins to calculate metrics for
 * @returns Processed data with custom metrics added for each coin
 */
export function calculateCustomMetrics(
  data: DataPoint[],
  metrics: CustomMetric[],
  coins?: string[]
): ProcessedDataPoint[] {
  if (!data || data.length === 0) return [];
  if (!metrics || metrics.length === 0) return data as ProcessedDataPoint[];

  // Clone the data to avoid modifying the original
  const processedData: ProcessedDataPoint[] = JSON.parse(JSON.stringify(data));
  
  // Detect available coins in the data if not provided
  if (!coins || coins.length === 0) {
    const firstPoint = data[0];
    coins = Object.keys(firstPoint).filter(key => 
      key !== 'date' && 
      !key.startsWith('custom_') && 
      key !== 'price' && 
      key !== 'volume' && 
      key !== 'marketCap'
    );
  }

  // Process each data point
  processedData.forEach((dataPoint, index) => {
    // For each coin, calculate the metric
    coins!.forEach(coin => {
      // Get the coin data for this point
      const coinPrice = dataPoint[coin];
      let coinVolume = 0;
      let coinMarketCap = 0;
      
      // Look for corresponding market cap and volume data
      // First check if nested under coin name
      if (dataPoint[`${coin}_volume`]) {
        coinVolume = dataPoint[`${coin}_volume`];
      }
      if (dataPoint[`${coin}_marketCap`]) {
        coinMarketCap = dataPoint[`${coin}_marketCap`];
      }
      
      // Create a scope with variables for formula evaluation
      const scope: { [key: string]: any } = {
        // Add built-in variables for ease of use
        index: index,
        date: new Date(dataPoint.date).getTime(),
        
        // Add standard metrics for this specific coin
        price: coinPrice || 0,
        volume: coinVolume || 0,
        marketCap: coinMarketCap || 0,
        
        // Helper functions
        prev: (steps = 1) => {
          const prevIndex = index - steps;
          if (prevIndex >= 0 && prevIndex < processedData.length) {
            return processedData[prevIndex][coin] || 0;
          }
          return 0;
        },
        
        // Date helpers
        dayOfWeek: new Date(dataPoint.date).getDay(),
        dayOfMonth: new Date(dataPoint.date).getDate(),
        month: new Date(dataPoint.date).getMonth() + 1,
        year: new Date(dataPoint.date).getFullYear(),
      };

      // Process each metric for this coin
      metrics.forEach(metric => {
        try {
          // Evaluate the formula with the current scope
          const result = evaluate(metric.formula, scope);
          
          // Create a key specific to this coin and metric
          const metricKey = `${coin}_${metric.name.replace(/\s+/g, '_')}`;
          dataPoint[metricKey] = result;
          
          // Always create or update the general metric object
          if (!dataPoint[metric.name]) {
            dataPoint[metric.name] = {};
          }
          
          // Store the result indexed by coin for the chart
          dataPoint[metric.name][coin] = result;
        } catch (error) {
          console.error(`Error calculating metric "${metric.name}" for ${coin}:`, error);
          // Set a placeholder value
          const metricKey = `${coin}_${metric.name.replace(/\s+/g, '_')}`;
          dataPoint[metricKey] = null;
        }
      });
    });
  });

  return processedData;
}

/**
 * Format metric data for multi-coin chart display
 * @param processedData Data with metrics calculated
 * @param metricName Name of the metric to extract
 * @param coins List of coins to include
 * @returns Formatted data for chart display
 */
export function formatMetricDataForChart(
  processedData: ProcessedDataPoint[],
  metricName: string,
  coins: string[]
): any[] {
  console.log(`Formatting metric ${metricName} for coins: ${coins}`);
  console.log('Processed Data:', processedData);

  const formattedData = processedData.map(point => {
    const chartPoint: any = {
      date: point.date,
    };
    
    // Ensure all coins are represented, even if they have no data
    coins.forEach(coin => {
      // Try different ways to find the metric value
      let metricValue = null;

      // 1. Check nested metric object first
      if (point[metricName] && typeof point[metricName] === 'object') {
        metricValue = point[metricName][coin];
      }
      
      // 2. If not found, check flattened metric key
      if (metricValue === undefined || metricValue === null) {
        const metricKey = `${coin}_${metricName.replace(/\s+/g, '_')}`;
        metricValue = point[metricKey];
      }
      
      // Always set a value (null if no data found)
      chartPoint[coin] = metricValue;
      
      console.log(`Metric for ${coin}: ${metricValue}`);
    });
    
    return chartPoint;
  });

  console.log('Formatted Chart Data:', formattedData);
  return formattedData;
}

/**
 * Pre-process raw price, market cap and volume data into a format suitable for metric calculations
 * @param priceData Price data from API
 * @param marketCapData Market cap data from API
 * @param volumeData Volume data from API
 * @param coins List of coins to include
 * @returns Processed data ready for metric calculations
 */
export function prepareDataForMetrics(
  priceData: any[],
  marketCapData: any[] = [],
  volumeData: any[] = [],
  coins: string[] = []
): DataPoint[] {
  if (!priceData || priceData.length === 0) return [];

  console.log('Preparing metrics for:', {
    coins,
    priceDataLength: priceData.length,
    marketCapDataLength: marketCapData.length,
    volumeDataLength: volumeData.length
  });

  return priceData.map((pricePoint, index) => {
    const dataPoint: DataPoint = {
      date: pricePoint.date,
    };

    // Add data for each coin with the appropriate structure
    coins.forEach(coin => {
      // Add price data directly (coin name = price)
      if (pricePoint[coin] !== undefined) {
        dataPoint[coin] = pricePoint[coin];
        console.log(`Added price for ${coin}:`, pricePoint[coin]);
      }
      
      // Add market cap data with coin prefix
      if (marketCapData && marketCapData[index] && marketCapData[index][coin] !== undefined) {
        dataPoint[`${coin}_marketCap`] = marketCapData[index][coin];
        console.log(`Added market cap for ${coin}:`, marketCapData[index][coin]);
      } else {
        console.warn(`No market cap found for ${coin} at index ${index}`);
      }
      
      // Add volume data with coin prefix
      if (volumeData && volumeData[index] && volumeData[index][coin] !== undefined) {
        dataPoint[`${coin}_volume`] = volumeData[index][coin];
        console.log(`Added volume for ${coin}:`, volumeData[index][coin]);
      } else {
        console.warn(`No volume found for ${coin} at index ${index}`);
      }
    });

    return dataPoint;
  });
}
