import React, { useMemo, useCallback, useEffect, useRef } from 'react'
import { useMicroCompleteToggle } from '@/hooks/useMicroCompleteToggle'
import { burstTaskComplete } from '@/lib/microEffects'
import ModalOverlay from './ModalOverlay'
import { ModalPanel } from './ModalPanel'
import { DBReminder } from '@/lib/planning'
import {
  REMINDER_ADD_LABELS,
  REMINDER_CATEGORIES,
  REMINDER_EMPTY_LABELS,
  REMINDER_PLACEHOLDERS,
  REMINDER_TAB_LABELS,
  normalizeReminderCategory,
  type ReminderCategory,
} from '@/lib/reminderHelpers'

type Reminder = DBReminder

function ReminderRow({
  reminder,
  showEditForm,
  editingReminder,
  onToggleComplete,
  onEditReminder,
  onDeleteReminder,
  onEditingReminderChange,
  onUpdateReminder,
  onCancelEdit,
}: {
  reminder: Reminder
  showEditForm: boolean
  editingReminder: Reminder | null
  onToggleComplete: (reminderId: string) => void
  onEditReminder: (reminder: Reminder) => void
  onDeleteReminder: (reminderId: string, anchorRect?: DOMRect) => void
  onEditingReminderChange: (reminder: Reminder) => void
  onUpdateReminder: () => void
  onCancelEdit: () => void
}) {
  const id = String(reminder.id)
  const onConfirm = useCallback(() => onToggleComplete(id), [onToggleComplete, id])
  const micro = useMicroCompleteToggle({
    completed: reminder.completed,
    onConfirm,
  })
  const rowRef = useRef<HTMLDivElement>(null)
  const completeBurstFiredRef = useRef(false)

  useEffect(() => {
    if (!micro.isCompleting) {
      completeBurstFiredRef.current = false
      return
    }
    if (completeBurstFiredRef.current || !rowRef.current) return
    completeBurstFiredRef.current = true
    burstTaskComplete(rowRef.current.getBoundingClientRect())
  }, [micro.isCompleting])

  return (
    <div
      ref={rowRef}
      className={`flex items-start gap-3 rounded-md bg-gray-50 p-3 transition-shadow ${micro.rowMotionClass}`}
    >
      <input
        type="checkbox"
        checked={micro.displayChecked}
        onChange={micro.toggle}
        disabled={micro.isCompleting}
        className={`mt-1 h-4 w-4 shrink-0 rounded border-primary/35 text-primary focus:ring-primary/35 ${
          micro.isCompleting ? 'motion-check-bounce' : ''
        }`}
        aria-label="Marcar como concluído"
        aria-busy={micro.isCompleting}
      />
      <div className="min-w-0 flex-1">
        {showEditForm && editingReminder && String(editingReminder.id) === id ? (
          <div className="space-y-2">
            <input
              type="text"
              value={editingReminder.title}
              onChange={(e) => onEditingReminderChange({ ...editingReminder, title: e.target.value })}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && onUpdateReminder()}
              autoFocus
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onUpdateReminder}
                className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 motion-icon-press"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={onCancelEdit}
                className="rounded bg-gray-500 px-2 py-1 text-xs text-white hover:bg-gray-600 motion-icon-press"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <span className="min-w-0 flex-1 break-words text-sm text-gray-800">
              {reminder.title?.trim() ? reminder.title : <span className="italic text-gray-400">(Sem título)</span>}
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => onEditReminder(reminder)}
                className="text-xs text-blue-600 hover:text-blue-800 motion-icon-press"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={(e) =>
                  onDeleteReminder(id, (e.currentTarget as HTMLElement).getBoundingClientRect())
                }
                className="text-xs text-red-600 hover:text-red-800 motion-icon-press"
              >
                Excluir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface RemindersModalProps {
  isOpen: boolean
  onClose: () => void
  reminders: Reminder[]
  activeTab: ReminderCategory
  onTabChange: (tab: ReminderCategory) => void
  onToggleComplete: (reminderId: string) => void
  onEditReminder: (reminder: Reminder) => void
  onUpdateReminder: () => void
  onCancelEdit: () => void
  onDeleteReminder: (reminderId: string, anchorRect?: DOMRect) => void
  onShowAddForm: () => void
  onSaveReminder: () => void
  onCancelAdd: () => void
  newReminder: string
  onNewReminderChange: (value: string) => void
  showAddForm: boolean
  showEditForm: boolean
  editingReminder: Reminder | null
  onEditingReminderChange: (reminder: Reminder) => void
}

export function RemindersModal({
  isOpen,
  onClose,
  reminders,
  activeTab,
  onTabChange,
  onToggleComplete,
  onEditReminder,
  onUpdateReminder,
  onCancelEdit,
  onDeleteReminder,
  onShowAddForm,
  onSaveReminder,
  onCancelAdd,
  newReminder,
  onNewReminderChange,
  showAddForm,
  showEditForm,
  editingReminder,
  onEditingReminderChange
}: RemindersModalProps) {
  const remindersInTab = useMemo(
    () => reminders.filter((r) => normalizeReminderCategory(r.category) === activeTab),
    [reminders, activeTab]
  )

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <ModalPanel maxWidthClass="max-w-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Lembretes</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {remindersInTab.length} nesta aba · {reminders.length} no total
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-1">
          {REMINDER_CATEGORIES.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-2 border-blue-500 bg-blue-100 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              {REMINDER_TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Add Button / Form */}
        <div className="mb-6">
          {!showAddForm ? (
            <button
              type="button"
              onClick={onShowAddForm}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
            >
              <span className="text-lg text-gray-400">+</span>
              <span>{REMINDER_ADD_LABELS[activeTab]}</span>
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={newReminder}
                onChange={(e) => onNewReminderChange(e.target.value)}
                placeholder={`Digite o ${REMINDER_PLACEHOLDERS[activeTab]}...`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && onSaveReminder()}
                autoFocus
              />
              <button
                type="button"
                onClick={onSaveReminder}
                disabled={!newReminder.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Adicionar
              </button>
              <button
                type="button"
                onClick={onCancelAdd}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Lista: scroll vertical no ModalPanel quando há muitos itens */}
        <div className="min-h-[5rem] space-y-3">
          {remindersInTab.map((reminder) => (
            <ReminderRow
              key={String(reminder.id)}
              reminder={reminder}
              showEditForm={showEditForm}
              editingReminder={editingReminder}
              onToggleComplete={onToggleComplete}
              onEditReminder={onEditReminder}
              onDeleteReminder={onDeleteReminder}
              onEditingReminderChange={onEditingReminderChange}
              onUpdateReminder={onUpdateReminder}
              onCancelEdit={onCancelEdit}
            />
          ))}
          {remindersInTab.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              <p className="text-sm">
                Nenhum {REMINDER_EMPTY_LABELS[activeTab]} nesta aba.
              </p>
            </div>
          )}
        </div>
      </ModalPanel>
    </ModalOverlay>
  )
}
