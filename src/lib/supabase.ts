import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

// Server-only. Never import in client components.
export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    const missing = !url ? 'SUPABASE_URL' : 'SUPABASE_SERVICE_ROLE_KEY'
    throw new Error(`Missing ${missing} env var`)
  }
  
  // Validate URL format
  try {
    new URL(url)
  } catch {
    throw new Error(`Invalid SUPABASE_URL: ${url}`)
  }
  
  _client = createClient(url, key, {
    auth: { persistSession: false }
  })
  return _client
}
