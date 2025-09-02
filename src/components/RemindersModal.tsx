import React from 'react'
import ModalOverlay from './ModalOverlay'
import { DBReminder } from '@/lib/planning'

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
  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="relative top-20 mx-auto p-6 w-full max-w-2xl shadow-2xl rounded-xl bg-white border-2 border-gray-100 ring-4 ring-white/50">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Lembretes ({reminders.length})
          </h2>
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
                onKeyPress={(e) => e.key === 'Enter' && onSaveReminder()}
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

        {/* Reminders List */}
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {reminders
            .filter(reminder => reminder.category === activeTab)
            .map((reminder) => (
              <div key={reminder.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 text-blue-600 rounded" 
                  onChange={() => onToggleComplete(reminder.id)}
                />
                <div className="flex-1">
                  {showEditForm && editingReminder?.id === reminder.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editingReminder.title}
                        onChange={(e) => onEditingReminderChange({...editingReminder, title: e.target.value})}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && onUpdateReminder()}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={onUpdateReminder}
                          className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={onCancelEdit}
                          className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{reminder.title}</span>
                      <button
                        onClick={() => onEditReminder(reminder)}
                        className="text-gray-400 hover:text-gray-600 text-xs"
                      >
                        Editar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>

        {/* Empty State */}
        {reminders.filter(reminder => reminder.category === activeTab).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">
              Nenhum {activeTab === 'compras' ? 'item de compra' : activeTab === 'followups' ? 'follow up' : 'lembrete'} encontrado.
            </p>
          </div>
        )}
      </div>
    </ModalOverlay>
  )
}
