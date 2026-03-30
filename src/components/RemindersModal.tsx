import React, { useMemo } from 'react'
import ModalOverlay from './ModalOverlay'
import { DBReminder } from '@/lib/planning'
import { normalizeReminderCategory } from '@/lib/reminderHelpers'

type Reminder = DBReminder

interface RemindersModalProps {
  isOpen: boolean
  onClose: () => void
  reminders: Reminder[]
  activeTab: 'compras' | 'followups' | 'lembretes'
  onTabChange: (tab: 'compras' | 'followups' | 'lembretes') => void
  onToggleComplete: (reminderId: string) => void
  onEditReminder: (reminder: Reminder) => void
  onUpdateReminder: () => void
  onCancelEdit: () => void
  onDeleteReminder: (reminderId: string) => void
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
      <div className="mx-auto w-full max-w-2xl rounded-xl border-2 border-gray-100 bg-white p-6 shadow-2xl ring-4 ring-white/50">
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
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => onTabChange('compras')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'compras'
                ? 'text-blue-600 bg-blue-100 border-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            Compras
          </button>
          <button
            onClick={() => onTabChange('followups')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'followups'
                ? 'text-blue-600 bg-blue-100 border-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            Follow Ups
          </button>
          <button
            onClick={() => onTabChange('lembretes')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'lembretes'
                ? 'text-blue-600 bg-blue-100 border-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            Lembretes
          </button>
        </div>

        {/* Add Button / Form */}
        <div className="mb-6">
          {!showAddForm ? (
            <button
              onClick={onShowAddForm}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
            >
              <span className="text-lg text-gray-400">+</span>
              <span>
                {activeTab === 'compras' && 'Adicionar compra'}
                {activeTab === 'followups' && 'Adicionar follow up'}
                {activeTab === 'lembretes' && 'Adicionar lembrete'}
              </span>
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={newReminder}
                onChange={(e) => onNewReminderChange(e.target.value)}
                placeholder={`Digite o ${activeTab === 'compras' ? 'item de compra' : activeTab === 'followups' ? 'follow up' : 'lembrete'}...`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && onSaveReminder()}
                autoFocus
              />
              <button
                onClick={onSaveReminder}
                disabled={!newReminder.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Adicionar
              </button>
              <button
                onClick={onCancelAdd}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Lista: sem max-height aqui — o scroll fica no content do ModalOverlay (evita ~6 linhas visíveis + scroll aninhado). */}
        <div className="min-h-[5rem] space-y-3">
          {remindersInTab.map((reminder) => (
              <div key={String(reminder.id)} className="flex items-start gap-3 rounded-md bg-gray-50 p-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0 rounded text-blue-600"
                  aria-label="Marcar como concluído"
                  onChange={() => onToggleComplete(String(reminder.id))}
                />
                <div className="min-w-0 flex-1">
                  {showEditForm && editingReminder && String(editingReminder.id) === String(reminder.id) ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editingReminder.title}
                        onChange={(e) => onEditingReminderChange({...editingReminder, title: e.target.value})}
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        onKeyDown={(e) => e.key === 'Enter' && onUpdateReminder()}
                        autoFocus
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={onUpdateReminder}
                          className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={onCancelEdit}
                          className="rounded bg-gray-500 px-2 py-1 text-xs text-white hover:bg-gray-600"
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
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteReminder(String(reminder.id))}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          {remindersInTab.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              <p className="text-sm">
                Nenhum{' '}
                {activeTab === 'compras'
                  ? 'item de compra'
                  : activeTab === 'followups'
                    ? 'follow up'
                    : 'lembrete'}{' '}
                nesta aba.
              </p>
            </div>
          )}
        </div>
      </div>
    </ModalOverlay>
  )
}
