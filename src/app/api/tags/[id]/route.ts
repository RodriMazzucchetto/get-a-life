import {
  apiError,
  getTaskArchitectUserId,
  jsonResponse,
  optionsResponse,
  requireApiKey,
} from '@/lib/external-api'
import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s
  )
}

export async function OPTIONS(request: Request) {
  return optionsResponse(request)
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = requireApiKey(request)
  if (auth) return auth
  const userOrErr = getTaskArchitectUserId(request)
  if (userOrErr instanceof Response) return userOrErr
  const userId = userOrErr

  const { id } = await context.params
  if (!id || !isUuid(id)) return apiError('BAD_REQUEST', 'Invalid tag id', 400, request)

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

  const updates: Record<string, unknown> = {}
  if (typeof body.name === 'string') updates.name = body.name.trim()
  if (typeof body.color === 'string') updates.color = body.color
  if (Object.keys(updates).length === 0) {
    return apiError('BAD_REQUEST', 'No valid fields to update', 400, request)
  }

  const { data, error } = await admin
    .from('tags')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .maybeSingle()

  if (error) return apiError('INTERNAL_ERROR', error.message, 500, request)
  if (!data) return apiError('NOT_FOUND', 'Tag not found', 404, request)
  return jsonResponse({ data }, 200, request)
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = requireApiKey(request)
  if (auth) return auth
  const userOrErr = getTaskArchitectUserId(request)
  if (userOrErr instanceof Response) return userOrErr
  const userId = userOrErr

  const { id } = await context.params
  if (!id || !isUuid(id)) return apiError('BAD_REQUEST', 'Invalid tag id', 400, request)

  let admin
  try {
    admin = createAdminClient()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server configuration error'
    return apiError('CONFIG_ERROR', msg, 503, request)
  }

  const { error } = await admin.from('tags').delete().eq('id', id).eq('user_id', userId)
  if (error) return apiError('INTERNAL_ERROR', error.message, 500, request)
  return jsonResponse({ data: { id, deleted: true } }, 200, request)
}
