import {
  apiError,
  getTaskArchitectUserId,
  jsonResponse,
  optionsResponse,
  requireApiKey,
} from '@/lib/external-api'
import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function OPTIONS(request: Request) {
  return optionsResponse(request)
}

export async function GET(request: Request) {
  const auth = requireApiKey(request)
  if (auth) return auth
  const userOrErr = getTaskArchitectUserId(request)
  if (userOrErr instanceof Response) return userOrErr
  const userId = userOrErr

  let admin
  try {
    admin = createAdminClient()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server configuration error'
    return apiError('CONFIG_ERROR', msg, 503, request)
  }

  const { data, error } = await admin
    .from('tags')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return apiError('INTERNAL_ERROR', error.message, 500, request)
  return jsonResponse({ data: data ?? [] }, 200, request)
}

export async function POST(request: Request) {
  const auth = requireApiKey(request)
  if (auth) return auth
  const userOrErr = getTaskArchitectUserId(request)
  if (userOrErr instanceof Response) return userOrErr
  const userId = userOrErr

  let admin
  try {
    admin = createAdminClient()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server configuration error'
    return apiError('CONFIG_ERROR', msg, 503, request)
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return apiError('BAD_REQUEST', 'Invalid JSON body', 400, request)
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) return apiError('BAD_REQUEST', 'Field "name" is required', 400, request)
  const color = typeof body.color === 'string' ? body.color : '#94a3b8'

  const { data, error } = await admin
    .from('tags')
    .insert({ user_id: userId, name, color })
    .select('*')
    .single()

  if (error) return apiError('INTERNAL_ERROR', error.message, 500, request)
  return jsonResponse({ data }, 201, request)
}
