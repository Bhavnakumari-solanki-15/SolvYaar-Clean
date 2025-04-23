import { createClient } from '@supabase/supabase-js';
import { Database, MathScrollRow } from '../types/database.types';

// Initialize with environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a mock client when credentials are missing
const createMockClient = () => {
  console.warn('Using mock Supabase client - database functionality will be limited');
  
  // Return a mock client that implements the necessary interface but doesn't perform real operations
  return {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      signInAnonymously: async () => ({ data: { user: { id: 'mock-user' } }, error: null }),
    },
    from: () => ({
      insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
      select: () => ({
        eq: () => ({
          order: () => ({ data: [], error: null }),
          single: async () => ({ data: null, error: { code: 'PGRST116' } }),
        }),
      }),
    }),
    storage: {
      from: () => ({
        upload: async () => ({ data: { path: 'mock-path' }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/mock-file' } }),
      }),
    },
  };
};

// Create a single supabase client for interacting with your database
export const supabase = supabaseUrl && supabaseKey
  ? createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined
      }
    })
  : createMockClient();

/**
 * Initialize Supabase auth state
 */
export async function initializeAuth() {
  try {
    // Check for existing session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // If no session exists, try to sign in anonymously
      const { data: { user }, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      console.log('Signed in anonymously:', user);
    }
  } catch (error) {
    console.error('Error initializing auth:', error);
    // Continue without authentication
  }
}

/**
 * Get the Supabase client instance
 */
export function getSupabaseClient() {
  return supabase;
}

/**
 * A Math Scroll in our database
 */
export type MathScroll = MathScrollRow;

/**
 * Save a new math scroll to Supabase
 */
export async function saveMathScroll(scroll: Omit<MathScroll, 'id'>): Promise<MathScroll | null> {
  const { data, error } = await supabase
    .from('math_scrolls')
    .insert([scroll])
    .select()
    .single();

  if (error) {
    console.error('Error saving math scroll:', error);
    return null;
  }

  return data;
}

/**
 * Get all math scrolls for a wallet address
 */
export async function getMathScrolls(walletAddress: string): Promise<MathScroll[]> {
  const { data, error } = await supabase
    .from('math_scrolls')
    .select('*')
    .eq('wallet_address', walletAddress)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching math scrolls:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a specific math scroll by ID
 */
export async function getScrollById(scrollId: string): Promise<MathScroll | null> {
  const { data, error } = await supabase
    .from('math_scrolls')
    .select('*')
    .eq('id', scrollId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      // PGRST116 is the "no rows returned" error code from PostgREST
      return null;
    }
    console.error('Error fetching math scroll:', error);
    throw error;
  }
  
  return data;
}

export async function uploadFile(file: File, bucket: string, path: string) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file);

  if (error) {
    throw error;
  }

  return data;
}

export async function getFileUrl(bucket: string, path: string) {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
} 