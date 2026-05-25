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

function normalizeProjectIds(body: Record<string, unknown>): string[] {
  const ids: string[] = []
  if (Array.isArray(body.project_ids)) {
    for (const x of body.project_ids) {
      if (typeof x === 'string' && isUuid(x)) ids.push(x)
    }
  }
  if (typeof body.project_id === 'string' && isUuid(body.project_id)) {
    ids.push(body.project_id)
  }
  return [...new Set(ids)]
}

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

  const { searchParams } = new URL(request.url)
  const kind = searchParams.get('kind')?.trim()
  const resolved = searchParams.get('resolved')
  const onHold = searchParams.get('on_hold')
  const projectId = searchParams.get('project_id')?.trim()

  if (kind && !KINDS.includes(kind as (typeof KINDS)[number])) {
    return apiError('BAD_REQUEST', `Invalid kind. Allowed: ${KINDS.join(', ')}`, 400, request)
  }
  if (projectId && !isUuid(projectId)) {
    return apiError('BAD_REQUEST', 'Invalid project_id (must be UUID)', 400, request)
  }

  let q = admin
    .from('problems')
    .select(problemSelectWithProjects)
    .eq('user_id', userId)
    .order('pos', { ascending: true })
  if (kind) q = q.eq('kind', kind)
  if (resolved === 'true' || resolved === 'false') q = q.eq('resolved', resolved === 'true')
  if (onHold === 'true' || onHold === 'false') q = q.eq('on_hold', onHold === 'true')

  const { data, error } = await q
  if (error) return apiError('INTERNAL_ERROR', error.message, 500, request)

  const rows = data ?? []
  if (!projectId) return jsonResponse({ data: rows }, 200, request)
  const filtered = rows.filter(
    (p) =>
      p.project_id === projectId ||
      (p.problem_projects ?? []).some((x: { project_id: string }) => x.project_id === projectId)
  )
  return jsonResponse({ data: filtered }, 200, request)
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

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (!title) return apiError('BAD_REQUEST', 'Field "title" is required', 400, request)

  const kind =
    typeof body.kind === 'string' && KINDS.includes(body.kind as (typeof KINDS)[number])
      ? body.kind
      : 'market'
  const projectIds = normalizeProjectIds(body)
  const projCheck = await assertProjectsOwnedByUser(admin, projectIds, userId)
  if (!projCheck.ok) return apiError('BAD_REQUEST', projCheck.message, 400, request)
  const primary = projectIds.length > 0 ? projectIds[0] : null

  let q = admin.from('problems').select('pos').eq('user_id', userId).eq('kind', kind)
  q = primary === null ? q.is('project_id', null) : q.eq('project_id', primary)
  const { data: maxRow } = await q.order('pos', { ascending: false }).limit(1).maybeSingle()
  const nextPos = maxRow?.pos != null ? Number(maxRow.pos) + 1000 : 1000

  const { data: created, error } = await admin
    .from('problems')
    .insert({
      user_id: userId,
      title,
      description: typeof body.description === 'string' ? body.description : null,
      resolved: typeof body.resolved === 'boolean' ? body.resolved : false,
      kind,
      is_high_priority: typeof body.is_high_priority === 'boolean' ? body.is_high_priority : false,
      on_hold: typeof body.on_hold === 'boolean' ? body.on_hold : false,
      on_hold_reason: typeof body.on_hold_reason === 'string' ? body.on_hold_reason : null,
      project_id: primary,
      pos: typeof body.pos === 'number' && Number.isFinite(body.pos) ? body.pos : nextPos,
    })
    .select('id')
    .single()
  if (error || !created) {
    return apiError('INTERNAL_ERROR', error?.message ?? 'Failed to create problem', 500, request)
  }

  if (projectIds.length > 0) {
    const sync = await syncProblemProjectLinks(admin, created.id, userId, projectIds)
    if (!sync.ok) return apiError('INTERNAL_ERROR', sync.message, 500, request)
  }

  const { data: full, error: fullErr } = await admin
    .from('problems')
    .select(problemSelectWithProjects)
    .eq('id', created.id)
    .eq('user_id', userId)
    .maybeSingle()
  if (fullErr || !full) {
    return apiError('INTERNAL_ERROR', fullErr?.message ?? 'Failed to load created problem', 500, request)
  }
  return jsonResponse({ data: full }, 201, request)
}
