import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { cleanEnv } from '@/lib/env'

/**
 * Cliente Supabase com service role — ignora RLS.
 * Usar apenas em rotas de servidor; nunca exponha SUPABASE_SERVICE_ROLE_KEY ao cliente.
 */
export function createAdminClient(): SupabaseClient {
  const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const serviceRoleKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (server-only)'
    )
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
