import {
  apiError,
  getTaskArchitectUserId,
  jsonResponse,
  optionsResponse,
  requireApiKey,
} from '@/lib/external-api'
import { createAdminClient } from '@/lib/supabase-admin'
import {
  assertTagsOwnedByUser,
  fetchTodoWithProjects,
  syncTodoProjectLinks,
  syncTodoTagLinks,
  todoSelectWithProjects,
} from '@/app/api/todos/todo-sync'

export const dynamic = 'force-dynamic'

import {
  assertClassificationFields,
  assertStatusMove,
  parseLifeAdminSubtype,
  parseStatusClassification,
  parseTaskType,
  parseTodoStatus,
} from '@/lib/todoApiValidation'
import type {
  LifeAdminSubtype,
  StatusClassification,
  TaskType,
} from '@/lib/taskClassification'

const PRIORITIES = ['low', 'medium', 'high'] as const

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s
  )
}

/** null = não alterar projetos; [] = limpar vínculos */
function normalizeProjectIdsPatch(body: Record<string, unknown>): string[] | null {
  if (!('project_ids' in body) && !('project_id' in body)) {
    return null
  }
  if ('project_ids' in body && Array.isArray(body.project_ids)) {
    const ids: string[] = []
    for (const x of body.project_ids) {
      if (typeof x === 'string' && isUuid(x)) ids.push(x)
    }
    return [...new Set(ids)]
  }
  if ('project_id' in body) {
    if (body.project_id === null) return []
    if (typeof body.project_id === 'string' && isUuid(body.project_id)) {
      return [body.project_id]
    }
  }
  return []
}

function normalizeTagIdsPatch(body: Record<string, unknown>): string[] | null {
  if (!('tag_ids' in body)) return null
  if (!Array.isArray(body.tag_ids)) return []
  const ids: string[] = []
  for (const x of body.tag_ids) {
    if (typeof x === 'string' && isUuid(x)) ids.push(x)
  }
  return [...new Set(ids)]
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

  const { id: todoId } = await context.params
  if (!todoId || !isUuid(todoId)) {
    return apiError('BAD_REQUEST', 'Invalid todo id', 400, request)
  }

  let admin
  try {
    admin = createAdminClient()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server configuration error'
    return apiError('CONFIG_ERROR', msg, 503, request)
  }
  const { data, error } = await admin
    .from('todos')
    .select(todoSelectWithProjects)
    .eq('id', todoId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return apiError('INTERNAL_ERROR', error.message, 500, request)
  if (!data) return apiError('NOT_FOUND', 'Todo not found', 404, request)
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

  const { id: todoId } = await context.params
  if (!todoId || !isUuid(todoId)) {
    return apiError('BAD_REQUEST', 'Invalid todo id', 400, request)
  }

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
    return apiError('BAD_REQUEST', 'tag_ids must be an array of tag UUIDs', 400, request)
  }

  const { data: existing, error: exErr } = await admin
    .from('todos')
    .select(
      'id, task_type, status_classification, life_admin_subtype, life_admin_deadline, revisao_em, needs_reclassification, status'
    )
    .eq('id', todoId)
    .eq('user_id', userId)
    .maybeSingle()

  if (exErr) {
    return apiError('INTERNAL_ERROR', exErr.message, 500, request)
  }
  if (!existing) {
    return apiError('NOT_FOUND', 'Todo not found', 404, request)
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (typeof body.title === 'string') updates.title = body.title.trim()
  if (typeof body.description === 'string' || body.description === null) {
    updates.description = body.description
  }
  if (
    typeof body.priority === 'string' &&
    PRIORITIES.includes(body.priority as (typeof PRIORITIES)[number])
  ) {
    updates.priority = body.priority
  }
  if (typeof body.category === 'string' || body.category === null) {
    updates.category = body.category
  }
  if (typeof body.due_date === 'string' || body.due_date === null) {
    updates.due_date = body.due_date
  }
  if (typeof body.completed === 'boolean') {
    updates.completed = body.completed
  }
  if (typeof body.is_high_priority === 'boolean') {
    updates.is_high_priority = body.is_high_priority
  }
  if (typeof body.on_hold === 'boolean') {
    updates.on_hold = body.on_hold
  }
  if (typeof body.on_hold_reason === 'string' || body.on_hold_reason === null) {
    updates.on_hold_reason = body.on_hold_reason
  }
  if ('task_type' in body) {
    updates.task_type = parseTaskType(body.task_type)
  }
  if ('status_classification' in body) {
    updates.status_classification = parseStatusClassification(body.status_classification)
  }
  if ('life_admin_subtype' in body) {
    updates.life_admin_subtype = parseLifeAdminSubtype(body.life_admin_subtype)
  }
  if (typeof body.life_admin_deadline === 'string' || body.life_admin_deadline === null) {
    updates.life_admin_deadline = body.life_admin_deadline
  }
  if (typeof body.revisao_em === 'string' || body.revisao_em === null) {
    updates.revisao_em = body.revisao_em
  }
  if (typeof body.needs_reclassification === 'boolean') {
    updates.needs_reclassification = body.needs_reclassification
  }
  const nextStatus = parseTodoStatus(body.status)
  if (nextStatus) {
    updates.status = nextStatus
  }
  if (typeof body.pos === 'number' && Number.isFinite(body.pos)) {
    updates.pos = body.pos
  }
  if (typeof body.goal_id === 'string' && isUuid(body.goal_id)) {
    updates.goal_id = body.goal_id
  }
  if (body.goal_id === null) {
    updates.goal_id = null
  }
  if (typeof body.initiative_id === 'string' && isUuid(body.initiative_id)) {
    updates.initiative_id = body.initiative_id
  }
  if (body.initiative_id === null) {
    updates.initiative_id = null
  }
  if (typeof body.project_id === 'string' && isUuid(body.project_id)) {
    updates.project_id = body.project_id
  }
  if (body.project_id === null) {
    updates.project_id = null
  }

  const projectIdsPatch = normalizeProjectIdsPatch(body)
  const tagIdsPatch = normalizeTagIdsPatch(body)
  if (projectIdsPatch !== null) {
    delete updates.project_id
  }

  const merged = {
    task_type:
      'task_type' in updates
        ? (updates.task_type as TaskType | null)
        : existing.task_type,
    status_classification:
      'status_classification' in updates
        ? (updates.status_classification as StatusClassification | null)
        : existing.status_classification,
    life_admin_subtype:
      'life_admin_subtype' in updates
        ? (updates.life_admin_subtype as LifeAdminSubtype | null)
        : existing.life_admin_subtype,
    life_admin_deadline:
      'life_admin_deadline' in updates
        ? (updates.life_admin_deadline as string | null)
        : existing.life_admin_deadline,
    revisao_em:
      'revisao_em' in updates
        ? (updates.revisao_em as string | null)
        : existing.revisao_em,
    needs_reclassification:
      'needs_reclassification' in updates
        ? Boolean(updates.needs_reclassification)
        : Boolean(existing.needs_reclassification),
    status: nextStatus ?? existing.status,
  }

  const classCheck = assertClassificationFields(merged)
  if (!classCheck.ok) {
    return apiError('BAD_REQUEST', classCheck.message, 400, request)
  }

  if (nextStatus) {
    const moveCheck = assertStatusMove(existing, nextStatus)
    if (!moveCheck.ok) {
      return apiError('BAD_REQUEST', moveCheck.message, 400, request)
    }
  }

  const keysToWrite = Object.keys(updates).filter((k) => k !== 'updated_at')
  if (keysToWrite.length === 0 && projectIdsPatch === null && tagIdsPatch === null) {
    return apiError(
      'BAD_REQUEST',
      'No valid fields to update',
      400,
      request
    )
  }

  if (keysToWrite.length > 0) {
    const { error: upErr } = await admin
      .from('todos')
      .update(updates)
      .eq('id', todoId)
      .eq('user_id', userId)

    if (upErr) {
      return apiError('INTERNAL_ERROR', upErr.message, 500, request)
    }
  }

  if (projectIdsPatch !== null) {
    const sync = await syncTodoProjectLinks(admin, todoId, userId, projectIdsPatch)
    if (!sync.ok) {
      return apiError('BAD_REQUEST', sync.message, 400, request)
    }
  }
  if (tagIdsPatch !== null) {
    const check = await assertTagsOwnedByUser(admin, tagIdsPatch, userId)
    if (!check.ok) return apiError('BAD_REQUEST', check.message, 400, request)
    const sync = await syncTodoTagLinks(admin, todoId, userId, tagIdsPatch)
    if (!sync.ok) return apiError('BAD_REQUEST', sync.message, 400, request)
  }

  const { data, error } = await admin
    .from('todos')
    .select(todoSelectWithProjects)
    .eq('id', todoId)
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return apiError(
      'INTERNAL_ERROR',
      error?.message ?? 'Failed to load todo',
      500,
      request
    )
  }

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

  const { id: todoId } = await context.params
  if (!todoId || !isUuid(todoId)) {
    return apiError('BAD_REQUEST', 'Invalid todo id', 400, request)
  }

  let admin
  try {
    admin = createAdminClient()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server configuration error'
    return apiError('CONFIG_ERROR', msg, 503, request)
  }
  const { data: existing } = await admin
    .from('todos')
    .select('id')
    .eq('id', todoId)
    .eq('user_id', userId)
    .maybeSingle()
  if (!existing) return apiError('NOT_FOUND', 'Todo not found', 404, request)

  const { error } = await admin.from('todos').delete().eq('id', todoId).eq('user_id', userId)
  if (error) return apiError('INTERNAL_ERROR', error.message, 500, request)
  return jsonResponse({ data: { id: todoId, deleted: true } }, 200, request)
}
