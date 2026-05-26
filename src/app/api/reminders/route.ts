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
const CATEGORIES = ['compras', 'followups', 'lembretes', 'escrever'] as const

function normalizeTabToCategory(tab: string | null): string | null {
  if (!tab) return null
  const t = tab.trim().toLowerCase()
  if (t === 'compras' || t === 'shopping') return 'compras'
  if (t === 'followups' || t === 'followup') return 'followups'
  if (t === 'lembretes' || t === 'reminders') return 'lembretes'
  if (
    t === 'escrever' ||
    t === 'writing' ||
    t === 'coisas para escrever sobre' ||
    t === 'coisas_para_escrever'
  ) {
    return 'escrever'
  }
  return null
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
  const includeCompleted = searchParams.get('include_completed') === 'true'
  const categoryFilter = searchParams.get('category')?.trim() ?? null
  const tabFilter = normalizeTabToCategory(searchParams.get('tab'))

  if (categoryFilter && !CATEGORIES.includes(categoryFilter as (typeof CATEGORIES)[number])) {
    return apiError(
      'BAD_REQUEST',
      `Invalid category. Allowed: ${CATEGORIES.join(', ')}`,
      400,
      request
    )
  }
  if (searchParams.get('tab') && !tabFilter) {
    return apiError(
      'BAD_REQUEST',
      'Invalid tab. Allowed: compras|shopping, followups|followup, lembretes|reminders, escrever|writing',
      400,
      request
    )
  }

  let q = admin
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (!includeCompleted) q = q.eq('completed', false)
  if (categoryFilter) q = q.eq('category', categoryFilter)
  else if (tabFilter) q = q.eq('category', tabFilter)

  const { data, error } = await q
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

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (!title) return apiError('BAD_REQUEST', 'Field "title" is required', 400, request)

  const priority =
    typeof body.priority === 'string' && PRIORITIES.includes(body.priority as (typeof PRIORITIES)[number])
      ? body.priority
      : 'medium'
  const category =
    typeof body.category === 'string' &&
    CATEGORIES.includes(body.category as (typeof CATEGORIES)[number])
      ? body.category
      : 'lembretes'

  const completed = typeof body.completed === 'boolean' ? body.completed : false

  const { data, error } = await admin
    .from('reminders')
    .insert({
      user_id: userId,
      title,
      description: typeof body.description === 'string' ? body.description : null,
      due_date: typeof body.due_date === 'string' ? body.due_date : null,
      priority,
      category,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .select('*')
    .single()

  if (error) return apiError('INTERNAL_ERROR', error.message, 500, request)
  return jsonResponse({ data }, 201, request)
}
