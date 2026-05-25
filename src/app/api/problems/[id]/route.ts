import {
  apiError,
  getTaskArchitectUserId,
  jsonResponse,
  optionsResponse,
  requireApiKey,
} from '@/lib/external-api'
import { createAdminClient } from '@/lib/supabase-admin'
import {
  assertProjectsOwnedByUser,
  problemSelectWithProjects,
  syncProblemProjectLinks,
} from '@/app/api/problems/problem-sync'

export const dynamic = 'force-dynamic'

const KINDS = ['market', 'operational'] as const

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s
  )
}

function normalizeProjectIdsPatch(body: Record<string, unknown>): string[] | null {
  if (!('project_ids' in body) && !('project_id' in body)) return null
  if (Array.isArray(body.project_ids)) {
    const ids = body.project_ids.filter((x): x is string => typeof x === 'string' && isUuid(x))
    return [...new Set(ids)]
  }
  if (body.project_id === null) return []
  if (typeof body.project_id === 'string' && isUuid(body.project_id)) return [body.project_id]
  return []
}

export async function OPTIONS(request: Request) {
  return optionsResponse(request)
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = requireApiKey(request)
  if (auth) return auth
  const userOrErr = getTaskArchitectUserId(request)
  if (userOrErr instanceof Response) return userOrErr
  const userId = userOrErr
  const { id } = await context.params
  if (!id || !isUuid(id)) return apiError('BAD_REQUEST', 'Invalid problem id', 400, request)

  let admin
  try {
    admin = createAdminClient()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server configuration error'
    return apiError('CONFIG_ERROR', msg, 503, request)
  }

  const { data, error } = await admin
    .from('problems')
    .select(problemSelectWithProjects)
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return apiError('INTERNAL_ERROR', error.message, 500, request)
  if (!data) return apiError('NOT_FOUND', 'Problem not found', 404, request)
  return jsonResponse({ data }, 200, request)
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
  if (!id || !isUuid(id)) return apiError('BAD_REQUEST', 'Invalid problem id', 400, request)

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

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof body.title === 'string') updates.title = body.title.trim()
  if (typeof body.description === 'string' || body.description === null) updates.description = body.description
  if (typeof body.resolved === 'boolean') updates.resolved = body.resolved
  if (typeof body.pos === 'number' && Number.isFinite(body.pos)) updates.pos = body.pos
  if (typeof body.is_high_priority === 'boolean') updates.is_high_priority = body.is_high_priority
  if (typeof body.on_hold === 'boolean') updates.on_hold = body.on_hold
  if (typeof body.on_hold_reason === 'string' || body.on_hold_reason === null) updates.on_hold_reason = body.on_hold_reason
  if (typeof body.kind === 'string' && KINDS.includes(body.kind as (typeof KINDS)[number])) updates.kind = body.kind

  const projectIdsPatch = normalizeProjectIdsPatch(body)
  if (projectIdsPatch !== null) delete updates.project_id

  const keys = Object.keys(updates).filter((x) => x !== 'updated_at')
  if (keys.length === 0 && projectIdsPatch === null) {
    return apiError('BAD_REQUEST', 'No valid fields to update', 400, request)
  }

  if (keys.length > 0) {
    const { error } = await admin.from('problems').update(updates).eq('id', id).eq('user_id', userId)
    if (error) return apiError('INTERNAL_ERROR', error.message, 500, request)
  }

  if (projectIdsPatch !== null) {
    const check = await assertProjectsOwnedByUser(admin, projectIdsPatch, userId)
    if (!check.ok) return apiError('BAD_REQUEST', check.message, 400, request)
    const sync = await syncProblemProjectLinks(admin, id, userId, projectIdsPatch)
    if (!sync.ok) return apiError('BAD_REQUEST', sync.message, 400, request)
  }

  const { data, error } = await admin
    .from('problems')
    .select(problemSelectWithProjects)
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return apiError('INTERNAL_ERROR', error.message, 500, request)
  if (!data) return apiError('NOT_FOUND', 'Problem not found', 404, request)
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
  if (!id || !isUuid(id)) return apiError('BAD_REQUEST', 'Invalid problem id', 400, request)

  let admin
  try {
    admin = createAdminClient()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server configuration error'
    return apiError('CONFIG_ERROR', msg, 503, request)
  }

  const { error } = await admin.from('problems').delete().eq('id', id).eq('user_id', userId)
  if (error) return apiError('INTERNAL_ERROR', error.message, 500, request)
  return jsonResponse({ data: { id, deleted: true } }, 200, request)
}
