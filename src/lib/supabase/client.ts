import { createClient } from '@supabase/supabase-js'
import { parseEnv } from '../env'

// Reads VITE_* variables that Vite injects at build time, validates them, then creates the
// single shared client. Only the publishable key is used: Row Level Security protects the data.
const env = parseEnv(import.meta.env)

export const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY)
