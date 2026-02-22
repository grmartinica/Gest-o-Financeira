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

export const supabase = createClient(finalUrl, finalKey);
