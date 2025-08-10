// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://eyfxxhkbotkjsazvhxlj.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5Znh4aGtib3RranNhenZoeGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMjc1NDEsImV4cCI6MjA2ODkwMzU0MX0.IKlj4-494b6k5Te9Qbv5CZpJt25INYchGRixQYBEdoM";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// optional sanity check in the browser console:
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
} else {
  console.log('Supabase ready:', supabaseUrl);
}