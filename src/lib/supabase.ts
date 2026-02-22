import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseUrl.startsWith('http') &&
  supabaseUrl !== 'your-project-url.supabase.co' && 
  supabaseAnonKey && 
  supabaseAnonKey !== 'your-anon-key';

// Only create client if configured, otherwise use a proxy to avoid crashes
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      from: () => ({
        select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
        insert: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
        delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
      })
    } as any;
