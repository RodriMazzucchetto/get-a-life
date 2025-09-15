import { useState, useEffect, useCallback } from 'react'
import { OffWorkIdea, CreateIdeaData, UpdateIdeaData } from '@/types/offwork'

export function useOffWorkIdeas() {
  const [ideas, setIdeas] = useState<OffWorkIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carregar ideias
  const loadIdeas = useCallback(async () => {
    try {
      const response = await fetch('/api/offwork/ideas')
      if (!response.ok) throw new Error('Failed to fetch ideas')
      const result = await response.json()
      setIdeas(result.ideas || [])
    } catch (err) {
      console.error('Error loading ideas:', err)
      setError('Failed to load ideas')
    }
  }, [])

  // Criar ideia
  const createIdea = useCallback(async (ideaData: CreateIdeaData) => {
    try {
      console.log('🔄 Creating idea with data:', ideaData)
      const response = await fetch('/api/offwork/ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ideaData),
      })
      
      console.log('🔄 Response status:', response.status)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('🔄 Response error:', errorText)
        throw new Error(`Failed to create idea: ${response.status} ${errorText}`)
      }
      
      const result = await response.json()
      console.log('🔄 Response result:', result)
      const data = result.idea || result
      
      setIdeas(prev => [data, ...prev])
      console.log('✅ Idea created successfully:', data)
      return data
    } catch (err) {
      console.error('❌ Error creating idea:', err)
      setError('Failed to create idea')
      throw err
    }
  }, [])

  // Atualizar ideia
  const updateIdea = useCallback(async (id: string, updateData: UpdateIdeaData) => {
    try {
      const response = await fetch(`/api/offwork/ideas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })
      
      if (!response.ok) throw new Error('Failed to update idea')
      const result = await response.json()
      const data = result.idea || result
      
      setIdeas(prev => 
        prev.map(idea => 
          idea.id === id ? data : idea
        )
      )
      return data
    } catch (err) {
      console.error('Error updating idea:', err)
      setError('Failed to update idea')
      throw err
    }
  }, [])

  // Deletar ideia
  const deleteIdea = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/offwork/ideas/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Failed to delete idea')
      
      setIdeas(prev => prev.filter(idea => idea.id !== id))
    } catch (err) {
      console.error('Error deleting idea:', err)
      setError('Failed to delete idea')
      throw err
    }
  }, [])

  // Priorizar ideia
  const prioritizeIdea = useCallback(async (id: string) => {
    try {
      await updateIdea(id, { is_prioritized: true })
    } catch (err) {
      console.error('Error prioritizing idea:', err)
      throw err
    }
  }, [updateIdea])

  // Remover priorização
  const removePriority = useCallback(async (id: string) => {
    try {
      await updateIdea(id, { is_prioritized: false })
    } catch (err) {
      console.error('Error removing priority:', err)
      throw err
    }
  }, [updateIdea])

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        await loadIdeas()
      } catch (err) {
        console.error('Error loading initial data:', err)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [loadIdeas])

  // Garantir que o estado seja sempre array
  const safeIdeas = Array.isArray(ideas) ? ideas : []

  return {
    ideas: safeIdeas,
    loading,
    error,
    loadIdeas,
    createIdea,
    updateIdea,
    deleteIdea,
    prioritizeIdea,
    removePriority,
    // Funções de conveniência
    getPrioritizedIdeas: () => safeIdeas.filter(idea => idea.is_prioritized),
    getRegularIdeas: () => safeIdeas.filter(idea => !idea.is_prioritized),
  }
}
