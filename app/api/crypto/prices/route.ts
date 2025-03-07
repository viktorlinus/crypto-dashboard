import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start') || '2024-01-01';
  const end = searchParams.get('end') || new Date().toISOString().split('T')[0];
  const coins = searchParams.get('coins')?.split(',') || ['BTC', 'ETH', 'SOL', 'BNB'];

  try {
    const { data, error } = await supabase
      .from('crypto_prices')
      .select('date, prices')
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return NextResponse.json([]);
    }

    // Process the data to extract only the requested coins
    const formattedData = data.map(row => {
      const priceData: any = { date: row.date };
      
      coins.forEach(coin => {
        if (row.prices[coin] !== undefined) {
          priceData[coin] = row.prices[coin];
        }
      });
      
      return priceData;
    });

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crypto prices' },
      { status: 500 }
    );
  }
}