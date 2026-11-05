import { createClient } from '@supabase/supabase-js'
import type { Env } from '../env'

// Builds the single shared client from VALIDATED values (see env.ts). Only the publishable key
// is used: Row Level Security in the database is what protects the data.
export function createSupabaseClient(env: Env) {
  return createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY)
}
