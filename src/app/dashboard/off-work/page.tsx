'use client'

import { useState } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'

interface Activity {
  id: string
  name: string
  description?: string
  completed: boolean
  category: string
  priority: 'low' | 'medium' | 'high'
  estimatedTime?: string
  location?: string
  cost?: string
}

export default function OffWorkPage() {
  const { user } = useAuthContext()
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([
    // Viagens
    { id: '1', name: 'Morretes - Bate volta', category: 'viagens', completed: false, priority: 'medium', estimatedTime: '1 dia', location: 'PR', cost: 'Baixo' },
    { id: '2', name: 'Antonina - Bate volta', category: 'viagens', completed: false, priority: 'medium', estimatedTime: '1 dia', location: 'PR', cost: 'Baixo' },
    { id: '3', name: 'Parque Estadual do Pau Oco', category: 'viagens', completed: false, priority: 'high', estimatedTime: '1 dia', location: 'PR', cost: 'Baixo' },
    { id: '4', name: 'South of France', category: 'viagens', completed: false, priority: 'high', estimatedTime: '1-2 semanas', location: 'França', cost: 'Alto' },
    { id: '5', name: 'Northern Italy', category: 'viagens', completed: false, priority: 'high', estimatedTime: '1-2 semanas', location: 'Itália', cost: 'Alto' },
    { id: '6', name: 'Bariloche', category: 'viagens', completed: false, priority: 'medium', estimatedTime: '1 semana', location: 'Argentina', cost: 'Médio' },
    { id: '7', name: 'Jerusalem - Viagem espiritual', category: 'viagens', completed: false, priority: 'high', estimatedTime: '1 semana', location: 'Israel', cost: 'Alto' },
    
    // Crescimento Pessoal
    { id: '8', name: 'Terapia ou Coaching', category: 'crescimento', completed: false, priority: 'high', estimatedTime: '1h/semana', cost: 'Médio' },
    { id: '9', name: 'Escrita Reflexiva', category: 'crescimento', completed: false, priority: 'medium', estimatedTime: '30min/dia', cost: 'Baixo' },
    { id: '10', name: 'Estudo Bíblico', category: 'crescimento', completed: false, priority: 'high', estimatedTime: '1h/dia', cost: 'Baixo' },
    { id: '11', name: 'Meditações', category: 'crescimento', completed: false, priority: 'medium', estimatedTime: '20min/dia', cost: 'Baixo' },
    { id: '12', name: 'Novos Idiomas', category: 'crescimento', completed: false, priority: 'medium', estimatedTime: '1h/dia', cost: 'Baixo' },
    
    // Mini Aventuras
    { id: '13', name: 'Exploração Urbana', category: 'mini-aventuras', completed: false, priority: 'low', estimatedTime: '2-3h', cost: 'Baixo' },
    { id: '14', name: 'Evento aleatório do Meetup', category: 'mini-aventuras', completed: false, priority: 'low', estimatedTime: '2-4h', cost: 'Baixo' },
    { id: '15', name: 'Museu Oscar Niemeyer', category: 'mini-aventuras', completed: false, priority: 'medium', estimatedTime: '3-4h', location: 'Curitiba', cost: 'Baixo' },
    { id: '16', name: 'Teatro ou stand-up', category: 'mini-aventuras', completed: false, priority: 'medium', estimatedTime: '2-3h', cost: 'Médio' },
    { id: '17', name: 'Escalada Indoor', category: 'mini-aventuras', completed: false, priority: 'medium', estimatedTime: '2-3h', cost: 'Médio' },
    { id: '18', name: 'Bike Noturna', category: 'mini-aventuras', completed: false, priority: 'low', estimatedTime: '1-2h', cost: 'Baixo' },
    { id: '19', name: 'Cozinhar Algo Exótico', category: 'mini-aventuras', completed: false, priority: 'low', estimatedTime: '2-3h', cost: 'Baixo' },
    
    // Esporte
    { id: '20', name: 'Treino MT 3x semana', category: 'esporte', completed: false, priority: 'high', estimatedTime: '1h/sessão', cost: 'Baixo' },
    { id: '21', name: 'Treino Musc 6x semana', category: 'esporte', completed: false, priority: 'high', estimatedTime: '1h/sessão', cost: 'Baixo' },
    { id: '22', name: 'Stand Up Paddle', category: 'esporte', completed: false, priority: 'medium', estimatedTime: '2-3h', cost: 'Médio' },
    { id: '23', name: 'Surf', category: 'esporte', completed: false, priority: 'medium', estimatedTime: '2-3h', cost: 'Médio' },
    
    // Social
    { id: '24', name: 'Sauna Semanal', category: 'social', completed: false, priority: 'medium', estimatedTime: '2h', cost: 'Médio' },
    { id: '25', name: 'Bera com brothers 1x no mês', category: 'social', completed: false, priority: 'high', estimatedTime: '3-4h', cost: 'Médio' },
    { id: '26', name: 'Algo com a mulher', category: 'social', completed: false, priority: 'high', estimatedTime: '4-6h', cost: 'Variável' },
    { id: '27', name: 'Company retreat 1x ano', category: 'social', completed: false, priority: 'medium', estimatedTime: '2-3 dias', cost: 'Baixo' },
    { id: '28', name: 'Voluntariado', category: 'social', completed: false, priority: 'medium', estimatedTime: '2-4h/semana', cost: 'Baixo' },
    
    // Relacionamentos
    { id: '29', name: 'Microaventuras a dois', category: 'relacionamentos', completed: false, priority: 'high', estimatedTime: '4-6h', cost: 'Médio' },
    { id: '30', name: 'Conversas diferentes', category: 'relacionamentos', completed: false, priority: 'medium', estimatedTime: '1-2h', cost: 'Baixo' },
    { id: '31', name: 'Pequenos Rituais', category: 'relacionamentos', completed: false, priority: 'medium', estimatedTime: '30min', cost: 'Baixo' },
    { id: '32', name: 'Surpresas', category: 'relacionamentos', completed: false, priority: 'medium', estimatedTime: '2-4h', cost: 'Variável' },
    
    // Hobbies
    { id: '33', name: 'Pintura', category: 'hobbies', completed: false, priority: 'low', estimatedTime: '2-3h', cost: 'Médio' },
    { id: '34', name: 'Cerâmica', category: 'hobbies', completed: false, priority: 'low', estimatedTime: '3-4h', cost: 'Médio' },
    { id: '35', name: 'Piano com indicadores', category: 'hobbies', completed: false, priority: 'medium', estimatedTime: '1h/dia', cost: 'Médio' },
    { id: '36', name: 'Jogos PC', category: 'hobbies', completed: false, priority: 'low', estimatedTime: '2-3h', cost: 'Baixo' },
    { id: '37', name: 'Board games', category: 'hobbies', completed: false, priority: 'low', estimatedTime: '2-4h', cost: 'Baixo' },
    { id: '38', name: 'Cozinhar pratos específicos', category: 'hobbies', completed: false, priority: 'medium', estimatedTime: '2-4h', cost: 'Médio' },
    { id: '39', name: 'Cultura Biker', category: 'hobbies', completed: false, priority: 'medium', estimatedTime: '4-6h', cost: 'Médio' },
    
    // Lifestyle
    { id: '40', name: 'Cursos de culinária', category: 'lifestyle', completed: false, priority: 'medium', estimatedTime: '4-6h', cost: 'Médio' },
    { id: '41', name: 'Degustações', category: 'lifestyle', completed: false, priority: 'low', estimatedTime: '2-3h', cost: 'Médio' },
    { id: '42', name: 'Autocuidado', category: 'lifestyle', completed: false, priority: 'medium', estimatedTime: '1-2h', cost: 'Variável' },
    { id: '43', name: 'Decoração da casa', category: 'lifestyle', completed: false, priority: 'low', estimatedTime: '3-4h', cost: 'Médio' },
    { id: '44', name: 'Spas Urbanos', category: 'lifestyle', completed: false, priority: 'low', estimatedTime: '3-4h', cost: 'Alto' },
    { id: '45', name: 'Hotel Boutique', category: 'lifestyle', completed: false, priority: 'low', estimatedTime: '24h', cost: 'Alto' }
  ])

  const categories = [
    {
      id: 'viagens',
      name: 'Viagens',
      icon: '✈️',
      color: 'bg-green-100 border-green-300 text-green-800',
      description: 'Explorações locais e internacionais'
    },
    {
      id: 'crescimento',
      name: 'Crescimento',
      icon: '🌱',
      color: 'bg-pink-100 border-pink-300 text-pink-800',
      description: 'Desenvolvimento pessoal e espiritual'
    },
    {
      id: 'mini-aventuras',
      name: 'Mini Aventuras',
      icon: '🎯',
      color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      description: 'Experiências únicas e culturais'
    },
    {
      id: 'esporte',
      name: 'Esporte',
      icon: '🏃‍♂️',
      color: 'bg-blue-100 border-blue-300 text-blue-800',
      description: 'Atividades físicas e esportivas'
    },
    {
      id: 'social',
      name: 'Social',
      icon: '🤝',
      color: 'bg-orange-100 border-orange-300 text-orange-800',
      description: 'Conexões e compromissos sociais'
    },
    {
      id: 'relacionamentos',
      name: 'Relacionamentos',
      icon: '💕',
      color: 'bg-red-100 border-red-300 text-red-800',
      description: 'Conexões afetivas e familiares'
    },
    {
      id: 'hobbies',
      name: 'Hobbies',
      icon: '🎨',
      color: 'bg-purple-100 border-purple-300 text-purple-800',
      description: 'Passatempos criativos e intelectuais'
    },
    {
      id: 'lifestyle',
      name: 'Lifestyle',
      icon: '✨',
      color: 'bg-emerald-100 border-emerald-300 text-emerald-800',
      description: 'Qualidade de vida e experiências premium'
    }
  ]

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setSelectedActivity(null)
  }

  const handleActivitySelect = (activity: Activity) => {
    setSelectedActivity(activity)
  }

  const toggleActivityComplete = (activityId: string) => {
    setActivities(prev => prev.map(activity => 
      activity.id === activityId 
        ? { ...activity, completed: !activity.completed }
        : activity
    ))
  }

  const getFilteredActivities = () => {
    if (!selectedCategory) return activities
    return activities.filter(activity => activity.category === selectedCategory)
  }

  const getCompletedCount = (categoryId?: string) => {
    const activitiesToCount = categoryId 
      ? activities.filter(a => a.category === categoryId)
      : activities
    return activitiesToCount.filter(a => a.completed).length
  }

  const getTotalCount = (categoryId?: string) => {
    return categoryId 
      ? activities.filter(a => a.category === categoryId).length
      : activities.length
  }

  const getRandomActivity = () => {
    const availableActivities = activities.filter(a => !a.completed)
    if (availableActivities.length === 0) return
    const randomIndex = Math.floor(Math.random() * availableActivities.length)
    setSelectedActivity(availableActivities[randomIndex])
    setSelectedCategory(availableActivities[randomIndex].category)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'low': return 'bg-green-100 text-green-800 border-green-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta'
      case 'medium': return 'Média'
      case 'low': return 'Baixa'
      default: return 'Não definida'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🎯 Off Work - Estruturando Minha Vida
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Transforme suas ideias em ações concretas. Organize, priorize e execute as atividades que tornarão sua vida fora do trabalho mais interessante e significativa.
        </p>
        
        {/* Estatísticas gerais */}
        <div className="mt-6 flex justify-center space-x-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{getCompletedCount()}</div>
            <div className="text-sm text-gray-600">Concluídas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{getTotalCount()}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round((getCompletedCount() / getTotalCount()) * 100)}%
            </div>
            <div className="text-sm text-gray-600">Progresso</div>
          </div>
        </div>
      </div>

      {/* Botão Surpreenda-me */}
      <div className="text-center">
        <button
          onClick={getRandomActivity}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          🎲 Surpreenda-me com uma atividade!
        </button>
      </div>

      {/* Categorias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((category) => {
          const completedCount = getCompletedCount(category.id)
          const totalCount = getTotalCount(category.id)
          const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
          
          return (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                selectedCategory === category.id
                  ? 'border-2 border-blue-500 shadow-lg scale-105'
                  : 'hover:shadow-md'
              } ${category.color}`}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">{category.icon}</div>
                <h3 className="font-semibold mb-1">{category.name}</h3>
                <p className="text-xs mb-3 opacity-80">{category.description}</p>
                
                {/* Progresso da categoria */}
                <div className="w-full bg-white bg-opacity-50 rounded-full h-2 mb-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                <div className="text-xs font-medium">
                  {completedCount}/{totalCount} concluídas
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Atividades da categoria selecionada */}
      {selectedCategory && (
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {categories.find(c => c.id === selectedCategory)?.name} - Atividades
            </h2>
            <div className="text-sm text-gray-600">
              {getCompletedCount(selectedCategory)} de {getTotalCount(selectedCategory)} concluídas
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getFilteredActivities().map((activity) => (
              <div
                key={activity.id}
                className={`p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 cursor-pointer ${
                  activity.completed
                    ? 'border-green-500 bg-green-50'
                    : selectedActivity?.id === activity.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleActivitySelect(activity)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className={`font-medium text-sm ${
                    activity.completed ? 'line-through text-green-700' : 'text-gray-900'
                  }`}>
                    {activity.name}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleActivityComplete(activity.id)
                    }}
                    className={`ml-2 p-1 rounded-full text-xs ${
                      activity.completed 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {activity.completed ? '✓' : '○'}
                  </button>
                </div>
                
                <div className="space-y-1 text-xs text-gray-600">
                  {activity.description && (
                    <div>{activity.description}</div>
                  )}
                  {activity.estimatedTime && (
                    <div>⏱️ {activity.estimatedTime}</div>
                  )}
                  {activity.location && (
                    <div>📍 {activity.location}</div>
                  )}
                  {activity.cost && (
                    <div>💰 {activity.cost}</div>
                  )}
                  <div className={`inline-block px-2 py-1 rounded-full text-xs border ${getPriorityColor(activity.priority)}`}>
                    {getPriorityText(activity.priority)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Atividade selecionada */}
      {selectedActivity && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 text-center border border-blue-200">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            {selectedActivity.name}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-sm">
            {selectedActivity.estimatedTime && (
              <div className="bg-white p-3 rounded-lg">
                <div className="font-semibold text-gray-700">⏱️ Tempo Estimado</div>
                <div className="text-gray-600">{selectedActivity.estimatedTime}</div>
              </div>
            )}
            {selectedActivity.location && (
              <div className="bg-white p-3 rounded-lg">
                <div className="font-semibold text-gray-700">📍 Localização</div>
                <div className="text-gray-600">{selectedActivity.location}</div>
              </div>
            )}
            {selectedActivity.cost && (
              <div className="bg-white p-3 rounded-lg">
                <div className="font-semibold text-gray-700">💰 Custo</div>
                <div className="text-gray-600">{selectedActivity.cost}</div>
              </div>
            )}
          </div>
          
          <div className="space-y-3 text-sm text-gray-600">
            <p>✨ Transforme essa ideia em uma experiência real</p>
            <p>🌟 Agende um horário específico para executar</p>
            <p>💡 Compartilhe com alguém para criar responsabilidade</p>
          </div>
        </div>
      )}

      {/* Dicas de execução */}
      <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3">
          💡 Dicas para executar suas atividades Off Work:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-700">
          <ul className="space-y-2">
            <li>• Agende horários fixos na sua agenda</li>
            <li>• Comece com atividades de baixa prioridade</li>
            <li>• Combine atividades similares no mesmo dia</li>
            <li>• Use viagens como recompensa por metas atingidas</li>
          </ul>
          <ul className="space-y-2">
            <li>• Convide amigos para atividades sociais</li>
            <li>• Mantenha um registro de como se sentiu</li>
            <li>• Ajuste prioridades conforme sua energia</li>
            <li>• Celebre cada pequena conquista</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
