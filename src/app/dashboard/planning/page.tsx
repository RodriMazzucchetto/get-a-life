'use client'

import { useState } from 'react'
import { PlusIcon, ArrowRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface Task {
  id: string
  title: string
  description?: string
  status: 'in_progress' | 'current_week' | 'backlog' | 'completed'
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  created_at: string
}

interface Reminder {
  id: string
  title: string
  description?: string
  dueDate?: string
  priority: 'low' | 'medium' | 'high'
  created_at: string
}

export default function PlanningPage() {
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showRemindersModal, setShowRemindersModal] = useState(false)
  const [showProjectsModal, setShowProjectsModal] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: ''
  })

  // Mock data para projetos
  const projects = [
    { id: '1', name: 'Pessoal', color: 'bg-blue-500' },
    { id: '2', name: 'ExitLag', color: 'bg-gray-500' },
    { id: '3', name: 'KimonoLab', color: 'bg-red-500' },
    { id: '4', name: 'Zentrix', color: 'bg-purple-500' }
  ]

  // Mock data - depois será integrado com o banco
  const taskStats = {
    inProgress: 1,
    currentWeek: 21,
    backlog: 5,
    completed: 32,
    reminders: 6
  }

  const mockReminders: Reminder[] = [
    {
      id: '1',
      title: 'Reunião com equipe',
      description: 'Discussão sobre próximos sprints',
      dueDate: '2024-01-15',
      priority: 'high',
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Pagar contas',
      description: 'Verificar boletos pendentes',
      dueDate: '2024-01-20',
      priority: 'medium',
      created_at: new Date().toISOString()
    }
  ]

  const handleCreateTask = () => {
    // TODO: Implementar criação de tarefa
    console.log('Nova tarefa:', newTask)
    setNewTask({ title: '', description: '', priority: 'medium', dueDate: '' })
    setShowTaskModal(false)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">Planejamento Semanal</h1>
            <p className="mt-2 text-gray-600">
              Organize suas tarefas entre backlog e semana atual
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Google Calendar Button */}
            <button className="inline-flex items-center px-4 py-2 border border-orange-300 text-sm font-medium rounded-md text-orange-700 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
              <ExclamationTriangleIcon className="h-4 w-4 mr-2 text-orange-500" />
              Google Calendar
            </button>
            
            {/* New Task Button */}
            <button
              onClick={() => setShowTaskModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Nova Tarefa
            </button>
            
            {/* Exit Button */}
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
              <ArrowRightIcon className="h-4 w-4 mr-2" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Task Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Em Progresso */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-2">Em Progresso</p>
            <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
              {taskStats.inProgress}
            </div>
          </div>
        </div>

        {/* Semana Atual */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-2">Semana Atual</p>
            <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
              {taskStats.currentWeek}
            </div>
          </div>
        </div>

        {/* Backlog */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-2">Backlog</p>
            <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
              {taskStats.backlog}
            </div>
          </div>
        </div>

        {/* Concluídas */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-2">Concluídas</p>
            <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
              {taskStats.completed}
            </div>
          </div>
        </div>

        {/* Lembretes - Cliqueável */}
        <button
          onClick={() => setShowRemindersModal(true)}
          className="bg-orange-50 rounded-lg shadow p-4 border border-orange-200 hover:bg-orange-100 transition-colors duration-200"
        >
          <div className="text-center">
            <p className="text-orange-700 text-sm mb-2">Lembretes</p>
            <div className="inline-flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-600 rounded-full text-sm font-medium">
              {taskStats.reminders}
            </div>
          </div>
        </button>
      </div>

      {/* Elemento de Metas */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Metas</h2>
                <p className="text-sm text-gray-600">6 ativas • 0 concluídas</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowProjectsModal(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Projetos
              </button>
              
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md">
                <span className="text-sm font-medium text-gray-700">53% média</span>
                <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
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

      {/* Task Creation Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Nova Tarefa</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Digite o título da tarefa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição (opcional)
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Digite a descrição da tarefa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Vencimento (opcional)
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateTask}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Criar Tarefa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reminders Modal */}
      {showRemindersModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Lembretes</h3>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {mockReminders.map((reminder) => (
                  <div key={reminder.id} className="p-3 border border-gray-200 rounded-md">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{reminder.title}</h4>
                        {reminder.description && (
                          <p className="text-sm text-gray-600 mt-1">{reminder.description}</p>
                        )}
                        {reminder.dueDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            Vencimento: {new Date(reminder.dueDate).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(reminder.priority)}`}>
                        {reminder.priority === 'high' ? 'Alta' : reminder.priority === 'medium' ? 'Média' : 'Baixa'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setShowRemindersModal(false)}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
