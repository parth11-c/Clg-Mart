// Script to fix database issues
const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'your_supabase_url';
const supabaseKey = 'your_supabase_anon_key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDatabase() {
  console.log('Starting database fixes...');

  try {
    // 1. Fix categories table - check current structure
    console.log('Checking categories table structure...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .limit(1);
    
    console.log('Categories sample:', categories);
    console.log('Categories error:', catError);

    // 2. Check listing_images table
    console.log('Checking listing_images table...');
    const { data: images, error: imgError } = await supabase
      .from('listing_images')
      .select('*')
      .limit(5);
    
    console.log('Images sample:', images);
    console.log('Images error:', imgError);

    // 3. Add placeholder images for listings that don't have any
    console.log('Fixing missing images...');
    const { data: listingsWithoutImages } = await supabase
      .from('listings')
      .select('id')
      .not('id', 'in', `(${
        // Get listing IDs that already have images
        await supabase
          .from('listing_images')
          .select('listing_id')
          .then(({ data }) => data?.map(img => `'${img.listing_id}'`).join(',') || "''")
      })`);

    console.log('Listings without images:', listingsWithoutImages?.length || 0);

    // Add placeholder images for each listing without images
    if (listingsWithoutImages && listingsWithoutImages.length > 0) {
      const placeholderImages = listingsWithoutImages.map(listing => ({
        listing_id: listing.id,
        file_path: `https://via.placeholder.com/400x300/333333/666666?text=${encodeURIComponent('No Image')}`
      }));

      const { error: insertError } = await supabase
        .from('listing_images')
        .insert(placeholderImages);

      if (insertError) {
        console.error('Error adding placeholder images:', insertError);
      } else {
        console.log(`Added ${placeholderImages.length} placeholder images`);
      }
    }

    console.log('Database fixes completed!');
    
  } catch (error) {
    console.error('Error fixing database:', error);
  }
}

// Run the fix
fixDatabase();
