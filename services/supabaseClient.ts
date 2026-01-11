import { createClient } from '@supabase/supabase-js';

// Environment variables are injected by the build system (Vite/Vercel)
const SUPABASE_URL = 'https://pmvinaertnnnxsshswrk.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtdmluYWVydG5ubnhzc2hzd3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTYxNzIsImV4cCI6MjA4MTc5MjE3Mn0.2YwIiImetIuNHWOIBgATX1MvhGKajGVBmzqCpE8J0VI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
