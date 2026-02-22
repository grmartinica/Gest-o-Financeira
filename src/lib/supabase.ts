import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isSupabaseConfigured = 
  supabaseUrl && 
  isValidUrl(supabaseUrl) &&
  supabaseUrl !== 'your-project-url.supabase.co' && 
  supabaseAnonKey && 
  supabaseAnonKey !== 'your-anon-key';

const finalUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co';
const finalKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key';

let supabaseClient;
try {
  supabaseClient = createClient(finalUrl, finalKey);
} catch (e) {
  console.error('Failed to initialize Supabase client:', e);
  // Fallback to a dummy client or handle gracefully
  supabaseClient = {
    from: () => ({
      select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
      insert: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
      delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
    })
  } as any;
}

export const supabase = supabaseClient;
