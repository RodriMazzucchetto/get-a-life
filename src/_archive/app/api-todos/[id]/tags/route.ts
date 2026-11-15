import {
  apiError,
  getTaskArchitectUserId,
  jsonResponse,
  optionsResponse,
  requireApiKey,
} from '@/lib/external-api'
import { createAdminClient } from '@/lib/supabase-admin'
import { assertTagsOwnedByUser, syncTodoTagLinks } from '@/app/api/todos/todo-sync'

export const dynamic = 'force-dynamic'

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s
  )
}

async function ensureTodoOwned(admin: ReturnType<typeof createAdminClient>, todoId: string, userId: string) {
  const { data } = await admin
    .from('todos')
    .select('id')
    .eq('id', todoId)
    .eq('user_id', userId)
    .maybeSingle()
  return Boolean(data)
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
  if (!todoId || !isUuid(todoId)) return apiError('BAD_REQUEST', 'Invalid todo id', 400, request)

  let admin
  try {
    admin = createAdminClient()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server configuration error'
    return apiError('CONFIG_ERROR', msg, 503, request)
  }
  if (!(await ensureTodoOwned(admin, todoId, userId))) {
    return apiError('NOT_FOUND', 'Todo not found', 404, request)
  }

  const { data, error } = await admin
    .from('todo_tags')
    .select('tag_id, tags(id, name, color, created_at, updated_at)')
    .eq('todo_id', todoId)

  if (error) return apiError('INTERNAL_ERROR', error.message, 500, request)
  return jsonResponse({ data: data ?? [] }, 200, request)
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = requireApiKey(request)
  if (auth) return auth
  const userOrErr = getTaskArchitectUserId(request)
  if (userOrErr instanceof Response) return userOrErr
  const userId = userOrErr
  const { id: todoId } = await context.params
  if (!todoId || !isUuid(todoId)) return apiError('BAD_REQUEST', 'Invalid todo id', 400, request)

  let admin
  try {
    admin = createAdminClient()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server configuration error'
    return apiError('CONFIG_ERROR', msg, 503, request)
  }
  if (!(await ensureTodoOwned(admin, todoId, userId))) {
    return apiError('NOT_FOUND', 'Todo not found', 404, request)
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return apiError('BAD_REQUEST', 'Invalid JSON body', 400, request)
  }
  if (!Array.isArray(body.tag_ids)) {
    return apiError('BAD_REQUEST', 'tag_ids must be an array of UUIDs', 400, request)
  }
  const tagIds = body.tag_ids.filter((x): x is string => typeof x === 'string' && isUuid(x))
  const check = await assertTagsOwnedByUser(admin, tagIds, userId)
  if (!check.ok) return apiError('BAD_REQUEST', check.message, 400, request)

  const sync = await syncTodoTagLinks(admin, todoId, userId, tagIds)
  if (!sync.ok) return apiError('BAD_REQUEST', sync.message, 400, request)
  return jsonResponse({ data: { todo_id: todoId, tag_ids: tagIds } }, 200, request)
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = requireApiKey(request)
  if (auth) return auth
  const userOrErr = getTaskArchitectUserId(request)
  if (userOrErr instanceof Response) return userOrErr
  const userId = userOrErr
  const { id: todoId } = await context.params
  if (!todoId || !isUuid(todoId)) return apiError('BAD_REQUEST', 'Invalid todo id', 400, request)

  let admin
  try {
    admin = createAdminClient()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server configuration error'
    return apiError('CONFIG_ERROR', msg, 503, request)
  }
  if (!(await ensureTodoOwned(admin, todoId, userId))) {
    return apiError('NOT_FOUND', 'Todo not found', 404, request)
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return apiError('BAD_REQUEST', 'Invalid JSON body', 400, request)
  }
  const tagId = typeof body.tag_id === 'string' ? body.tag_id : ''
  if (!isUuid(tagId)) return apiError('BAD_REQUEST', 'tag_id must be a UUID', 400, request)

  const check = await assertTagsOwnedByUser(admin, [tagId], userId)
  if (!check.ok) return apiError('BAD_REQUEST', check.message, 400, request)

  const { data: existing } = await admin
    .from('todo_tags')
    .select('tag_id')
    .eq('todo_id', todoId)
  const current = new Set((existing ?? []).map((x) => x.tag_id))
  current.add(tagId)
  const sync = await syncTodoTagLinks(admin, todoId, userId, [...current])
  if (!sync.ok) return apiError('BAD_REQUEST', sync.message, 400, request)
  return jsonResponse({ data: { todo_id: todoId, tag_ids: [...current] } }, 200, request)
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
  if (!todoId || !isUuid(todoId)) return apiError('BAD_REQUEST', 'Invalid todo id', 400, request)

  let admin
  try {
    admin = createAdminClient()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server configuration error'
    return apiError('CONFIG_ERROR', msg, 503, request)
  }
  if (!(await ensureTodoOwned(admin, todoId, userId))) {
    return apiError('NOT_FOUND', 'Todo not found', 404, request)
  }

  const { searchParams } = new URL(request.url)
  const queryTagId = searchParams.get('tag_id')
  let bodyTagId: string | null = null
  try {
    const body = (await request.json()) as Record<string, unknown>
    if (typeof body.tag_id === 'string') bodyTagId = body.tag_id
  } catch {
    // body opcional
  }
  const tagId = (bodyTagId ?? queryTagId ?? '').trim()
  if (!isUuid(tagId)) return apiError('BAD_REQUEST', 'tag_id must be a UUID', 400, request)

  const { data: existing } = await admin
    .from('todo_tags')
    .select('tag_id')
    .eq('todo_id', todoId)
  const remaining = (existing ?? []).map((x) => x.tag_id).filter((x) => x !== tagId)
  const sync = await syncTodoTagLinks(admin, todoId, userId, remaining)
  if (!sync.ok) return apiError('BAD_REQUEST', sync.message, 400, request)
  return jsonResponse({ data: { todo_id: todoId, tag_ids: remaining } }, 200, request)
}
