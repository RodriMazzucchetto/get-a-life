import type { DBReminder } from '@/lib/planning'

/** Garante comparação com as abas da UI (evita dados legados com casing/formato diferente). */
export function normalizeReminderCategory(
  raw: string | null | undefined
): DBReminder['category'] {
  const s = (raw ?? '').trim().toLowerCase()
  if (s === 'compras' || s === 'followups' || s === 'lembretes') return s
  if (s === 'follow ups' || s === 'follow-up' || s === 'follow up') return 'followups'
  return 'lembretes'
}
