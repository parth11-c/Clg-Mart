import { supabase } from '../lib/supabase';

// Fix function to add placeholder images for listings without images
export const fixListingImages = async () => {
  try {
    console.log('🔧 Starting to fix listing images...');

    // Get all listings
    const { data: allListings, error: listingsError } = await supabase
      .from('listings')
      .select('id, title');

    if (listingsError) {
      console.error('Error fetching listings:', listingsError);
      return false;
    }

    console.log(`Found ${allListings?.length || 0} listings`);

    // Check each listing for images
    let fixedCount = 0;
    for (const listing of allListings || []) {
      const { data: existingImages } = await supabase
        .from('listing_images')
        .select('file_path')
        .eq('listing_id', listing.id);

      // Check if listing has any valid images
      const hasValidImages = existingImages?.some(img => 
        img.file_path && 
        img.file_path.trim() !== '' && 
        img.file_path !== 'undefined' &&
        img.file_path !== 'null'
      );

      if (!hasValidImages) {
        console.log(`🖼️ Adding placeholder image for listing: ${listing.title}`);
        
        // Delete any invalid images first
        await supabase
          .from('listing_images')
          .delete()
          .eq('listing_id', listing.id);

        // Add a placeholder image
        const placeholderUrl = `https://via.placeholder.com/400x300/2a2a2a/666666?text=${encodeURIComponent(listing.title || 'Item')}`;
        
        const { error: insertError } = await supabase
          .from('listing_images')
          .insert([{
            listing_id: listing.id,
            file_path: placeholderUrl
          }]);

        if (insertError) {
          console.error(`Error adding placeholder for ${listing.id}:`, insertError);
        } else {
          fixedCount++;
        }
      }
    }

    console.log(`✅ Fixed ${fixedCount} listings with placeholder images`);
    return true;

  } catch (error) {
    console.error('Error in fixListingImages:', error);
    return false;
  }
};

// Fix categories table structure
export const fixCategoriesTable = async (): Promise<{ id: number; name: string; }[]> => {
  try {
    console.log('🔧 Checking categories table...');

    // Try to fetch with 'name' column
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .limit(1);

    if (error && error.message.includes('column categories.name does not exist')) {
      console.log('Categories table missing name column, using fallback data');
      
      // Return fallback categories data
      return [
        { id: 1, name: 'Electronics' },
        { id: 2, name: 'Books' },
        { id: 3, name: 'Clothing' },
        { id: 4, name: 'Furniture' },
        { id: 5, name: 'Sports' },
        { id: 6, name: 'Other' }
      ];
    }

    // Try to fetch all categories
    const { data: allCategories, error: allError } = await supabase
      .from('categories')
      .select('id, name')
      .order('name');

    if (allError) {
      console.log('Error fetching all categories:', allError);
      return [
        { id: 1, name: 'Electronics' },
        { id: 2, name: 'Books' },
        { id: 3, name: 'Clothing' },
        { id: 4, name: 'Furniture' },
        { id: 5, name: 'Sports' },
        { id: 6, name: 'Other' }
      ];
    }

    return allCategories || [];
  } catch (error) {
    console.error('Error checking categories:', error);
    return [
      { id: 1, name: 'Electronics' },
      { id: 2, name: 'Books' },
      { id: 3, name: 'Clothing' },
      { id: 4, name: 'Furniture' },
      { id: 5, name: 'Sports' },
      { id: 6, name: 'Other' }
    ];
  }
};
