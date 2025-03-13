import { NextResponse } from 'next/server';

const FLASK_SERVER = process.env.FLASK_SERVER || 'http://localhost:5000';

export async function GET(request, { params }) {
  const { name } = params;
  const { searchParams } = new URL(request.url);
  
  // Forward all query parameters
  const queryString = Array.from(searchParams.entries())
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  
  try {
    const url = `${FLASK_SERVER}/api/indicators/${name}/plot${queryString ? `?${queryString}` : ''}`;
    console.log(`Fetching from: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch plot: ${response.status} ${response.statusText}`);
    }
    
    // Get the HTML content
    const html = await response.text();
    
    // Return as HTML with proper content type
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error(`Error fetching plot for ${name}:`, error);
    
    // Return a simple error page
    return new Response(
      `<html><body><h1>Error</h1><p>${error.message}</p></body></html>`,
      {
        status: 500,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      }
    );
  }
}
