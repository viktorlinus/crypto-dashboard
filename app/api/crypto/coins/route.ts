import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope') || 'current'; // 'current' or 'all'
  
  try {
    if (scope === 'all') {
      // Get all tracked coins within cutoff period (30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];
      
      const { data: trackedCoins, error } = await supabase
        .from('tracked_coins')
        .select('symbol')
        .gte('last_in_top100', cutoffDate)
        .order('symbol');
      
      if (error) {
        throw error;
      }
      
      const coins = trackedCoins.map(coin => coin.symbol);
      return NextResponse.json(coins);
    } else {
      // Get only current top 100 coins from rankings
      const { data: rankings, error } = await supabase
        .from('crypto_rankings')
        .select('rankings')
        .order('date', { ascending: false })
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      if (!rankings || rankings.length === 0) {
        // Fallback to the old method if no rankings are available
        const { data, error: pricesError } = await supabase
          .from('crypto_prices')
          .select('prices')
          .order('date', { ascending: false })
          .limit(1);

        if (pricesError) {
          throw pricesError;
        }

        if (!data || data.length === 0) {
          return NextResponse.json({ error: 'No data found' }, { status: 404 });
        }

        // Extract all coin symbols from the latest data
        const coins = Object.keys(data[0].prices).sort();
        return NextResponse.json(coins);
      }
      
      // Get all the symbols from the rankings and sort by their rank
      const rankingsObj = rankings[0].rankings;
      const coinEntries = Object.entries(rankingsObj)
        .sort((a, b) => (a[1] as number) - (b[1] as number))
        .map(entry => entry[0]);
      
      return NextResponse.json(coinEntries);
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available coins' },
      { status: 500 }
    );
  }
}