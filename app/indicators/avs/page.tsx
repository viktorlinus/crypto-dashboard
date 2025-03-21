'use client';

import { AVSIndicator } from '../../../components/indicators/AVSIndicator';

export default function AVSIndicatorPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Bitcoin Value Range System (AVS)</h1>
      
      <div className="mb-6">
        <p className="text-gray-700">
          The Bitcoin Value Range System (AVS) is a proprietary indicator that identifies optimal buy and sell zones for Bitcoin.
          It uses a specialized averaging system to determine market value ranges and provides clear signals for entry and exit points.
        </p>
      </div>
      
      <div className="mb-8">
        <AVSIndicator />
      </div>
      
      <div className="prose max-w-none">
        <h2 className="text-xl font-bold mb-4">How It Works</h2>
        
        <h3 className="text-lg font-semibold mb-2">Buy Zones</h3>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2"><strong>Strong Buy Zone:</strong> When AVS average falls below 0.04, indicating extreme undervaluation.</li>
          <li className="mb-2"><strong>Buy Zone:</strong> When AVS average is between 0.04 and 0.10, suggesting good value.</li>
        </ul>
        
        <h3 className="text-lg font-semibold mb-2">Sell Zones</h3>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2"><strong>Strong Sell Zone:</strong> When AVS average rises above 0.95, indicating extreme overvaluation.</li>
          <li className="mb-2"><strong>Sell Zone:</strong> When AVS average is between 0.85 and 0.95, suggesting suitable exit areas.</li>
        </ul>
        
        <h3 className="text-lg font-semibold mb-2">Key Components</h3>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2"><strong>AVS Average:</strong> A specialized value metric ranging from 0 to 1 that evaluates Bitcoin's current price relative to historical patterns.</li>
          <li className="mb-2"><strong>Colored Zones:</strong> Visual representation of market conditions, with green zones indicating buying opportunities and red zones indicating selling opportunities.</li>
        </ul>
        
        <h2 className="text-xl font-bold mb-4 mt-6">Interpretation</h2>
        <p className="mb-4">
          This indicator works best when used alongside other analysis techniques:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li className="mb-2">Value investing strategies</li>
          <li className="mb-2">Long-term position management</li>
          <li className="mb-2">Dollar-cost averaging in buy zones</li>
        </ul>
        
        <p className="mb-4">
          The AVS system is particularly effective for identifying major market tops and bottoms, helping investors avoid buying at peaks and selling at lows.
          Historically, buying when the AVS average is below 0.10 has yielded strong long-term returns.
        </p>
      </div>
    </div>
  );
}