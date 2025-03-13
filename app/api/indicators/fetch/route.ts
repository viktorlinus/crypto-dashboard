import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  // Make parameter parsing more robust
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  
  // We're bypassing the indicator specific filtering to improve compatibility
  console.log(`Fetching all indicators - startDate:${startDate}, endDate:${endDate}`);
  
  
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { message: 'Server configuration error', error: 'Missing Supabase credentials' },
      { status: 500 }
    );
  }
  
  console.log('Supabase credentials loaded');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // First, check if the indicators table exists and has data
    const tableCheck = await supabase
      .from('indicators')
      .select('count')
      .single();
      
    console.log('Table check result:', tableCheck);
    
    // If there's an error accessing the table, return it
    if (tableCheck.error) {
      return NextResponse.json(
        { 
          message: 'Error accessing indicators table', 
          error: tableCheck.error.message,
          details: tableCheck.error
        },
        { status: 500 }
      );
    }
    
    // Build the query for the actual data
    let query = supabase
      .from('indicators')
      .select('*')
      .order('date', { ascending: true });
    
    // Apply filters if provided
    if (startDate) {
      query = query.gte('date', startDate);
    }
    
    if (endDate) {
      query = query.lte('date', endDate);
    }
    
    const { data, error } = await query;
    
    // Log the raw data response for debugging
    console.log(`Got ${data?.length || 0} rows from database`);
    if (data && data.length > 0) {
      // Pretty print the first row for better debugging
      const sampleRow = { ...data[0] };
      if (sampleRow.data) {
        // Convert any stringified JSON to objects
        if (typeof sampleRow.data === 'string') {
          try {
            sampleRow.data = JSON.parse(sampleRow.data);
          } catch (e) {
            console.log('Could not parse data as JSON');
          }
        }
      }
      console.log('First row sample:', JSON.stringify(sampleRow, null, 2));
    }
    
    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { message: 'Database query error', error: error.message, details: error },
        { status: 500 }
      );
    }
    
    // If no data found, return empty array
    if (!data || data.length === 0) {
      return NextResponse.json({ data: [] });
    }
    
    // Since we're skipping indicator filtering, just return the raw rows
    // The chart component will extract what it needs
    console.log(`After filtering, returning ${data.length} rows`);
    
    // Return the data directly
    return NextResponse.json({ 
      data: data,
      debug: {
        rawDataCount: data.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching indicators:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch indicators',
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
