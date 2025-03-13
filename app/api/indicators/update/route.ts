import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Secret key for API authentication
const API_SECRET = process.env.INDICATORS_API_SECRET;

export async function POST(req: Request) {
  // Check API key
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== API_SECRET) {
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Initialize Supabase client with service role key for admin access
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { message: 'Server configuration error' },
      { status: 500 }
    );
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Parse request body
    const body = await req.json();
    const { indicators } = body;
    
    // Validate input
    if (!indicators || !Array.isArray(indicators) || indicators.length === 0) {
      return NextResponse.json(
        { message: 'Invalid request body. Expected an array of indicators.' },
        { status: 400 }
      );
    }
    
    // Validate each indicator has required fields
    for (const indicator of indicators) {
      if (!indicator.date || !indicator.indicator_name || !indicator.base_coin) {
        return NextResponse.json(
          {
            message: 'Each indicator must have date, indicator_name, and base_coin fields',
            invalidIndicator: indicator
          },
          { status: 400 }
        );
      }
    }
    
    // Insert or update indicators
    const { error } = await supabase
      .from('indicators')
      .upsert(indicators, { 
        onConflict: 'date,indicator_name,base_coin',
        ignoreDuplicates: false
      });
      
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `${indicators.length} indicators processed successfully` 
    });
  } catch (error: any) {
    console.error('Error updating indicators:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update indicators',
        error: error.message 
      },
      { status: 500 }
    );
  }
}
