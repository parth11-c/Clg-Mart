const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://foeffwrajekjczyzyfea.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvZWZmd3JhamVramN6eXp5ZmVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MzMzMTcsImV4cCI6MjA3MTAwOTMxN30.CXMqfU6pqtmSFSX2UJacp-qP1dCeMN629Ck7W3h0t7o";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const categories = [
  { id: 1, name: 'Electronics' },
  { id: 2, name: 'Books' },
  { id: 3, name: 'Clothing' },
  { id: 4, name: 'Furniture' },
  { id: 5, name: 'Sports & Fitness' },
  { id: 6, name: 'Musical Instruments' },
  { id: 7, name: 'Art & Crafts' },
  { id: 8, name: 'Home & Garden' },
  { id: 9, name: 'Automotive' },
  { id: 10, name: 'Other' },
];

async function fixCategories() {
  try {
    console.log('🔧 Checking categories table...');
    
    // First, try to fetch existing categories
    const { data: existing, error: fetchError } = await supabase
      .from('categories')
      .select('*');
    
    if (fetchError) {
      console.error('Error fetching categories:', fetchError);
      return;
    }
    
    console.log('Existing categories:', existing?.length || 0);
    
    if (!existing || existing.length === 0) {
      console.log('📝 Inserting categories...');
      
      // Insert categories one by one to handle any conflicts
      for (const category of categories) {
        const { error: insertError } = await supabase
          .from('categories')
          .upsert([category], { onConflict: 'id' });
        
        if (insertError) {
          console.error(`Error inserting category ${category.name}:`, insertError);
        } else {
          console.log(`✅ Inserted category: ${category.name}`);
        }
      }
    } else {
      console.log('✅ Categories table already has data');
      
      // Check if we have all the expected categories
      const missingCategories = categories.filter(cat => 
        !existing.some(existing => existing.id === cat.id)
      );
      
      if (missingCategories.length > 0) {
        console.log(`📝 Adding ${missingCategories.length} missing categories...`);
        
        for (const category of missingCategories) {
          const { error: insertError } = await supabase
            .from('categories')
            .upsert([category], { onConflict: 'id' });
          
          if (insertError) {
            console.error(`Error inserting missing category ${category.name}:`, insertError);
          } else {
            console.log(`✅ Added missing category: ${category.name}`);
          }
        }
      }
    }
    
    // Verify the final state
    const { data: final } = await supabase
      .from('categories')
      .select('*')
      .order('id');
    
    console.log('📊 Final categories:', final?.map(c => `${c.id}: ${c.name}`).join(', '));
    console.log('🎉 Categories fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing categories:', error);
  }
}

// Run the fix
fixCategories();
