


import React, { useState } from 'react'
import { Goal, Project, SimpleInitiative } from '@/lib/planning'

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

  const handleStartEditInitiative = (initiative: SimpleInitiative) => {
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

  // Função para obter a cor da barra de progresso baseada no valor
  const getProgressColor = (progress: number) => {
    if (progress <= 25) return 'bg-red-500'
    if (progress <= 50) return 'bg-orange-500'
    if (progress <= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  // Função para obter a cor do texto da porcentagem
  const getProgressTextColor = (progress: number) => {
    if (progress <= 25) return 'text-red-600'
    if (progress <= 50) return 'text-orange-600'
    if (progress <= 75) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="space-y-6">
      {Object.values(goalsByProject).map(({ project, goals: projectGoals }) => (
        <div key={project.id} className="space-y-4">
          {/* Cabeçalho do projeto com destaque */}
          <div className="flex items-center gap-2 mb-3">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            <h2 className="text-lg font-semibold text-gray-900">{project.name}</h2>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
              {projectGoals.length} meta{projectGoals.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Metas do projeto */}
          <div className="space-y-4">
            {projectGoals.map((goal) => (
              <div 
                key={goal.id} 
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md hover:shadow-blue-100/30 transition-all duration-200 group"
              >
                {/* Cabeçalho da meta - CLICÁVEL para abrir modal */}
                <div 
                  className="flex justify-between items-start mb-4 cursor-pointer"
                  onClick={() => onEditGoal(goal)}
                  title="Clique para editar a meta"
                >
                  <div className="flex-1">
                    {/* Categoria e título */}
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="text-xs text-gray-500">{project.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                        {goal.title}
                      </h3>
                      <span title="Clique para editar">
                        <svg 
                          className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors duration-200 opacity-0 group-hover:opacity-100" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </span>
                    </div>
                    
                    {/* Progresso com barra única e cores dinâmicas */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Progresso</span>
                        <span className={`text-sm font-semibold ${getProgressTextColor(goal.progress)}`}>
                          {goal.progress}%
                        </span>
                      </div>
                      
                      {/* Slider interativo - clicável e arrastável */}
                      <div className="relative">
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden cursor-pointer">
                          <div 
                            className={`h-full ${getProgressColor(goal.progress)} rounded-full transition-all duration-200 ease-out relative`}
                            style={{ width: `${goal.progress}%` }}
                          >
                            {/* Indicador visual sutil no final da barra preenchida */}
                            <div className="absolute right-0 top-1/2 w-2 h-2 bg-white rounded-full shadow-sm transform -translate-y-1/2 border border-gray-200"></div>
                          </div>
                        </div>
                        
                        {/* Input range invisível mas funcional */}
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={goal.progress}
                          onChange={(e) => onUpdateGoalProgress(goal.id, parseInt(e.target.value))}
                          className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, ${getProgressColor(goal.progress).replace('bg-', '')} 0%, ${getProgressColor(goal.progress).replace('bg-', '')} ${goal.progress}%, #e5e7eb ${goal.progress}%, #e5e7eb 100%)`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Botão de menu (três pontos) - MANTIDO para edição rápida */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation() // Evita que o clique propague para o cabeçalho
                      onEditGoal(goal)
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    title="Editar meta"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                  </button>
                </div>

                {/* Próximos Passos com destaque especial - CLICÁVEL */}
                {goal.nextSteps && (
                  <div 
                    className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg cursor-pointer hover:from-yellow-100 hover:to-orange-100 transition-all duration-200"
                    onClick={() => onEditGoal(goal)}
                    title="Clique para editar a meta"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                      <span className="text-xs font-semibold text-yellow-800">
                        Próximo Passo:
                      </span>
                    </div>
                    <div className="text-xs text-yellow-700 leading-relaxed">
                      {goal.nextSteps}
                    </div>
                  </div>
                )}

                {/* Iniciativas */}
                <div className="border-t border-gray-100 pt-3">
                  <button
                    onClick={() => toggleGoalExpansion(goal.id)}
                    className="flex items-center justify-between w-full text-left mb-3 group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        Iniciativas
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                        {goal.initiatives.filter(i => i.completed).length}/{goal.initiatives.length}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <svg 
                        className={`w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-all duration-200 ${
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
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors duration-200"
                        >
                          {/* Checkbox */}
                                                      <input
                              type="checkbox"
                              checked={initiative.completed}
                              onChange={() => onToggleInitiative(goal.id, initiative.id)}
                              className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 transition-colors duration-200"
                            />
                          
                          {/* Título da iniciativa */}
                          {editingInitiativeId === initiative.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={editingInitiativeTitle}
                                onChange={(e) => setEditingInitiativeTitle(e.target.value)}
                                className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveInitiativeEdit(goal.id, initiative.id)
                                  }
                                }}
                                autoFocus
                              />
                                                              <button
                                  onClick={() => handleSaveInitiativeEdit(goal.id, initiative.id)}
                                  className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors duration-200"
                                  title="Salvar"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={handleCancelInitiativeEdit}
                                  className="p-1 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors duration-200"
                                  title="Cancelar"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                            </div>
                          ) : (
                                                          <div className="flex items-center gap-2 flex-1">
                                <span className={`text-sm font-medium ${initiative.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                  {initiative.title}
                                </span>
                                
                                <div className="flex items-center gap-1 ml-auto">
                                  <button
                                    onClick={() => handleStartEditInitiative(initiative)}
                                    className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors duration-200"
                                    title="Editar"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteInitiative(goal.id, initiative.id)}
                                    className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors duration-200"
                                    title="Deletar"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                          )}
                        </div>
                      ))}
                      
                      {/* Botão para adicionar nova iniciativa */}
                      <button className="w-full p-2 border border-dashed border-gray-300 rounded text-gray-500 hover:text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-xs font-medium">Adicionar Iniciativa</span>
                      </button>
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
