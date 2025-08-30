import React, { useState } from 'react'

interface Project {
  id: string
  name: string
  color: string
}

interface Initiative {
  id: string
  title: string
  completed: boolean
}

interface Goal {
  id: string
  title: string
  description?: string
  projectId: string
  progress: number
  nextSteps?: string
  dueDate?: string
  initiatives: Initiative[]
  created_at: string
  updated_at: string
}

interface GoalDisplayProps {
  goals: Goal[]
  projects: Project[]
  onEditGoal: (goal: Goal) => void
  onUpdateGoalProgress: (goalId: string, progress: number) => Promise<void>
  onToggleInitiative: (goalId: string, initiativeId: string) => Promise<void>
  onEditInitiative: (goalId: string, initiativeId: string, newTitle: string) => Promise<void>
  onDeleteInitiative: (goalId: string, initiativeId: string) => Promise<void>
}

export function GoalDisplay({
  goals,
  projects,
  onEditGoal,
  onUpdateGoalProgress,
  onToggleInitiative,
  onEditInitiative,
  onDeleteInitiative
}: GoalDisplayProps) {
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set())
  const [editingInitiativeId, setEditingInitiativeId] = useState<string | null>(null)
  const [editingInitiativeTitle, setEditingInitiativeTitle] = useState('')

  // Agrupar metas por projeto
  const goalsByProject = goals.reduce((acc, goal) => {
    const project = projects.find(p => p.id === goal.projectId)
    if (!project) return acc
    
    if (!acc[project.id]) {
      acc[project.id] = {
        project,
        goals: []
      }
    }
    acc[project.id].goals.push(goal)
    return acc
  }, {} as Record<string, { project: Project; goals: Goal[] }>)

  const toggleGoalExpansion = (goalId: string) => {
    setExpandedGoals(prev => {
      const newSet = new Set(prev)
      if (newSet.has(goalId)) {
        newSet.delete(goalId)
      } else {
        newSet.add(goalId)
      }
      return newSet
    })
  }

  const handleStartEditInitiative = (initiative: Initiative) => {
    setEditingInitiativeId(initiative.id)
    setEditingInitiativeTitle(initiative.title)
  }

  const handleSaveInitiativeEdit = async (goalId: string, initiativeId: string) => {
    if (!editingInitiativeTitle.trim()) return
    
    try {
      await onEditInitiative(goalId, initiativeId, editingInitiativeTitle.trim())
      setEditingInitiativeId(null)
      setEditingInitiativeTitle('')
    } catch (error) {
      console.error('Erro ao editar iniciativa:', error)
    }
  }

  const handleCancelInitiativeEdit = () => {
    setEditingInitiativeId(null)
    setEditingInitiativeTitle('')
  }

  const handleDeleteInitiative = async (goalId: string, initiativeId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta iniciativa?')) return
    
    try {
      await onDeleteInitiative(goalId, initiativeId)
    } catch (error) {
      console.error('Erro ao deletar iniciativa:', error)
    }
  }

  return (
    <div className="space-y-6">
      {Object.values(goalsByProject).map(({ project, goals: projectGoals }) => (
        <div key={project.id} className="space-y-4">
          {/* Cabeçalho do projeto */}
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            <span className="text-sm font-medium text-gray-900">{project.name}</span>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              {projectGoals.length} meta{projectGoals.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Metas do projeto */}
          <div className="space-y-4 ml-6">
            {projectGoals.map((goal) => (
              <div key={goal.id} className="bg-white rounded-lg shadow border border-gray-200 p-4">
                {/* Cabeçalho da meta */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {goal.title}
                    </h3>
                    
                    {/* Progresso */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sm text-gray-600">Progresso</span>
                      <div className="flex-1 relative">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={goal.progress}
                          onChange={(e) => onUpdateGoalProgress(goal.id, parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div 
                          className="absolute top-0 left-0 h-2 bg-blue-500 rounded-lg pointer-events-none"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-blue-600 min-w-[3rem]">
                        {goal.progress}%
                      </span>
                    </div>
                  </div>

                  {/* Botão de editar */}
                  <button
                    onClick={() => onEditGoal(goal)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    title="Editar meta"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>

                {/* Próximos Passos */}
                {goal.nextSteps && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-sm font-medium text-yellow-800 mb-1">
                      Próximo Passo:
                    </div>
                    <div className="text-sm text-yellow-700">
                      {goal.nextSteps}
                    </div>
                  </div>
                )}

                {/* Iniciativas */}
                <div className="border-t pt-4">
                  <button
                    onClick={() => toggleGoalExpansion(goal.id)}
                    className="flex items-center justify-between w-full text-left mb-3"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      Iniciativas
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {goal.initiatives.filter(i => i.completed).length}/{goal.initiatives.length}
                      </span>
                      <svg 
                        className={`w-4 h-4 text-gray-500 transition-transform ${
                          expandedGoals.has(goal.id) ? 'rotate-180' : ''
                        }`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Lista de iniciativas (expansível) */}
                  {expandedGoals.has(goal.id) && (
                    <div className="space-y-2">
                      {goal.initiatives.map((initiative) => (
                        <div
                          key={initiative.id}
                          className="flex items-center gap-3 p-2 bg-gray-50 rounded border border-gray-200"
                        >
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={initiative.completed}
                            onChange={() => onToggleInitiative(goal.id, initiative.id)}
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
                                    handleSaveInitiativeEdit(goal.id, initiative.id)
                                  }
                                }}
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveInitiativeEdit(goal.id, initiative.id)}
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
                                onClick={() => handleDeleteInitiative(goal.id, initiative.id)}
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
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
