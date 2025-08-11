import { createClient } from '@supabase/supabase-js';

// ✅ Your real Supabase project URL + anon key
const supabaseUrl = 'https://bcuhyyyerxwgkrkbrqbs.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjdWh5eXllcnh3Z2tya2JycWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MzQyOTEsImV4cCI6MjA3MDAxMDI5MX0.-9pGj4UEiT_3jC9hJit2LbCrXy2KlaqGgvv4giA6RV4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
