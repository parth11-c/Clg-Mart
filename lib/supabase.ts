import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://foeffwrajekjczyzyfea.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvZWZmd3JhamVramN6eXp5ZmVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MzMzMTcsImV4cCI6MjA3MTAwOTMxN30.CXMqfU6pqtmSFSX2UJacp-qP1dCeMN629Ck7W3h0t7o"

// Validate configuration
if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase configuration. Please check your environment variables.')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})

// Test the connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('_test_connection').select('*').limit(1)
    if (error && error.code !== 'PGRST116') { // PGRST116 is expected for non-existent table
      console.error('Supabase connection test failed:', error)
      return false
    }
    console.log('Supabase connection successful')
    return true
  } catch (error) {
    console.error('Supabase connection error:', error)
    return false
  }
}
