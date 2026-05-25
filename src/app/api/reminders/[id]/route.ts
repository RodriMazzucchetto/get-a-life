import {
  apiError,
  getTaskArchitectUserId,
  jsonResponse,
  optionsResponse,
  requireApiKey,
} from '@/lib/external-api'
import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const PRIORITIES = ['low', 'medium', 'high'] as const
const CATEGORIES = ['compras', 'followups', 'lembretes'] as const

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
  if (!id || !isUuid(id)) return apiError('BAD_REQUEST', 'Invalid reminder id', 400, request)

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
  if ('category' in body) {
    if (
      typeof body.category !== 'string' ||
      !CATEGORIES.includes(body.category as (typeof CATEGORIES)[number])
    ) {
      return apiError(
        'BAD_REQUEST',
        `Invalid category. Allowed: ${CATEGORIES.join(', ')}`,
        400,
        request
      )
    }
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof body.title === 'string') updates.title = body.title.trim()
  if (typeof body.description === 'string' || body.description === null) {
    updates.description = body.description
  }
  if (typeof body.due_date === 'string' || body.due_date === null) {
    updates.due_date = body.due_date
  }
  if (
    typeof body.priority === 'string' &&
    PRIORITIES.includes(body.priority as (typeof PRIORITIES)[number])
  ) {
    updates.priority = body.priority
  }
  if (
    typeof body.category === 'string' &&
    CATEGORIES.includes(body.category as (typeof CATEGORIES)[number])
  ) {
    updates.category = body.category
  }
  if (typeof body.completed === 'boolean') {
    updates.completed = body.completed
    updates.completed_at = body.completed ? new Date().toISOString() : null
  }

  const keys = Object.keys(updates).filter((x) => x !== 'updated_at')
  if (keys.length === 0) return apiError('BAD_REQUEST', 'No valid fields to update', 400, request)

  const { data, error } = await admin
    .from('reminders')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .maybeSingle()

  if (error) return apiError('INTERNAL_ERROR', error.message, 500, request)
  if (!data) return apiError('NOT_FOUND', 'Reminder not found', 404, request)
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
  if (!id || !isUuid(id)) return apiError('BAD_REQUEST', 'Invalid reminder id', 400, request)

  let admin
  try {
    admin = createAdminClient()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server configuration error'
    return apiError('CONFIG_ERROR', msg, 503, request)
  }

  const { error } = await admin
    .from('reminders')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return apiError('INTERNAL_ERROR', error.message, 500, request)
  return jsonResponse({ data: { id, deleted: true } }, 200, request)
}
