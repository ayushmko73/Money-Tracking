
import { createClient } from '@supabase/supabase-js';

// Derived from your provided PostgreSQL URL: pmvinaertnnnxsshswrk
const SUPABASE_URL = 'https://pmvinaertnnnxsshswrk.supabase.co';

/**
 * IMPORTANT: Replace this placeholder with the 'anon public' key from your 
 * Supabase Dashboard (Settings -> API).
 * The current string is a formatted placeholder to prevent 'Failed to fetch' 
 * but requires a valid project signature to authorize requests.
 */
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtdmluYWVydG5ubnhzc2hzd3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNTcyMzgsImV4cCI6MjA1NTkzMzIzOH0.X_7X5X9X_v8X7X_X9X_v8X7X_X9X_v8X7X_X9X_v8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
