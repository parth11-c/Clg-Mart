const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://foeffwrajekjczyzyfea.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvZWZmd3JhamVramN6eXp5ZmVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MzMzMTcsImV4cCI6MjA3MTAwOTMxN30.CXMqfU6pqtmSFSX2UJacp-qP1dCeMN629Ck7W3h0t7o";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTableStructure() {
  try {
    console.log('🔍 Checking categories table structure...');
    
    // Try to get the first row to see what columns exist
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('First row data:', data[0]);
      console.log('Available columns:', Object.keys(data[0]));
    } else {
      console.log('No data in categories table');
    }
    
    // Try to get all rows
    const { data: allData } = await supabase
      .from('categories')
      .select('*');
    
    console.log('All categories data:', allData);
    
  } catch (error) {
    console.error('Error checking table structure:', error);
  }
}

checkTableStructure();
