'use client';

import React, { useEffect, useState, useRef } from 'react';

// This version loads the Plotly script directly and renders in a div
export default function DirectPlotlyChart({ indicatorName, period }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const plotContainerRef = useRef(null);
  const refreshCount = useRef(0);

  useEffect(() => {
    // Load Plotly script
    const scriptId = 'plotly-js-cdn';
    let plotlyScript = document.getElementById(scriptId);
    
    const initializePlotly = () => {
      if (!window.Plotly) {
        setError('Failed to load Plotly library');
        setIsLoading(false);
        return;
      }
      
      fetchAndRenderPlot();
    };

    if (!plotlyScript) {
      plotlyScript = document.createElement('script');
      plotlyScript.id = scriptId;
      plotlyScript.src = 'https://cdn.plot.ly/plotly-latest.min.js';
      plotlyScript.async = true;
      plotlyScript.onload = initializePlotly;
      plotlyScript.onerror = () => {
        setError('Failed to load Plotly library');
        setIsLoading(false);
      };
      document.head.appendChild(plotlyScript);
    } else if (window.Plotly) {
      fetchAndRenderPlot();
    } else {
      plotlyScript.onload = initializePlotly;
    }

    async function fetchAndRenderPlot() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get the chart data
        const response = await fetch(`/api/indicators/${indicatorName}?period=${period}&refresh=${refreshCount.current}`);
        refreshCount.current += 1;
        
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data || !data.plotly_json) {
          throw new Error('Invalid data received from server');
        }
        
        // Parse the Plotly JSON and render
        const plotlyData = JSON.parse(data.plotly_json);
        
        if (!plotContainerRef.current) return;
        
        window.Plotly.newPlot(
          plotContainerRef.current, 
          plotlyData.data, 
          plotlyData