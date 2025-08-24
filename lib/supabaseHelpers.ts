import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

// Authentication helpers
export const authHelpers = {
  // Get current user
  getCurrentUser: async (): Promise<User | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Sign up with email
  signUp: async (email: string, password: string) => {
    return await supabase.auth.signUp({
      email,
      password,
    });
  },

  // Sign in with email
  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  // Sign out
  signOut: async () => {
    return await supabase.auth.signOut();
  },

  // Reset password
  resetPassword: async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email);
  },
};

// Database helpers (example for a marketplace)
export const dbHelpers = {
  // Example: Get all products
  getProducts: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  // Example: Get products by category
  getProductsByCategory: async (category: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  // Example: Create a new product
  createProduct: async (product: {
    title: string;
    description: string;
    price: number;
    category: string;
    seller_id: string;
    images?: string[];
  }) => {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select();
    
    return { data, error };
  },

  // Example: Update a product
  updateProduct: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select();
    
    return { data, error };
  },

  // Example: Delete a product
  deleteProduct: async (id: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    return { error };
  },

  // Example: Get user profile
  getUserProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error };
  },

  // Example: Update user profile
  updateUserProfile: async (userId: string, updates: any) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select();
    
    return { data, error };
  },
};

// Storage helpers
export const storageHelpers = {
  // Upload image
  uploadImage: async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);
    
    return { data, error };
  },

  // Get public URL for image
  getImageUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  },

  // Delete image
  deleteImage: async (bucket: string, path: string) => {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    return { error };
  },
};

// Real-time subscriptions
export const realtimeHelpers = {
  // Subscribe to products changes
  subscribeToProducts: (callback: (payload: any) => void) => {
    return supabase
      .channel('products')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'products' }, 
        callback
      )
      .subscribe();
  },

  // Subscribe to user's products
  subscribeToUserProducts: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`user_products_${userId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'products',
          filter: `seller_id=eq.${userId}`
        }, 
        callback
      )
      .subscribe();
  },
};
