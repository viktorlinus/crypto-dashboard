import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { format, subDays, subMonths, subYears } from 'date-fns';

export async function POST(req: Request) {
  // Get parameters from the request body
  const body = await req.json();
  const { indicator, coin, timeRange } = body;
  
  // Calculate date range based on time range
  const endDate = new Date();
  let startDate = new Date();
  
  switch (timeRange) {
    case '7D':
      startDate = subDays(endDate, 7);
      break;
    case '1M':
      startDate = subMonths(endDate, 1);
      break;
    case '3M':
      startDate = subMonths(endDate, 3);
      break;
    case '6M':
      startDate = subMonths(endDate, 6);
      break;
    case '1Y':
      startDate = subYears(endDate, 1);
      break;
    case 'ALL':
      // Use a far past date for "ALL"
      startDate = new Date('2010-01-01');
      break;
  }
  
  const formattedStartDate = format(startDate, 'yyyy-MM-dd');
  const formattedEndDate = format(endDate, 'yyyy-MM-dd');
  
  console.log(`Special fetch for ${coin} ${indicator} - timeRange:${timeRange}, startDate:${formattedStartDate}, endDate:${formattedEndDate}`);
  
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { message: 'Server configuration error', error: 'Missing Supabase credentials' },
      { status: 500 }
    );
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Get all rows from the indicators table that match the date range
    let query = supabase
      .from('indicators')
      .select('*')
      .order('date', { ascending: true });
      
    // Apply date filters
    if (formattedStartDate) {
      query = query.gte('date', formattedStartDate);
    }
    
    if (formattedEndDate) {
      query = query.lte('date', formattedEndDate);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        { message: 'Database query error', error: error.message },
        { status: 500 }
      );
    }
    
    console.log(`Got ${data?.length || 0} rows from the database`);
    
    if (!data || data.length === 0) {
      return NextResponse.json({ data: [] });
    }
    
    // First row for debugging
    if (data.length > 0) {
      console.log('Sample row data:', JSON.stringify(data[0]));
    }
    
    // Process the data - specifically match the exact structure we found
    const processedData = data
      .filter(row => row.data && row.data.BTC && row.data.BTC.Crowding)
      .map(row => {
        return {
          date: row.date,
          indicator_name: 'Crowding',
          base_coin: 'BTC',
          value: row.data.BTC.Crowding.value,
          data: {
            BTC: row.data.BTC
          }
        };
      });
    
    console.log(`Processed ${processedData.length} rows with Crowding data`);
    
    return NextResponse.json({ data: processedData });
  } catch (error: any) {
    console.error('Error in special fetch:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch data',
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}