'use client'

import { useState } from 'react'

interface TripDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  trip: { type: string; title: string } | null
  onAddPlannedTrip: (tripData: { type: string; title: string; date: string; location: string; description: string; todos: string[] }) => void
}

export default function TripDetailsModal({ isOpen, onClose, trip, onAddPlannedTrip }: TripDetailsModalProps) {
  const [tripData, setTripData] = useState({
    date: '',
    location: '',
    description: '',
    todos: ['', '', '']
  })

  if (!isOpen || !trip) return null

  const handleSave = () => {
    if (!tripData.location.trim()) {
      alert('Por favor, insira uma localização para a viagem')
      return
    }
    
    const tripToSave = {
      type: trip?.type || '',
      title: trip?.title || '',
      date: tripData.date,
      location: tripData.location,
      description: tripData.description,
      todos: tripData.todos.filter(todo => todo.trim() !== '')
    }
    
    onAddPlannedTrip(tripToSave)
    onClose()
  }

  const addTodo = () => {
    setTripData(prev => ({
      ...prev,
      todos: [...prev.todos, '']
    }))
  }

  const updateTodo = (index: number, value: string) => {
    setTripData(prev => ({
      ...prev,
      todos: prev.todos.map((todo, i) => i === index ? value : todo)
    }))
  }

  const removeTodo = (index: number) => {
    setTripData(prev => ({
      ...prev,
      todos: prev.todos.filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{trip.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Data da Viagem */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data da Viagem
            </label>
            <input
              type="date"
              value={tripData.date}
              onChange={(e) => setTripData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Localização */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Localização
            </label>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Digite a cidade ou país"
                value={tripData.location}
                onChange={(e) => setTripData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {tripData.location && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-purple-800">
                      Pin roxo será adicionado no mapa para: {tripData.location}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição da Viagem
            </label>
            <textarea
              placeholder="Descreva sua viagem planejada..."
              value={tripData.description}
              onChange={(e) => setTripData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Lista de Tarefas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Tarefas para a Viagem
              </label>
              <button
                onClick={addTodo}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + Adicionar
              </button>
            </div>
            
            <div className="space-y-2">
              {tripData.todos.map((todo, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Digite uma tarefa..."
                    value={todo}
                    onChange={(e) => updateTodo(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => removeTodo(index)}
                    className="text-red-600 hover:text-red-800 px-2 py-2"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Salvar Viagem
          </button>
        </div>
      </div>
    </div>
  )
}
