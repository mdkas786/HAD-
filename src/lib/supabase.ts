import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const rawKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

// Check if a URL looks like a valid http/https URL and is not a placeholder
const validateSupabaseUrl = (url: any): boolean => {
  if (typeof url !== 'string' || !url) return false;
  const trimmed = url.trim();
  if (
    trimmed.includes('YOUR_SUPABASE_URL') || 
    trimmed.includes('your-project') || 
    trimmed.includes('YOUR_SUPABASE_ANON_KEY')
  ) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
};

const validateSupabaseKey = (key: any): boolean => {
  if (typeof key !== 'string' || !key) return false;
  const k = key.trim();
  if (!k || k === 'YOUR_SUPABASE_ANON_KEY' || k === 'YOUR_SUPABASE_KEY' || k.length < 10) {
    return false;
  }
  return true;
};

// Fallback values
const defaultUrl = 'https://jgwehkuwwdgidimfpbzt.supabase.co';

let supabaseUrl = validateSupabaseUrl(rawUrl) ? rawUrl.trim() : defaultUrl;
const supabaseKey = validateSupabaseKey(rawKey) ? rawKey.trim() : '';

export let isRealSupabase = false;
export let supabase: any = null;

if (validateSupabaseUrl(supabaseUrl) && validateSupabaseKey(supabaseKey)) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    isRealSupabase = true;
  } catch (err) {
    console.warn('[HAD Asset Management] Supabase client creation failed, falling back to local mode:', err);
    supabase = null;
    isRealSupabase = false;
  }
}

console.log(
  '[HAD Asset Management] Backend Mode:', 
  isRealSupabase ? 'Real Supabase DB Linked' : 'Offline Engine Fallback Mode'
);

