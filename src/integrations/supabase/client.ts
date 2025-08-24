import { createClient } from '@supabase/supabase-js';

// ✅ Your real Supabase project URL + anon key
const supabaseUrl = 'https://eyfxxhkbotkjsazvhxlj.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5Znh4aGtib3RranNhenZoeGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMjc1NDEsImV4cCI6MjA2ODkwMzU0MX0.IKlj4-494b6k5Te9Qbv5CZpJt25INYchGRixQYBEdoM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
