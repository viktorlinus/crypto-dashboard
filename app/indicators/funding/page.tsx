'use client';

import { FundingIndicator } from '../../../components/indicators/FundingIndicator';

export default function FundingIndicatorPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Bitcoin Funding Rate Indicator</h1>
      
      <div className="mb-6">
        <p className="text-gray-700">
          This indicator uses funding rates along with technical analysis to generate buy and sell signals for Bitcoin.
          The system combines EMA crosses, RSI, price action, and funding rate analysis to identify optimal entry and exit points.
        </p>
      </div>
      
      <div className="mb-8">
        <FundingIndicator />
      </div>
      
      <div className="prose max-w-none">
        <h2 className="text-xl font-bold mb-4">How It Works</h2>
        
        <h3 className="text-lg font-semibold mb-2">Buy Signals</h3>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2"><strong>Bull Buy Signal:</strong> Generated when price drops below adaptive EMA, RSI is below threshold, funding rate is negative, and the EMA cross is bullish.</li>
          <li className="mb-2"><strong>Bear Buy Signal:</strong> Similar to Bull Buy, but occurs when the longer-term trend is bearish (EMA cross is bearish).</li>
        </ul>
        
        <h3 className="text-lg font-semibold mb-2">Sell Signals</h3>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2"><strong>Strong Sell Signal:</strong> Generated when price crosses below adaptive sell EMA, RSI is above threshold, and funding rate is high.</li>
          <li className="mb-2"><strong>Weak Sell Signal:</strong> A less significant sell signal using shorter EMAs and different thresholds.</li>
        </ul>
        
        <h3 className="text-lg font-semibold mb-2">Key Indicators</h3>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2"><strong>Funding Rate:</strong> The rate at which long/short traders pay each other in perpetual futures markets. Negative rates often indicate bearish sentiment.</li>
          <li className="mb-2"><strong>RSI (Relative Strength Index):</strong> Measures the speed and magnitude of price movements. Used to identify overbought/oversold conditions.</li>
          <li className="mb-2"><strong>EMA Crosses:</strong> Used to determine overall market trend direction.</li>
          <li className="mb-2"><strong>Rate of Change (RoC):</strong> Measures the percentage change in price over a specified period, with standard deviation bands.</li>
        </ul>
        
        <h2 className="text-xl font-bold mb-4 mt-6">Interpretation</h2>
        <p className="mb-4">
          This indicator is most effective when used as part of a broader trading strategy that includes:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">Consideration of overall market conditions</li>
          <li className="mb-2">Risk management practices</li>
          <li className="mb-2">Multiple timeframe analysis</li>
        </ul>
        
        <p className="mb-4">
          The signals are not meant to be used in isolation but rather as confirmation of other analysis. 
          Bull Buy signals in particular have historically shown strong results when funding rates are negative 
          while prices are near significant support levels.
        </p>
      </div>
    </div>
  );
}