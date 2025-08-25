'use client'

import { useState } from 'react'
import { PlusIcon, Cog6ToothIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline'

interface Project {
  id: string
  name: string
  color: string
  goals: Goal[]
}

interface Goal {
  id: string
  title: string
  description: string
  progress: number
  nextStep: string
  initiatives: { completed: number; total: number }
  dueDate?: string
  projectId: string
}

export default function GoalsPage() {
  const [showProjectsModal, setShowProjectsModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)

  // Mock data baseado nas imagens
  const projects: Project[] = [
    {
      id: '1',
      name: 'Pessoal',
      color: 'bg-blue-500',
      goals: [
        {
          id: '1',
          title: 'Get a life off work',
          description: 'Get a life off work',
          progress: 45,
          nextStep: 'Alocar um app dentro do nosso planejador semanal',
          initiatives: { completed: 0, total: 1 },
          projectId: '1'
        }
      ]
    },
    {
      id: '2',
      name: 'ExitLag',
      color: 'bg-gray-500',
      goals: [
        {
          id: '2',
          title: 'SDK Comercialmente Operacional',
          description: 'SDK',
          progress: 75,
          nextStep: 'Fazer a estruturação do go to market do SDK...',
          initiatives: { completed: 0, total: 2 },
          dueDate: '30/09/2025',
          projectId: '2'
        },
        {
          id: '3',
          title: 'CN automatizado e escalável',
          description: 'CN',
          progress: 50,
          nextStep: 'Avançar com Plugin e LP traduzida no ar',
          initiatives: { completed: 0, total: 2 },
          dueDate: '30/09/2025',
          projectId: '2'
        },
        {
          id: '4',
          title: 'Tornar o produto do SDK tecnicamente operacional',
          description: 'SDK',
          progress: 90,
          nextStep: 'Avançar com front do Sentinel + Lançar nova season do Imperianic',
          initiatives: { completed: 2, total: 6 },
          dueDate: '30/09/2025',
          projectId: '2'
        }
      ]
    },
    {
      id: '3',
      name: 'KimonoLab',
      color: 'bg-red-500',
      goals: [
        {
          id: '5',
          title: 'CRM Integrado e Automatizado com Atendimento de IA',
          description: 'CRM Integrado e Automatizado com Atendimento de IA',
          progress: 5,
          nextStep: 'Finalizar o KimonoBot na Lovable (Integrado, funcional e 24h)',
          initiatives: { completed: 0, total: 4 },
          projectId: '3'
        }
      ]
    },
    {
      id: '4',
      name: 'Zentrix',
      color: 'bg-purple-500',
      goals: [
        {
          id: '6',
          title: 'Primeira Venda Zentrix Business Solutions',
          description: 'Zentrix OS',
          progress: 50,
          nextStep: 'Estruturar um fluxo de desenvolvimento e definir um DoD para o produto estar pronto para venda',
          initiatives: { completed: 0, total: 2 },
          projectId: '4'
        }
      ]
    }
  ]

  const totalGoals = projects.reduce((acc, project) => acc + project.goals.length, 0)
  const completedGoals = projects.reduce((acc, project) => 
    acc + project.goals.filter(goal => goal.progress === 100).length, 0
  )
  const nearCompletionGoals = projects.reduce((acc, project) => 
    acc + project.goals.filter(goal => goal.progress >= 80).length, 0
  )

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 60) return 'bg-green-400'
    if (progress >= 40) return 'bg-yellow-500'
    if (progress >= 20) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const handleGoalClick = (goal: Goal) => {
    setSelectedGoal(goal)
    setShowGoalModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Metas</h1>
            <p className="mt-2 text-gray-600">
              {totalGoals} ativas • {completedGoals} concluídas
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Projetos Button */}
            <button
              onClick={() => setShowProjectsModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <Cog6ToothIcon className="h-4 w-4 mr-2" />
              Projetos
            </button>
            
            {/* + Meta Button */}
            <button
              onClick={() => setShowGoalModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              + Meta
            </button>
          </div>
        </div>

        {/* Near Completion Alert */}
        {nearCompletionGoals > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-sm">
              {nearCompletionGoals} meta(s) próxima(s) de conclusão (80%+)
            </p>
          </div>
        )}
      </div>

      {/* Projects and Goals */}
      <div className="space-y-8">
        {projects.map((project) => (
          <div key={project.id} className="space-y-4">
            {/* Project Header */}
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${project.color}`}></div>
              <h2 className="text-xl font-semibold text-gray-900">
                {project.name}
              </h2>
              <span className="text-sm text-gray-500">
                {project.goals.length} meta{project.goals.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.goals.map((goal) => (
                <div
                  key={goal.id}
                  onClick={() => handleGoalClick(goal)}
                  className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                      {goal.title}
                    </h3>
                    <button className="text-gray-400 hover:text-gray-600">
                      <EllipsisVerticalIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mb-3">{goal.description}</p>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progresso</span>
                      <span>{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(goal.progress)}`}
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Next Step */}
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    <span className="font-medium">Próximo Passo:</span> {goal.nextStep}
                  </p>

                  {/* Initiatives */}
                  <p className="text-xs text-gray-500 mb-2">
                    Iniciativas {goal.initiatives.completed}/{goal.initiatives.total}
                  </p>

                  {/* Due Date */}
                  {goal.dueDate && (
                    <p className="text-xs text-gray-500">
                      Meta: {goal.dueDate}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Projects Management Modal */}
      {showProjectsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Gerenciar Projetos</h3>
              <button
                onClick={() => setShowProjectsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-700">Projetos Existentes</h4>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Novo Projeto
                </button>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${project.color}`}></div>
                      <span className="text-sm text-gray-900">{project.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="text-gray-600 hover:text-gray-800">
                        ✏️
                      </button>
                      <button className="text-red-600 hover:text-red-800">
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goal Details Modal */}
      {showGoalModal && selectedGoal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Detalhes da Meta</h3>
              <button
                onClick={() => setShowGoalModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Título</h4>
                <p className="text-sm text-gray-900">{selectedGoal.title}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Descrição</h4>
                <p className="text-sm text-gray-900">{selectedGoal.description}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Progresso</h4>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(selectedGoal.progress)}`}
                      style={{ width: `${selectedGoal.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{selectedGoal.progress}%</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Próximo Passo</h4>
                <p className="text-sm text-gray-900">{selectedGoal.nextStep}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Iniciativas</h4>
                <p className="text-sm text-gray-900">
                  {selectedGoal.initiatives.completed}/{selectedGoal.initiatives.total} concluídas
                </p>
              </div>

              {selectedGoal.dueDate && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Data Meta</h4>
                  <p className="text-sm text-gray-900">{selectedGoal.dueDate}</p>
                </div>
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowGoalModal(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
