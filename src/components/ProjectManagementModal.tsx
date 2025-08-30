import React, { useState, useEffect } from 'react'
import ModalOverlay from './ModalOverlay'
import { Project } from '@/lib/planning'

interface ProjectManagementModalProps {
  isOpen: boolean
  onClose: () => void
  projects: Project[]
  onCreateProject: (name: string, color: string) => Promise<Project | null>
  onUpdateProject: (id: string, updates: Partial<Project>) => Promise<Project | null>
  onDeleteProject: (id: string) => Promise<boolean>
}

export function ProjectManagementModal({
  isOpen,
  onClose,
  projects,
  onCreateProject,
  onUpdateProject,
  onDeleteProject
}: ProjectManagementModalProps) {
  // Estados para criação de projeto
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectColor, setNewProjectColor] = useState('#3B82F6')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Estados para edição de projeto
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editProjectName, setEditProjectName] = useState('')
  const [editProjectColor, setEditProjectColor] = useState('#3B82F6')
  const [isEditing, setIsEditing] = useState(false)

  // Estados para deleção
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null)

  // Resetar formulários quando modal abrir/fechar
  useEffect(() => {
    if (isOpen) {
      setNewProjectName('')
      setNewProjectColor('#3B82F6')
      setShowCreateForm(false)
      setEditingProject(null)
      setEditProjectName('')
      setEditProjectColor('#3B82F6')
    }
  }, [isOpen])

  // Função para criar projeto
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return

    setIsCreating(true)
    try {
      const newProject = await onCreateProject(newProjectName.trim(), newProjectColor)
      if (newProject) {
        setNewProjectName('')
        setNewProjectColor('#3B82F6')
        setShowCreateForm(false)
      }
    } catch (error) {
      console.error('Erro ao criar projeto:', error)
    } finally {
      setIsCreating(false)
    }
  }

  // Função para iniciar edição
  const handleStartEdit = (project: Project) => {
    setEditingProject(project)
    setEditProjectName(project.name)
    setEditProjectColor(project.color)
  }

  // Função para salvar edição
  const handleSaveEdit = async () => {
    if (!editingProject || !editProjectName.trim()) return

    setIsEditing(true)
    try {
      const updatedProject = await onUpdateProject(editingProject.id, {
        name: editProjectName.trim(),
        color: editProjectColor
      })
      if (updatedProject) {
        setEditingProject(null)
        setEditProjectName('')
        setEditProjectColor('#3B82F6')
      }
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error)
    } finally {
      setIsEditing(false)
    }
  }

  // Função para deletar projeto
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Tem certeza que deseja deletar este projeto? Esta ação não pode ser desfeita.')) {
      return
    }

    setDeletingProjectId(projectId)
    try {
      const success = await onDeleteProject(projectId)
      if (success) {
        // Projeto deletado com sucesso
      }
    } catch (error) {
      console.error('Erro ao deletar projeto:', error)
    } finally {
      setDeletingProjectId(null)
    }
  }

  // Função para cancelar edição
  const handleCancelEdit = () => {
    setEditingProject(null)
    setEditProjectName('')
    setEditProjectColor('#3B82F6')
  }

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="relative top-20 mx-auto p-6 w-full max-w-2xl shadow-2xl rounded-xl bg-white border-2 border-gray-100 ring-4 ring-white/50">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Projetos</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Formulário de criação */}
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full mb-6 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Criar Novo Projeto
          </button>
        ) : (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Criar Novo Projeto</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Projeto
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Digite o nome do projeto"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateProject()
                    }
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor do Projeto
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newProjectColor}
                    onChange={(e) => setNewProjectColor(e.target.value)}
                    className="w-12 h-12 border border-gray-300 rounded-md cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newProjectColor}
                    onChange={(e) => setNewProjectColor(e.target.value)}
                    placeholder="#3B82F6"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim() || isCreating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreating ? 'Criando...' : 'Criar Projeto'}
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de projetos existentes */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Projetos Existentes</h3>
          
          {projects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">📁</div>
              <p>Nenhum projeto criado ainda.</p>
              <p className="text-sm">Crie seu primeiro projeto para começar a organizar suas metas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: project.color }}
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">{project.name}</h4>
                      <p className="text-sm text-gray-500">
                        Criado em {new Date(project.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {editingProject?.id === project.id ? (
                      // Modo de edição
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editProjectName}
                          onChange={(e) => setEditProjectName(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEdit()
                            }
                          }}
                        />
                        <input
                          type="color"
                          value={editProjectColor}
                          onChange={(e) => setEditProjectColor(e.target.value)}
                          className="w-6 h-6 border border-gray-300 rounded cursor-pointer"
                        />
                        <button
                          onClick={handleSaveEdit}
                          disabled={!editProjectName.trim() || isEditing}
                          className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                          title="Salvar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-gray-600 hover:text-gray-700"
                          title="Cancelar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      // Modo de visualização
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartEdit(project)}
                          className="p-1 text-blue-600 hover:text-blue-700"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          disabled={deletingProjectId === project.id}
                          className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50"
                          title="Deletar"
                        >
                          {deletingProjectId === project.id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModalOverlay>
  )
}
