'use client'

import { useState, useEffect } from 'react'
import { OffWorkActivity, OffWorkCategory } from '@/types/offwork'

interface ActivityModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (activity: Partial<OffWorkActivity>) => Promise<void>
  category: OffWorkCategory | null
  categories: OffWorkCategory[]
  activity?: OffWorkActivity | null
  mode: 'create' | 'edit'
}

export default function ActivityModal({ 
  isOpen, 
  onClose, 
  onSave, 
  category, 
  categories,
  activity, 
  mode 
}: ActivityModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: [] as string[],
    estimated_duration: '',
    due_date: ''
  })
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [newTag, setNewTag] = useState('')
  const [loading, setLoading] = useState(false)

  // Reset form when modal opens/closes or activity changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && activity) {
        setFormData({
          title: activity.title || '',
          description: activity.description || '',
          tags: activity.tags || [],
          estimated_duration: activity.estimated_duration?.toString() || '',
          due_date: activity.due_date ? new Date(activity.due_date).toISOString().split('T')[0] : ''
        })
        setSelectedCategoryId(activity.category_id || '')
      } else {
        setFormData({
          title: '',
          description: '',
          tags: [],
          estimated_duration: '',
          due_date: ''
        })
        // Se há uma categoria específica passada (modo create), usar ela
        if (category) {
          setSelectedCategoryId(category.id)
        } else if (categories.length > 0) {
          // Se não há categoria específica, usar a primeira disponível
          setSelectedCategoryId(categories[0].id)
        }
      }
    }
  }, [isOpen, mode, activity, category, categories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCategoryId) {
      alert('Por favor, selecione uma categoria')
      return
    }

    setLoading(true)
    try {
      const activityData: Partial<OffWorkActivity> = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        tags: formData.tags,
        category_id: selectedCategoryId,
        status: 'pending',
        priority: 'medium',
        estimated_duration: formData.estimated_duration ? parseInt(formData.estimated_duration) : undefined,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : undefined
      }

      await onSave(activityData)
      // O modal será fechado pelo componente pai após salvar com sucesso
    } catch (error) {
      console.error('Error saving activity:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'create' ? 'Nova Atividade' : 'Editar Atividade'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria *
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Praticar surf"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Aprender técnicas básicas de surf"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (Subcategorias)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Físicas, Culturais..."
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Adicionar
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duração (min)
                </label>
                <input
                  type="number"
                  value={formData.estimated_duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="60"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data limite
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !formData.title.trim()}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Salvando...' : (mode === 'create' ? 'Criar Atividade' : 'Salvar Alterações')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

