import React, { useState, useEffect } from 'react'
import ModalOverlay from './ModalOverlay'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Goal, Project, SimpleInitiative } from '@/lib/planning'

interface GoalManagementModalProps {
  isOpen: boolean
  onClose: () => void
  goal?: Goal | null
  projects: Project[]
  onCreateGoal: (goalData: Omit<Goal, 'id' | 'created_at' | 'updated_at'>) => Promise<Goal | null>
  onUpdateGoal: (id: string, updates: Partial<Goal>) => Promise<Goal | null>
  onDeleteGoal: (id: string) => Promise<boolean>
}

export function GoalManagementModal({
  isOpen,
  onClose,
  goal,
  projects,
  onCreateGoal,
  onUpdateGoal,
  onDeleteGoal
}: GoalManagementModalProps) {
  const isEditing = !!goal

  // Estados do formulário
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState('')
  const [progress, setProgress] = useState(0)
  const [nextSteps, setNextSteps] = useState('')
  const [dueDate, setDueDate] = useState<Date | null>(null)
  const [initiatives, setInitiatives] = useState<SimpleInitiative[]>([])
  const [newInitiativeTitle, setNewInitiativeTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estados para iniciativas
  const [editingInitiativeId, setEditingInitiativeId] = useState<string | null>(null)
  const [editingInitiativeTitle, setEditingInitiativeTitle] = useState('')

  // Resetar formulário quando modal abrir/fechar
  useEffect(() => {
    if (isOpen) {
      if (goal) {
        // Modo de edição
        setTitle(goal.title)
        setDescription(goal.description || '')
        setProjectId(goal.projectId)
        setProgress(goal.progress)
        setNextSteps(goal.nextSteps || '')
        setDueDate(goal.dueDate ? new Date(goal.dueDate) : null)
        setInitiatives(goal.initiatives || [])
      } else {
        // Modo de criação
        setTitle('')
        setDescription('')
        setProjectId('')
        setProgress(0)
        setNextSteps('')
        setDueDate(null)
        setInitiatives([])
      }
      setNewInitiativeTitle('')
      setEditingInitiativeId(null)
      setEditingInitiativeTitle('')
    }
  }, [isOpen, goal])

  // Função para salvar meta
  const handleSave = async () => {
    if (!title.trim() || !projectId) return

    setIsSubmitting(true)
    try {
      const goalData = {
        title: title.trim(),
        description: description.trim(),
        projectId,
        progress,
        nextSteps: nextSteps.trim() || undefined,
        dueDate: dueDate ? dueDate.toISOString() : undefined,
        initiatives
      }

      if (isEditing && goal) {
        await onUpdateGoal(goal.id, goalData)
      } else {
        await onCreateGoal(goalData)
      }
      
      onClose()
    } catch (error) {
      console.error('Erro ao salvar meta:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Função para deletar meta
  const handleDelete = async () => {
    if (!goal) return
    
    if (!confirm('Tem certeza que deseja deletar esta meta? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      await onDeleteGoal(goal.id)
      onClose()
    } catch (error) {
      console.error('Erro ao deletar meta:', error)
    }
  }

  // Funções para gerenciar iniciativas
  const handleAddInitiative = () => {
    if (!newInitiativeTitle.trim()) return

    const newInitiative: SimpleInitiative = {
      id: `temp-${Date.now()}`,
      title: newInitiativeTitle.trim(),
      completed: false
    }

    setInitiatives([...initiatives, newInitiative])
    setNewInitiativeTitle('')
  }

  const handleToggleInitiative = (initiativeId: string) => {
    setInitiatives(prev => prev.map(i => 
      i.id === initiativeId ? { ...i, completed: !i.completed } : i
    ))
  }

  const handleStartEditInitiative = (initiative: SimpleInitiative) => {
    setEditingInitiativeId(initiative.id)
    setEditingInitiativeTitle(initiative.title)
  }

  const handleSaveInitiativeEdit = () => {
    if (!editingInitiativeId || !editingInitiativeTitle.trim()) return

    setInitiatives(prev => prev.map(i => 
      i.id === editingInitiativeId 
        ? { ...i, title: editingInitiativeTitle.trim() }
        : i
    ))
    setEditingInitiativeId(null)
    setEditingInitiativeTitle('')
  }

  const handleCancelInitiativeEdit = () => {
    setEditingInitiativeId(null)
    setEditingInitiativeTitle('')
  }

  const handleDeleteInitiative = (initiativeId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta iniciativa?')) return
    
    setInitiatives(prev => prev.filter(i => i.id !== initiativeId))
  }

  const selectedProject = projects.find(p => p.id === projectId)

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="relative top-20 mx-auto p-6 w-full max-w-4xl shadow-2xl rounded-xl bg-white border-2 border-gray-100 ring-4 ring-white/50">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Meta' : 'Criar Nova Meta'}
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

        <div className="space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título da Meta *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título da meta"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva sua meta (opcional)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Projeto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Projeto *
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Selecione um projeto</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Progresso */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Progresso: {progress}%
            </label>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div 
                className="absolute top-0 left-0 h-2 bg-blue-500 rounded-lg pointer-events-none"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Próximos Passos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Próximos Passos
            </label>
            <textarea
              value={nextSteps}
              onChange={(e) => setNextSteps(e.target.value)}
              placeholder="Descreva os próximos passos para alcançar esta meta (opcional)"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Data Limite */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Limite
            </label>
            <DatePicker
              selected={dueDate}
              onChange={(date: Date | null) => setDueDate(date)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholderText="Selecionar data limite"
              dateFormat="dd/MM/yyyy"
              isClearable
              showYearDropdown
              scrollableYearDropdown
              yearDropdownItemNumber={15}
              locale="pt-BR"
              minDate={new Date()}
            />
          </div>

          {/* Iniciativas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Iniciativas ({initiatives.length})
            </label>
            
            {/* Lista de iniciativas */}
            <div className="space-y-2 mb-4">
              {initiatives.map((initiative) => (
                <div
                  key={initiative.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={initiative.completed}
                    onChange={() => handleToggleInitiative(initiative.id)}
                    className="w-4 h-4 text-blue-600 border border-blue-300 rounded focus:ring-blue-500"
                  />
                  
                  {/* Título da iniciativa */}
                  {editingInitiativeId === initiative.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingInitiativeTitle}
                        onChange={(e) => setEditingInitiativeTitle(e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveInitiativeEdit()
                          }
                        }}
                        autoFocus
                      />
                      <button
                        onClick={handleSaveInitiativeEdit}
                        className="p-1 text-green-600 hover:text-green-700"
                        title="Salvar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={handleCancelInitiativeEdit}
                        className="p-1 text-gray-600 hover:text-gray-700"
                        title="Cancelar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-1">
                      <span className={`text-sm ${initiative.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {initiative.title}
                      </span>
                      <button
                        onClick={() => handleStartEditInitiative(initiative)}
                        className="p-1 text-blue-600 hover:text-blue-700"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteInitiative(initiative.id)}
                        className="p-1 text-red-600 hover:text-red-700"
                        title="Deletar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Adicionar nova iniciativa */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newInitiativeTitle}
                onChange={(e) => setNewInitiativeTitle(e.target.value)}
                placeholder="Digite o título da nova iniciativa"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddInitiative()
                  }
                }}
              />
              <button
                onClick={handleAddInitiative}
                disabled={!newInitiativeTitle.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex justify-between gap-3 pt-6 border-t">
            {isEditing && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Excluir Meta
              </button>
            )}
            
            <div className="flex gap-3 ml-auto">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!title.trim() || !projectId || isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Meta')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalOverlay>
  )
}
