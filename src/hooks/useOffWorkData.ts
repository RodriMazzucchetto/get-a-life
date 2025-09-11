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
      const response = await fetch('/api/offwork/categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      const data = await response.json()
      setCategories(data)
    } catch (err) {
      console.error('Error loading categories:', err)
      setError('Failed to load categories')
    }
  }, [])

  // Carregar atividades
  const loadActivities = useCallback(async (categoryName?: string) => {
    try {
      const url = categoryName
        ? `/api/offwork/activities?category=${encodeURIComponent(categoryName)}`
        : '/api/offwork/activities'
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch activities')
      }
      const result = await response.json()
      const data = result.activities || result
      setActivities(data)
    } catch (err) {
      console.error('Error loading activities:', err)
      setError('Failed to load activities')
    }
  }, [])

  // Carregar ideias
  const loadIdeas = useCallback(async (categoryName?: string) => {
    try {
      const url = categoryName 
        ? `/api/offwork/ideas?category=${encodeURIComponent(categoryName)}`
        : '/api/offwork/ideas'
      
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch ideas')
      const result = await response.json()
      const data = result.ideas || result
      setIdeas(data)
    } catch (err) {
      console.error('Error loading ideas:', err)
      setError('Failed to load ideas')
    }
  }, [])

  // Criar atividade
  const createActivity = useCallback(async (activityData: CreateActivityData) => {
    try {
      const response = await fetch('/api/offwork/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData),
      })
      
      if (!response.ok) throw new Error('Failed to create activity')
      const data = await response.json()
      
      setActivities(prev => [data, ...prev])
      return data
    } catch (err) {
      console.error('Error creating activity:', err)
      setError('Failed to create activity')
      throw err
    }
  }, [])

  // Atualizar atividade
  const updateActivity = useCallback(async (id: string, updateData: UpdateActivityData) => {
    try {
      const response = await fetch(`/api/offwork/activities/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })
      
      if (!response.ok) throw new Error('Failed to update activity')
      const data = await response.json()
      
      setActivities(prev => 
        prev.map(activity => 
          activity.id === id ? data : activity
        )
      )
      return data
    } catch (err) {
      console.error('Error updating activity:', err)
      setError('Failed to update activity')
      throw err
    }
  }, [])

  // Deletar atividade
  const deleteActivity = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/offwork/activities/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Failed to delete activity')
      
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
      const response = await fetch('/api/offwork/ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ideaData),
      })
      
      if (!response.ok) throw new Error('Failed to create idea')
      const data = await response.json()
      
      setIdeas(prev => [data, ...prev])
      return data
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
        await loadCategories()
        await loadActivities()
        await loadIdeas()
      } catch (err) {
        console.error('Error loading initial data:', err)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [loadCategories, loadActivities, loadIdeas])

  // Garantir que os estados sejam sempre arrays
  const safeActivities = Array.isArray(activities) ? activities : []
  const safeIdeas = Array.isArray(ideas) ? ideas : []
  const safeCategories = Array.isArray(categories) ? categories : []

  return {
    categories: safeCategories,
    activities: safeActivities,
    ideas: safeIdeas,
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
    getActivitiesByCategory: (categoryName: string) => {
      return safeActivities.filter(activity => 
        activity.offwork_categories?.name === categoryName
      )
    },
    getIdeasByCategory: (categoryName: string) => 
      safeIdeas.filter(idea => idea.offwork_categories?.name === categoryName),
    getCategoryByName: (name: string) => 
      safeCategories.find(category => category.name === name),
  }
}
