import { computeNextPosForColumnTasks } from '@/lib/todoBoardHelpers'
import {
  assertClassificationFields,
  assertStatusMove,
  parseLifeAdminSubtype,
  parseStatusClassification,
  parseTaskType,
  parseTodoStatus,
  TODO_STATUSES,
} from '@/lib/todoApiValidation'
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
  assertTagsOwnedByUser,
  fetchTodoWithProjects,
  syncTodoProjectLinks,
  syncTodoTagLinks,
  todoSelectWithProjects,
} from '@/app/api/todos/todo-sync'

export const dynamic = 'force-dynamic'

const TODO_STATUSES_LIST = TODO_STATUSES
const PRIORITIES = ['low', 'medium', 'high'] as const

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s
  )
}

function normalizeProjectIds(body: Record<string, unknown>): string[] {
  const raw = body.project_ids
  const single = body.project_id
  const ids: string[] = []
  if (Array.isArray(raw)) {
    for (const x of raw) {
      if (typeof x === 'string' && isUuid(x)) ids.push(x)
    }
  }
  if (typeof single === 'string' && isUuid(single)) {
    ids.push(single)
  }
  return [...new Set(ids)]
}

function normalizeTagIds(body: Record<string, unknown>): string[] {
  const raw = body.tag_ids
  const ids: string[] = []
  if (Array.isArray(raw)) {
    for (const x of raw) {
      if (typeof x === 'string' && isUuid(x)) ids.push(x)
    }
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
  const statusFilter = searchParams.get('status')?.trim()
  const projectFilter = searchParams.get('project_id')?.trim()

  if (statusFilter && !TODO_STATUSES_LIST.includes(statusFilter as (typeof TODO_STATUSES_LIST)[number])) {
    return apiError(
      'BAD_REQUEST',
      `Invalid status. Allowed: ${TODO_STATUSES_LIST.join(', ')}`,
      400,
      request
    )
  }

  if (projectFilter && !isUuid(projectFilter)) {
    return apiError('BAD_REQUEST', 'Invalid project_id (must be UUID)', 400, request)
  }

  try {
    if (projectFilter) {
      const { data: links, error: le } = await admin
        .from('todo_projects')
        .select('todo_id')
        .eq('project_id', projectFilter)

      if (le) {
        return apiError('INTERNAL_ERROR', le.message, 500, request)
      }

      const linkedIds = new Set((links ?? []).map((l) => l.todo_id))

      let q = admin
        .from('todos')
        .select(todoSelectWithProjects)
        .eq('user_id', userId)
        .order('pos', { ascending: true })

      if (statusFilter) {
        q = q.eq('status', statusFilter)
      }

      const { data: rows, error } = await q
      if (error) {
        return apiError('INTERNAL_ERROR', error.message, 500, request)
      }

      const filtered = (rows ?? []).filter(
        (t) =>
          t.project_id === projectFilter ||
          linkedIds.has(t.id)
      )

      return jsonResponse({ data: filtered }, 200, request)
    }

    let q = admin
      .from('todos')
      .select(todoSelectWithProjects)
      .eq('user_id', userId)
      .order('pos', { ascending: true })

    if (statusFilter) {
      q = q.eq('status', statusFilter)
    }

    const { data, error } = await q
    if (error) {
      return apiError('INTERNAL_ERROR', error.message, 500, request)
    }

    return jsonResponse({ data: data ?? [] }, 200, request)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return apiError('INTERNAL_ERROR', msg, 500, request)
  }
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

  if ('project_ids' in body && !Array.isArray(body.project_ids)) {
    return apiError(
      'BAD_REQUEST',
      'project_ids must be an array of project UUIDs',
      400,
      request
    )
  }
  if ('tag_ids' in body && !Array.isArray(body.tag_ids)) {
    return apiError(
      'BAD_REQUEST',
      'tag_ids must be an array of tag UUIDs',
      400,
      request
    )
  }

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (!title) {
    return apiError('BAD_REQUEST', 'Field "title" is required', 400, request)
  }

  const status = parseTodoStatus(body.status) ?? 'backlog'

  const taskType = parseTaskType(body.task_type)
  const statusClassification = parseStatusClassification(body.status_classification)
  const lifeAdminSubtype = parseLifeAdminSubtype(body.life_admin_subtype)
  const lifeAdminDeadline =
    typeof body.life_admin_deadline === 'string' ? body.life_admin_deadline : null
  const revisaoEm = typeof body.revisao_em === 'string' ? body.revisao_em : null
  const needsReclassification =
    typeof body.needs_reclassification === 'boolean'
      ? body.needs_reclassification
      : !taskType

  const classRow = {
    task_type: taskType,
    status_classification: statusClassification,
    life_admin_subtype: lifeAdminSubtype,
    life_admin_deadline: lifeAdminDeadline,
    revisao_em: revisaoEm,
    needs_reclassification: needsReclassification,
  }
  const classCheck = assertClassificationFields(classRow)
  if (!classCheck.ok) {
    return apiError('BAD_REQUEST', classCheck.message, 400, request)
  }

  const moveCheck = assertStatusMove(
    {
      ...classRow,
      status: 'backlog',
    },
    status
  )
  if (!moveCheck.ok) {
    return apiError('BAD_REQUEST', moveCheck.message, 400, request)
  }

  const priority =
    typeof body.priority === 'string' && PRIORITIES.includes(body.priority as (typeof PRIORITIES)[number])
      ? body.priority
      : 'medium'

  const projectIds = normalizeProjectIds(body)
  const tagIds = normalizeTagIds(body)
  const projCheck = await assertProjectsOwnedByUser(admin, projectIds, userId)
  if (!projCheck.ok) {
    return apiError('BAD_REQUEST', projCheck.message, 400, request)
  }
  const tagCheck = await assertTagsOwnedByUser(admin, tagIds, userId)
  if (!tagCheck.ok) {
    return apiError('BAD_REQUEST', tagCheck.message, 400, request)
  }

  const { data: colRows, error: colErr } = await admin
    .from('todos')
    .select('pos, on_hold')
    .eq('user_id', userId)
    .eq('status', status)
    .eq('completed', false)

  if (colErr) {
    return apiError('INTERNAL_ERROR', colErr.message, 500, request)
  }

  const nextPos = computeNextPosForColumnTasks(
    (colRows ?? []).map((r) => ({
      pos: Number(r.pos),
      onHold: Boolean(r.on_hold),
    }))
  )

  const insertRow = {
    user_id: userId,
    title,
    description:
      typeof body.description === 'string' ? body.description : null,
    priority,
    category: typeof body.category === 'string' ? body.category : null,
    due_date: typeof body.due_date === 'string' ? body.due_date : null,
    completed: typeof body.completed === 'boolean' ? body.completed : false,
    is_high_priority:
      typeof body.is_high_priority === 'boolean' ? body.is_high_priority : false,
    on_hold: typeof body.on_hold === 'boolean' ? body.on_hold : false,
    on_hold_reason:
      typeof body.on_hold_reason === 'string' ? body.on_hold_reason : null,
    status,
    task_type: taskType,
    status_classification: statusClassification,
    life_admin_subtype: lifeAdminSubtype,
    life_admin_deadline: lifeAdminDeadline,
    revisao_em: revisaoEm,
    needs_reclassification: needsReclassification,
    pos: typeof body.pos === 'number' && Number.isFinite(body.pos) ? body.pos : nextPos,
    project_id: projectIds.length > 0 ? projectIds[0] : null,
    goal_id:
      typeof body.goal_id === 'string' && isUuid(body.goal_id) ? body.goal_id : null,
    initiative_id:
      typeof body.initiative_id === 'string' && isUuid(body.initiative_id)
        ? body.initiative_id
        : null,
  }

  const { data: created, error: insErr } = await admin
    .from('todos')
    .insert(insertRow)
    .select('id')
    .single()

  if (insErr || !created) {
    return apiError(
      'INTERNAL_ERROR',
      insErr?.message ?? 'Failed to create todo',
      500,
      request
    )
  }

  if (projectIds.length > 0) {
    const sync = await syncTodoProjectLinks(admin, created.id, userId, projectIds)
    if (!sync.ok) {
      return apiError('INTERNAL_ERROR', sync.message, 500, request)
    }
  }
  if (tagIds.length > 0) {
    const sync = await syncTodoTagLinks(admin, created.id, userId, tagIds)
    if (!sync.ok) {
      return apiError('INTERNAL_ERROR', sync.message, 500, request)
    }
  }

  const full = await fetchTodoWithProjects(admin, created.id, userId)
  if (full.error || !full.data) {
    return apiError(
      'INTERNAL_ERROR',
      full.error ?? 'Failed to load created todo',
      500,
      request
    )
  }

  return jsonResponse({ data: full.data }, 201, request)
}
