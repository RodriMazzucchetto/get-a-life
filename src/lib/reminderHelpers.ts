import type { DBReminder } from '@/lib/planning'

export const REMINDER_CATEGORIES = ['compras', 'followups', 'lembretes', 'escrever'] as const
export type ReminderCategory = (typeof REMINDER_CATEGORIES)[number]

export const REMINDER_TAB_LABELS: Record<ReminderCategory, string> = {
  compras: 'Compras',
  followups: 'Follow Ups',
  lembretes: 'Lembretes',
  escrever: 'Coisas para escrever sobre',
}

export const REMINDER_ADD_LABELS: Record<ReminderCategory, string> = {
  compras: 'Adicionar compra',
  followups: 'Adicionar follow up',
  lembretes: 'Adicionar lembrete',
  escrever: 'Adicionar tema para escrever',
}

export const REMINDER_EMPTY_LABELS: Record<ReminderCategory, string> = {
  compras: 'item de compra',
  followups: 'follow up',
  lembretes: 'lembrete',
  escrever: 'tema para escrever',
}

export const REMINDER_PLACEHOLDERS: Record<ReminderCategory, string> = {
  compras: 'item de compra',
  followups: 'follow up',
  lembretes: 'lembrete',
  escrever: 'tema para escrever',
}

/** Garante comparação com as abas da UI (evita dados legados com casing/formato diferente). */
export function normalizeReminderCategory(
  raw: string | number | null | undefined
): ReminderCategory {
  const s = String(raw ?? '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .toLowerCase()
  if (
    s === 'compras' ||
    s === 'followups' ||
    s === 'lembretes' ||
    s === 'escrever'
  ) {
    return s
  }
  if (s === 'follow ups' || s === 'follow-up' || s === 'follow up') return 'followups'
  if (
    s === 'coisas para escrever sobre' ||
    s === 'coisas para escrever' ||
    s === 'escrever sobre' ||
    s === 'writing'
  ) {
    return 'escrever'
  }
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
