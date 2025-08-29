import { supabase } from './supabase';

// Database setup and initialization functions
export const databaseSetup = {
  // Check if required tables exist and have data
  checkDatabase: async () => {
    const checks = {
      categories: false,
      listings: false,
      listing_images: false,
      profiles: false,
      buckets: false
    };

    try {
      // Check categories table
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('count(*)')
        .single();
      checks.categories = !catError;

      // Check listings table  
      const { data: listings, error: listError } = await supabase
        .from('listings')
        .select('count(*)')
        .single();
      checks.listings = !listError;

      // Check listing_images table
      const { data: images, error: imgError } = await supabase
        .from('listing_images')
        .select('count(*)')
        .single();
      checks.listing_images = !imgError;

      // Check profiles table
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('count(*)')
        .single();
      checks.profiles = !profError;

      // Check storage buckets
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      checks.buckets = !bucketError && buckets && buckets.length > 0;

      console.log('Database checks:', checks);
      return checks;
    } catch (error) {
      console.error('Error checking database:', error);
      return checks;
    }
  },

  // Initialize categories if they don't exist
  initializeCategories: async () => {
    const fallbackCategories = [
      { id: 1, label: 'Electronics', slug: 'electronics' },
      { id: 2, label: 'Books', slug: 'books' },
      { id: 3, label: 'Clothing', slug: 'clothing' },
      { id: 4, label: 'Furniture', slug: 'furniture' },
      { id: 5, label: 'Sports & Fitness', slug: 'sports' },
      { id: 6, label: 'Other', slug: 'other' }
    ];

    try {
      const { data: existing } = await supabase
        .from('categories')
        .select('*');

      if (!existing || existing.length === 0) {
        console.log('Initializing categories...');
        const { error } = await supabase
          .from('categories')
          .insert(fallbackCategories);
        
        if (error) {
          console.error('Error initializing categories:', error);
          return false;
        }
        
        console.log('Categories initialized successfully');
        return true;
      }
      
      console.log('Categories already exist');
      return true;
    } catch (error) {
      console.error('Error in initializeCategories:', error);
      return false;
    }
  },

  // Create user profile if it doesn't exist
  createUserProfile: async (userId: string, email: string) => {
    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!existing) {
        console.log('Creating user profile...');
        const { error } = await supabase
          .from('profiles')
          .insert([{
            id: userId,
            username: email.split('@')[0], // Use email prefix as default username
            email: email,
            created_at: new Date().toISOString()
          }]);

        if (error) {
          console.error('Error creating user profile:', error);
          return false;
        }

        console.log('User profile created successfully');
        return true;
      }

      console.log('User profile already exists');
      return true;
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      return false;
    }
  },

  // Create sample listings with placeholder images
  createSampleData: async () => {
    try {
      // Check if we already have listings
      const { data: existingListings } = await supabase
        .from('listings')
        .select('id')
        .limit(1);

      if (existingListings && existingListings.length > 0) {
        console.log('Sample data already exists');
        return true;
      }

      // Get or create a sample user
      const { data: { user } } = await supabase.auth.getUser();
      let sellerId = user?.id;

      if (!sellerId) {
        // Create a sample profile
        const { data: sampleUser } = await supabase
          .from('profiles')
          .select('id')
          .limit(1)
          .single();

        if (sampleUser) {
          sellerId = sampleUser.id;
        } else {
          console.log('No user available to create sample data');
          return false;
        }
      }

      // Sample listings with placeholder images
      const sampleListings = [
        {
          title: 'MacBook Pro 13"',
          description: 'Great condition MacBook Pro, perfect for students. Includes charger and original box.',
          price: 899.99,
          condition: 'good',
          category_id: 1, // Electronics
          seller_id: sellerId,
        },
        {
          title: 'Calculus Textbook',
          description: 'Stewart Calculus 8th edition. Minimal highlighting, excellent condition.',
          price: 45.00,
          condition: 'good',
          category_id: 2, // Books
          seller_id: sellerId,
        },
        {
          title: 'Study Desk',
          description: 'Wooden study desk with drawers. Perfect for dorm room or apartment.',
          price: 120.00,
          condition: 'fair',
          category_id: 4, // Furniture
          seller_id: sellerId,
        }
      ];

      console.log('Creating sample listings...');
      const { data: createdListings, error } = await supabase
        .from('listings')
        .insert(sampleListings)
        .select('id');

      if (error) {
        console.error('Error creating sample listings:', error);
        return false;
      }

      // Add placeholder images for each listing
      for (const listing of createdListings || []) {
        // Create a simple placeholder image URL (using a placeholder service)
        const placeholderImageUrl = `https://via.placeholder.com/400x300/2a2a2a/666666?text=${encodeURIComponent('Sample Item')}`;
        
        const { error: imageError } = await supabase
          .from('listing_images')
          .insert([{
            listing_id: listing.id,
            file_path: placeholderImageUrl
          }]);

        if (imageError) {
          console.error('Error adding placeholder image:', imageError);
        }
      }

      console.log('Sample data created successfully');
      return true;
    } catch (error) {
      console.error('Error creating sample data:', error);
      return false;
    }
  }
};
