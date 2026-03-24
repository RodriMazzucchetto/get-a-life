import type { DBReminder } from '@/lib/planning'

/** Garante comparação com as abas da UI (evita dados legados com casing/formato diferente). */
export function normalizeReminderCategory(
  raw: string | number | null | undefined
): DBReminder['category'] {
  const s = String(raw ?? '')
    .trim()
    .toLowerCase()
  if (s === 'compras' || s === 'followups' || s === 'lembretes') return s
  if (s === 'follow ups' || s === 'follow-up' || s === 'follow up') return 'followups'
  return 'lembretes'
}

/** Linha segura para o estado React (ids/título/categoria sempre coerentes com a UI). */
export function normalizeReminderRow(r: DBReminder): DBReminder {
  return {
    ...r,
    id: String(r.id),
    title: typeof r.title === 'string' ? r.title : String(r.title ?? ''),
    category: normalizeReminderCategory(r.category as string),
  }
}
