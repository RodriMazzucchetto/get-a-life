import type { SupabaseClient } from '@supabase/supabase-js'

export const problemSelectWithProjects = '*, problem_projects(project_id)' as const

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

  if (error) return { ok: false, message: error.message }
  const found = new Set((data ?? []).map((r) => r.id))
  for (const id of projectIds) {
    if (!found.has(id)) return { ok: false, message: `Project not found or not owned: ${id}` }
  }
  return { ok: true }
}

export async function syncProblemProjectLinks(
  admin: SupabaseClient,
  problemId: string,
  userId: string,
  projectIds: string[]
): Promise<{ ok: true } | { ok: false; message: string }> {
  const uniqueIds = [...new Set(projectIds)]
  const check = await assertProjectsOwnedByUser(admin, uniqueIds, userId)
  if (!check.ok) return check

  const { data: current, error: currentErr } = await admin
    .from('problems')
    .select('kind, project_id')
    .eq('id', problemId)
    .eq('user_id', userId)
    .maybeSingle()
  if (currentErr || !current) {
    return { ok: false, message: currentErr?.message ?? 'Problem not found' }
  }

  await admin.from('problem_projects').delete().eq('problem_id', problemId)

  if (uniqueIds.length > 0) {
    const { error: insErr } = await admin.from('problem_projects').insert(
      uniqueIds.map((project_id) => ({ problem_id: problemId, project_id }))
    )
    if (insErr) return { ok: false, message: insErr.message }
  }

  const primary = uniqueIds.length > 0 ? uniqueIds[0] : null
  let nextPos: number | undefined
  if (primary !== current.project_id) {
    let q = admin
      .from('problems')
      .select('pos')
      .eq('user_id', userId)
      .eq('kind', current.kind)
    q = primary === null ? q.is('project_id', null) : q.eq('project_id', primary)
    const { data: maxRow } = await q.order('pos', { ascending: false }).limit(1).maybeSingle()
    nextPos = maxRow?.pos != null ? Number(maxRow.pos) + 1000 : 1000
  }

  const { error: upErr } = await admin
    .from('problems')
    .update({
      project_id: primary,
      ...(nextPos != null ? { pos: nextPos } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', problemId)
    .eq('user_id', userId)

  if (upErr) return { ok: false, message: upErr.message }
  return { ok: true }
}
