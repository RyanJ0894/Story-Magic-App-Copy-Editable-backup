import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eyfxxhkbotkjsazvhlxj.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjdWh5eXllcnh3Z2tya2JycWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MzQyOTEsImV4cCI6MjA3MDAxMDI5MX0.-9pGj4UEiT_3jC9hJit2LbCrXy2KlaqGgvv4giA6RV4';

declare global {
  interface Window {
    __sm_supabase?: SupabaseClient;
  }
}

// Reuse existing instance if present (prevents duplicate clients during HMR or double import)
export const supabase =
  window.__sm_supabase ??
  (window.__sm_supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey: 'storymagic-auth', // unique key so multiple clients don’t collide
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }));
