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
    const response = await fetch(
      `${FLASK_SERVER}/api/indicators/${name}/image${queryString ? `?${queryString}` : ''}`
    );
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    
    // Return as PNG image
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
      },
    });
  } catch (error) {
    console.error(`Error fetching image for ${name}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
}
