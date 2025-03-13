import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  console.log('Running indicators debug endpoint');
  
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
    // 1. Check if the table exists
    console.log('Checking if indicators table exists');
    const { count, error: countError } = await supabase
      .from('indicators')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error checking table:', countError);
      return NextResponse.json({ 
        error: 'Failed to check if table exists',
        details: countError
      }, { status: 500 });
    }
    
    console.log(`Table exists with ${count} rows`);
    
    // 2. List all tables in the schema
    console.log('Listing all tables');
    const { data: tablesList, error: listError } = await supabase
      .from('pg_catalog.pg_tables')
      .select('schemaname,tablename')
      .eq('schemaname', 'public');
    
    if (listError) {
      console.error('Error listing tables:', listError);
    }
    
    // 3. Get a few rows without filtering
    console.log('Getting a few rows without filtering');
    const { data: rawRows, error: rowsError } = await supabase
      .from('indicators')
      .select('*')
      .limit(5);
    
    if (rowsError) {
      console.error('Error getting rows:', rowsError);
      return NextResponse.json({ 
        error: 'Failed to get rows',
        details: rowsError
      }, { status: 500 });
    }
    
    // Return everything we found
    return NextResponse.json({
      table_exists: true,
      row_count: count,
      tables: tablesList || 'Not available',
      sample_rows: rawRows.map(row => ({
        date: row.date,
        data_type: typeof row.data,
        data_keys: row.data ? (typeof row.data === 'object' ? Object.keys(row.data) : 'Not an object') : 'No data',
        updated_at: row.updated_at
      })),
      first_row_full: rawRows.length > 0 ? rawRows[0] : null
    });
  } catch (error: any) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json({ 
      error: 'Error in debug endpoint',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}