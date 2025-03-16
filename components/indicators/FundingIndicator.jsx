'use client'; // ✅ Ensure this is at the top

import { useState, useEffect } from 'react';
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import PasswordProtection from "../PasswordProtection";

// ✅ Dynamically import Plotly to prevent server-side rendering issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export function FundingIndicator() {
  // Get password from environment variable
  const correctPassword = process.env.NEXT_PUBLIC_FUNDING_PASSWORD || 'alpha1';
  
  // Create a wrapper component that will only be rendered after password verification
  const ProtectedContent = () => {
    const [latestData, setLatestData] = useState(null);
    const [plotData, setPlotData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // This useEffect will only run after the password is verified
    // because the component is only mounted at that point
    useEffect(() => {
      async function fetchLatestData() {
        try {
          setLoading(true);
          
          // ✅ Fetch the latest funding indicator data from Supabase
          const { data, error } = await supabase
            .from("indicators")
            .select("*")
            .eq("indicator_name", "funding_rate")
            .order("date", { ascending: false }) // Get latest
            .limit(1)
            .single();

          if (error) throw error;

          setLatestData(data.latest_data);
          setPlotData(data.plotly_json); // ✅ Set Plotly chart data
          setError(null);
        } catch (err) {
          console.error("Error fetching data:", err);
          setError("Failed to load indicator data");
        } finally {
          setLoading(false);
        }
      }

      fetchLatestData();
    }, []);

    const getSignalInfo = (data) => {
      if (!data) return { text: 'No Signal', color: 'bg-gray-200 text-gray-700' };
      if (data.bull_buy_signal) return { text: 'Bull Buy', color: 'bg-green-200 text-green-800' };
      if (data.bear_buy_signal) return { text: 'Bear Buy', color: 'bg-yellow-200 text-yellow-800' };
      if (data.sell_signal) return { text: 'Sell', color: 'bg-red-200 text-red-800' };
      if (data.weak_sell_signal) return { text: 'Weak Sell', color: 'bg-orange-200 text-orange-800' };
      return { text: 'No Signal', color: 'bg-gray-200 text-gray-700' };
    };

    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Bitcoin Funding Rate Indicator</h2>
          <div className="flex items-center">

          </div>
        </div>
        
        <div className="p-4">
          {loading ? (
            <div className="flex h-[400px] items-center justify-center">
              <p className="text-gray-500">Loading indicator...</p>
            </div>
          ) : error ? (
            <div className="flex h-[400px] items-center justify-center">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <>
              {/* ✅ Render Plotly Chart */}
              {plotData && (
                <div className="w-full max-w-[1400px] mx-auto">
                  <Plot 
                    data={plotData.data} 
                    layout={{ 
                      ...plotData.layout, 
                      autosize: true // ✅ Allows Plotly to automatically size the chart
                    }} 
                    useResizeHandler={true} // ✅ Ensures it resizes properly
                    className="w-full h-[600px]" // ✅ Forces it to take full width
                  />
                </div>
              )}

              {latestData && (
                <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                  <SignalCard title="Price" value={`$${latestData.close.toLocaleString()}`} />
                  <SignalCard 
                    title="Funding Rate" 
                    value={`${(latestData.funding_rate * 100).toFixed(3)}%`}
                    type={latestData.funding_rate > 0 ? 'positive' : 'negative'}
                  />
                  <SignalCard 
                    title="RSI" 
                    value={latestData.rsi.toFixed(1)}
                    type={latestData.rsi > 70 ? 'negative' : latestData.rsi < 30 ? 'positive' : 'neutral'}
                  />
                  <SignalCard 
                    title="Signal" 
                    value={getSignalInfo(latestData).text}
                    customColor={getSignalInfo(latestData).color}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <PasswordProtection correctPassword={correctPassword}>
      <ProtectedContent />
    </PasswordProtection>
  );
}

function SignalCard({ title, value, type = 'neutral', customColor }) {
  const typeStyles = {
    positive: "bg-green-200 text-green-800",
    negative: "bg-red-200 text-red-800",
    warning: "bg-orange-200 text-orange-800",
    neutral: "bg-gray-200 text-gray-700"
  };
  
  const colorClass = customColor || typeStyles[type];

  return (
    <div className="rounded-lg p-3 border">
      <h4 className="text-sm font-medium text-gray-500">{title}</h4>
      <p className={`mt-1 rounded-md px-2 py-1 text-lg font-bold ${colorClass}`}>
        {value}
      </p>
    </div>
  );
}
