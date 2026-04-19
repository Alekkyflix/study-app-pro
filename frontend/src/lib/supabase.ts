import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [
    !supabaseUrl && 'VITE_SUPABASE_URL',
    !supabaseAnonKey && 'VITE_SUPABASE_ANON_KEY',
  ]
    .filter(Boolean)
    .join(', ');
  // Throw so the app crashes loudly in dev; in production this surfaces
  // in the browser console and prevents silent broken-client creation.
  throw new Error(
    `[StudyPro] Missing required environment variable(s): ${missing}. ` +
      'Check your .env.local file or Vercel project environment settings.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

