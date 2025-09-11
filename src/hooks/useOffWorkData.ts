import { useState, useEffect, useCallback } from 'react'
import { OffWorkCategory, OffWorkActivity, OffWorkIdea, CreateActivityData, UpdateActivityData, CreateIdeaData } from '@/types/offwork'

export function useOffWorkData() {
  const [categories, setCategories] = useState<OffWorkCategory[]>([])
  const [activities, setActivities] = useState<OffWorkActivity[]>([])
  const [ideas, setIdeas] = useState<OffWorkIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carregar categorias
  const loadCategories = useCallback(async () => {
    try {
      // Categorias mockadas para funcionar sem banco
      const mockCategories = [
        { id: '1', name: 'Viagens', color: 'blue', description: 'Atividades relacionadas a viagens e turismo', icon: '🌍', activity_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '2', name: 'Mini Aventuras', color: 'green', description: 'Pequenas aventuras e experiências locais', icon: '🌱', activity_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '3', name: 'Esporte', color: 'orange', description: 'Atividades esportivas e exercícios', icon: '⚽', activity_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '4', name: 'Crescimento', color: 'purple', description: 'Atividades de desenvolvimento pessoal', icon: '📈', activity_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '5', name: 'Social', color: 'cyan', description: 'Atividades sociais e networking', icon: '👥', activity_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '6', name: 'Relacionamentos', color: 'pink', description: 'Atividades para fortalecer relacionamentos', icon: '💕', activity_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '7', name: 'Lifestyle', color: 'indigo', description: 'Atividades de estilo de vida e bem-estar', icon: '🎨', activity_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '8', name: 'Hobbies', color: 'yellow', description: 'Hobbies e passatempos pessoais', icon: '🎯', activity_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ]
      setCategories(mockCategories)
    } catch (err) {
      console.error('Error loading categories:', err)
      setError('Failed to load categories')
    }
  }, [])

  // Carregar atividades
  const loadActivities = useCallback(async (categoryName?: string) => {
    try {
      // Por enquanto, retorna array vazio - será implementado quando o banco estiver pronto
      setActivities([])
    } catch (err) {
      console.error('Error loading activities:', err)
      setError('Failed to load activities')
    }
  }, [])

  // Carregar ideias
  const loadIdeas = useCallback(async (categoryName?: string) => {
    try {
      // Por enquanto, retorna array vazio - será implementado quando o banco estiver pronto
      setIdeas([])
    } catch (err) {
      console.error('Error loading ideas:', err)
      setError('Failed to load ideas')
    }
  }, [])

  // Criar atividade
  const createActivity = useCallback(async (activityData: CreateActivityData) => {
    try {
      // Por enquanto, apenas simula a criação - será implementado quando o banco estiver pronto
      const mockActivity: OffWorkActivity = {
        id: Date.now().toString(),
        user_id: 'mock-user',
        category_id: activityData.category_id,
        title: activityData.title,
        description: activityData.description,
        status: activityData.status || 'pending',
        priority: activityData.priority || 'medium',
        estimated_duration: activityData.estimated_duration,
        due_date: activityData.due_date,
        tags: activityData.tags || [],
        metadata: activityData.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      setActivities(prev => [mockActivity, ...prev])
      return mockActivity
    } catch (err) {
      console.error('Error creating activity:', err)
      setError('Failed to create activity')
      throw err
    }
  }, [])

  // Atualizar atividade
  const updateActivity = useCallback(async (id: string, updateData: UpdateActivityData) => {
    try {
      // Por enquanto, apenas simula a atualização
      setActivities(prev => 
        prev.map(activity => 
          activity.id === id ? { ...activity, ...updateData } : activity
        )
      )
      return activities.find(a => a.id === id)!
    } catch (err) {
      console.error('Error updating activity:', err)
      setError('Failed to update activity')
      throw err
    }
  }, [activities])

  // Deletar atividade
  const deleteActivity = useCallback(async (id: string) => {
    try {
      // Por enquanto, apenas simula a deleção
      setActivities(prev => prev.filter(activity => activity.id !== id))
    } catch (err) {
      console.error('Error deleting activity:', err)
      setError('Failed to delete activity')
      throw err
    }
  }, [])

  // Criar ideia
  const createIdea = useCallback(async (ideaData: CreateIdeaData) => {
    try {
      // Por enquanto, apenas simula a criação
      const mockIdea: OffWorkIdea = {
        id: Date.now().toString(),
        user_id: 'mock-user',
        category_id: ideaData.category_id,
        title: ideaData.title,
        description: ideaData.description,
        status: ideaData.status || 'idea',
        priority: ideaData.priority || 'medium',
        estimated_duration: ideaData.estimated_duration,
        tags: ideaData.tags || [],
        metadata: ideaData.metadata || {},
        source: ideaData.source || 'manual',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      setIdeas(prev => [mockIdea, ...prev])
      return mockIdea
    } catch (err) {
      console.error('Error creating idea:', err)
      setError('Failed to create idea')
      throw err
    }
  }, [])

  // Converter ideia em atividade
  const convertIdeaToActivity = useCallback(async (ideaId: string) => {
    try {
      const idea = ideas.find(i => i.id === ideaId)
      if (!idea) throw new Error('Idea not found')

      const activityData: CreateActivityData = {
        category_id: idea.category_id,
        title: idea.title,
        description: idea.description,
        priority: idea.priority,
        estimated_duration: idea.estimated_duration,
        tags: idea.tags,
        metadata: idea.metadata,
      }

      const activity = await createActivity(activityData)
      
      // Atualizar status da ideia para 'planned'
      setIdeas(prev => 
        prev.map(i => 
          i.id === ideaId ? { ...i, status: 'planned' } : i
        )
      )

      return activity
    } catch (err) {
      console.error('Error converting idea to activity:', err)
      setError('Failed to convert idea to activity')
      throw err
    }
  }, [ideas, createActivity])

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        await Promise.all([
          loadCategories(),
          loadActivities(),
          loadIdeas()
        ])
      } catch (err) {
        console.error('Error loading initial data:', err)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [loadCategories, loadActivities, loadIdeas])

  return {
    categories,
    activities,
    ideas,
    loading,
    error,
    loadCategories,
    loadActivities,
    loadIdeas,
    createActivity,
    updateActivity,
    deleteActivity,
    createIdea,
    convertIdeaToActivity,
    // Funções de conveniência
    getActivitiesByCategory: (categoryName: string) => 
      activities.filter(activity => activity.offwork_categories?.name === categoryName),
    getIdeasByCategory: (categoryName: string) => 
      ideas.filter(idea => idea.offwork_categories?.name === categoryName),
    getCategoryByName: (name: string) => 
      categories.find(category => category.name === name),
  }
}
