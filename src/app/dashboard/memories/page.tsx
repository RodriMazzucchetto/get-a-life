'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { getUserMemories, updateMemory } from '@/lib/memories'
import { Memory } from '@/types'
import MemoryRegistrationModal from '@/components/MemoryRegistrationModal'

export default function MemoriesPage() {
  const { user } = useAuthContext()
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const loadMemories = async () => {
      if (!user) return

      try {
        setLoading(true)
        const userMemories = await getUserMemories()
        setMemories(userMemories)
      } catch (err) {
        console.error('Erro ao carregar memórias:', err)
        setError('Erro ao carregar suas experiências')
      } finally {
        setLoading(false)
      }
    }

    loadMemories()
  }, [user])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getLifeFrontDisplay = (lifeFront: string) => {
    const lifeFrontMap: { [key: string]: { emoji: string; label: string; color: string } } = {
      creativity: { emoji: '🎨', label: 'Criatividade', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      nature: { emoji: '🌿', label: 'Natureza', color: 'bg-green-100 text-green-800 border-green-200' },
      social: { emoji: '🤝', label: 'Social', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      spirituality: { emoji: '🧘‍♂️', label: 'Espiritualidade', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
      movement: { emoji: '🏃‍♂️', label: 'Movimento', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      gastronomy: { emoji: '🍽️', label: 'Gastronomia', color: 'bg-red-100 text-red-800 border-red-200' },
      culture: { emoji: '🎭', label: 'Cultura', color: 'bg-pink-100 text-pink-800 border-pink-200' },
      surprise: { emoji: '🎲', label: 'Surpresa', color: 'bg-gray-100 text-gray-800 border-gray-200' }
    }

    return lifeFrontMap[lifeFront] || { emoji: '❓', label: 'Desconhecida', color: 'bg-gray-100 text-gray-800 border-gray-200' }
  }

  const getMemoryStatus = (memory: Memory) => {
    const hasNotes = memory.notes && memory.notes.trim().length > 0
    const hasMedia = memory.media && memory.media.length > 0
    const hasMood = memory.mood && memory.mood.trim().length > 0

    if (hasNotes && hasMedia && hasMood) {
      return {
        text: 'Completa',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: '✨',
        description: 'Notas, fotos e sentimento registrados'
      }
    } else if (hasNotes && hasMedia) {
      return {
        text: 'Com fotos',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: '📸',
        description: 'Notas e fotos registradas'
      }
    } else if (hasNotes && hasMood) {
      return {
        text: 'Com reflexão',
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: '💭',
        description: 'Notas e sentimento registrados'
      }
    } else if (hasNotes) {
      return {
        text: 'Com notas',
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        icon: '📝',
        description: 'Apenas notas registradas'
      }
    } else if (hasMedia) {
      return {
        text: 'Com fotos',
        color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        icon: '📷',
        description: 'Apenas fotos registradas'
      }
    } else if (hasMood) {
      return {
        text: 'Com sentimento',
        color: 'bg-pink-100 text-pink-800 border-pink-200',
        icon: '😊',
        description: 'Apenas sentimento registrado'
      }
    } else {
      return {
        text: 'Em branco',
        color: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: '📄',
        description: 'Nenhum detalhe registrado'
      }
    }
  }

  const handleMemoryClick = (memory: Memory) => {
    setSelectedMemory(memory)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedMemory(null)
  }

  const handleMemoryUpdate = async (updates: Partial<Memory>) => {
    if (!selectedMemory) return

    try {
      const updatedMemory = await updateMemory(selectedMemory.id, updates)
      
      if (updatedMemory) {
        // Atualizar a lista de memórias
        setMemories(prevMemories => 
          prevMemories.map(memory => 
            memory.id === selectedMemory.id ? updatedMemory : memory
          )
        )
        
        // Fechar modal após sucesso
        setTimeout(() => {
          setIsModalOpen(false)
          setSelectedMemory(null)
        }, 2000)
      }
    } catch (error) {
      console.error('Erro ao atualizar memória:', error)
      throw error
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando suas experiências...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-800">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📖 Meu Diário de Experiências
          </h1>
          <p className="text-gray-600">
            Suas experiências aceitas e registradas ao longo do tempo
          </p>
        </div>

        {/* Lista de memórias */}
        {memories.length > 0 && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-800 text-sm">
              💡 <strong>Dica:</strong> Clique em qualquer experiência para adicionar notas, fotos e registrar como você se sentiu!
            </p>
          </div>
        )}
        
        {memories.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhuma experiência registrada ainda
              </h3>
              <p className="text-gray-600 mb-6">
                Quando você aceitar sugestões, elas aparecerão aqui no seu diário.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  💡 <strong>Dica:</strong> Volte ao dashboard e aceite uma sugestão para começar a construir seu diário!
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {memories.map((memory) => {
              const lifeFront = getLifeFrontDisplay(memory.life_front)
              const status = getMemoryStatus(memory)

              return (
                <div 
                  key={memory.id} 
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                  onClick={() => handleMemoryClick(memory)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {memory.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Aceita em {formatDate(memory.accepted_at)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Ícone de edição */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-blue-500 text-sm">✏️</span>
                      </div>
                      {/* Tag da frente de vida */}
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${lifeFront.color}`}>
                        <span className="mr-1">{lifeFront.emoji}</span>
                        {lifeFront.label}
                      </span>
                      
                      {/* Status da memória */}
                      <div className="relative group">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${status.color} cursor-help`}>
                          <span className="mr-1">{status.icon}</span>
                          {status.text}
                        </span>
                        {/* Tooltip */}
                        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          {status.description}
                          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preview das notas (se existirem) */}
                  {memory.notes && memory.notes.trim().length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border border-blue-100">
                      <div className="flex items-start space-x-2">
                        <span className="text-blue-500 text-lg">💭</span>
                        <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                          {memory.notes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Preview das mídias (se existirem) */}
                  {memory.media && memory.media.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-gray-500">📸</span>
                        <span className="text-sm text-gray-600 font-medium">
                          {memory.media.length} {memory.media.length === 1 ? 'foto' : 'fotos'} anexada{memory.media.length === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {memory.media.slice(0, 3).map((url, index) => (
                          <div key={index} className="relative">
                            <img
                              src={url}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-16 object-cover rounded-lg shadow-sm"
                            />
                            {index === 2 && memory.media && memory.media.length > 3 && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                  +{memory.media.length - 3}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mood (se existir) */}
                  {memory.mood && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">😊</span>
                        <span className="text-sm text-gray-600">
                          Sentimento: <span className="font-medium text-gray-700 capitalize">{memory.mood}</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Estatísticas */}
        {memories.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Resumo do seu diário</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{memories.length}</div>
                <div className="text-sm text-gray-600">Experiências aceitas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">
                  {memories.filter(m => m.notes && m.media && m.media.length > 0 && m.mood).length}
                </div>
                <div className="text-sm text-gray-600">Memórias completas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {memories.filter(m => m.notes || (m.media && m.media.length > 0) || m.mood).length}
                </div>
                <div className="text-sm text-gray-600">Com detalhes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {memories.filter(m => !m.notes && (!m.media || m.media.length === 0) && !m.mood).length}
                </div>
                <div className="text-sm text-gray-600">Em branco</div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de registro de memória */}
        <MemoryRegistrationModal
          memory={selectedMemory}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleMemoryUpdate}
        />
      </div>
    </div>
  )
}