import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  
  console.log(`Direct crowding indicator fetch - startDate:${startDate}, endDate:${endDate}`);
  
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials');
    return NextResponse.json(
      { message: 'Server configuration error', error: 'Missing Supabase credentials' },
      { status: 500 }
    );
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Just get all rows without date filtering temporarily for debugging
    console.log('Querying all rows from indicators table');
    const { data, error } = await supabase
      .from('indicators')
      .select('*')
      .limit(50);
    
    console.log(`Retrieved ${data?.length || 0} rows of indicator data`);
    
    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { message: 'Database query error', error: error.message },
        { status: 500 }
      );
    }
    
    // Return empty data if nothing found
    if (!data || data.length === 0) {
      console.warn('No indicator data found for the date range');
      return NextResponse.json({ data: [] });
    }
    
    // Process the data to extract specifically what we need
    const processedData = data.map(row => {
      // Make sure the data field is properly formatted
      let rowData = row.data;
      
      // If data is a string, try to parse it
      if (typeof rowData === 'string') {
        try {
          rowData = JSON.parse(rowData);
        } catch (e) {
          console.error('Failed to parse data JSON:', e);
        }
      }
      
      // Format the data specifically for the indicator chart component
      return {
        date: row.date,
        data: rowData
      };
    });
    
    console.log(`Processed ${processedData.length} rows of data successfully`);
    if (processedData.length > 0) {
      console.log('Sample row:', JSON.stringify(processedData[0], null, 2));
    }
    
    return NextResponse.json({ data: processedData });
  } catch (error: any) {
    console.error('Error handling request:', error);
    return NextResponse.json(
      { message: 'Error processing request', error: error.message },
      { status: 500 }
    );
  }
}