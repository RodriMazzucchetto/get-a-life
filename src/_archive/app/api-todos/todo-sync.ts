import type { SupabaseClient } from '@supabase/supabase-js'

const todoSelectWithProjects = '*, todo_projects(project_id), todo_tags(tag_id)' as const

export async function assertProjectsOwnedByUser(
  admin: SupabaseClient,
  projectIds: string[],
  userId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (projectIds.length === 0) return { ok: true }
  const { data, error } = await admin
    .from('projects')
    .select('id')
    .eq('user_id', userId)
    .in('id', projectIds)

  if (error) {
    return { ok: false, message: error.message }
  }
  const found = new Set((data ?? []).map((r) => r.id))
  for (const id of projectIds) {
    if (!found.has(id)) {
      return { ok: false, message: `Project not found or not owned: ${id}` }
    }
  }
  return { ok: true }
}

export async function syncTodoProjectLinks(
  admin: SupabaseClient,
  todoId: string,
  userId: string,
  projectIds: string[]
): Promise<{ ok: true } | { ok: false; message: string }> {
  const uniqueIds = [...new Set(projectIds)]
  const check = await assertProjectsOwnedByUser(admin, uniqueIds, userId)
  if (!check.ok) return check

  await admin.from('todo_projects').delete().eq('todo_id', todoId)

  if (uniqueIds.length > 0) {
    const { error: insErr } = await admin.from('todo_projects').insert(
      uniqueIds.map((project_id) => ({ todo_id: todoId, project_id }))
    )
    if (insErr) {
      return { ok: false, message: insErr.message }
    }
  }

  const primary = uniqueIds.length > 0 ? uniqueIds[0] : null
  const { error: upErr } = await admin
    .from('todos')
    .update({
      project_id: primary,
      updated_at: new Date().toISOString(),
    })
    .eq('id', todoId)
    .eq('user_id', userId)

  if (upErr) {
    return { ok: false, message: upErr.message }
  }
  return { ok: true }
}

export async function assertTagsOwnedByUser(
  admin: SupabaseClient,
  tagIds: string[],
  userId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (tagIds.length === 0) return { ok: true }
  const { data, error } = await admin
    .from('tags')
    .select('id')
    .eq('user_id', userId)
    .in('id', tagIds)

  if (error) return { ok: false, message: error.message }

  const found = new Set((data ?? []).map((r) => r.id))
  for (const id of tagIds) {
    if (!found.has(id)) {
      return { ok: false, message: `Tag not found or not owned: ${id}` }
    }
  }
  return { ok: true }
}

export async function syncTodoTagLinks(
  admin: SupabaseClient,
  todoId: string,
  userId: string,
  tagIds: string[]
): Promise<{ ok: true } | { ok: false; message: string }> {
  const uniqueIds = [...new Set(tagIds)]
  const check = await assertTagsOwnedByUser(admin, uniqueIds, userId)
  if (!check.ok) return check

  await admin.from('todo_tags').delete().eq('todo_id', todoId)

  if (uniqueIds.length > 0) {
    const { error } = await admin
      .from('todo_tags')
      .insert(uniqueIds.map((tag_id) => ({ todo_id: todoId, tag_id })))
    if (error) return { ok: false, message: error.message }
  }
  return { ok: true }
}

export async function fetchTodoWithProjects(
  admin: SupabaseClient,
  todoId: string,
  userId: string
) {
  const { data, error } = await admin
    .from('todos')
    .select(todoSelectWithProjects)
    .eq('id', todoId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) return { error: error.message, data: null }
  return { data, error: null }
}

export { todoSelectWithProjects }
