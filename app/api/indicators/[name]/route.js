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
    const response = await fetch(`${FLASK_SERVER}/api/indicators/${name}${queryString ? `?${queryString}` : ''}`);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch indicator: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error fetching indicator ${name}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch indicator data' },
      { status: 500 }
    );
  }
}
