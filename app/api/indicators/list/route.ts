import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { message: 'Server configuration error' },
      { status: 500 }
    );
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Get the most recent indicator data to see what's available
    const { data, error } = await supabase
      .from('indicators')
      .select('*')
      .order('date', { ascending: false })
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json({ indicators: [] });
    }
    
    // Extract available indicators and coins
    const availableCoins = Object.keys(data[0].data || {});
    
    const indicators: string[] = [];
    const coins: string[] = [];
    
    // For each coin, get the available indicators
    availableCoins.forEach(coin => {
      coins.push(coin);
      
      // Get all indicators for this coin
      const coinIndicators = Object.keys(data[0].data[coin] || {});
      
      // Add any new indicators to the list
      coinIndicators.forEach(indicator => {
        if (!indicators.includes(indicator) && indicator !== 'price') {
          indicators.push(indicator);
        }
      });
    });
    
    return NextResponse.json({ 
      indicators, 
      coins,
      availableCombinations: availableCoins.map(coin => {
        return {
          coin,
          indicators: Object.keys(data[0].data[coin] || {}).filter(i => i !== 'price')
        };
      })
    });
  } catch (error: any) {
    console.error('Error listing indicators:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to list indicators',
        error: error.message 
      },
      { status: 500 }
    );
  }
}
