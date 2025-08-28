'use client'

import { useState } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'

export default function OffWorkPage() {
  const { user } = useAuthContext()
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedActivity, setSelectedActivity] = useState<string>('')

  const categories = [
    {
      id: 'relaxation',
      name: 'Relaxamento',
      icon: '🧘‍♀️',
      description: 'Atividades para desestressar e relaxar'
    },
    {
      id: 'creativity',
      name: 'Criatividade',
      icon: '🎨',
      description: 'Expressar sua criatividade e imaginação'
    },
    {
      id: 'social',
      name: 'Social',
      icon: '🤝',
      description: 'Conectar com amigos e família'
    },
    {
      id: 'learning',
      name: 'Aprendizado',
      icon: '📚',
      description: 'Desenvolver novas habilidades'
    },
    {
      id: 'movement',
      name: 'Movimento',
      icon: '🏃‍♂️',
      description: 'Atividades físicas leves e divertidas'
    },
    {
      id: 'nature',
      name: 'Natureza',
      icon: '🌿',
      description: 'Conectar com o mundo natural'
    }
  ]

  const activities = {
    relaxation: [
      'Meditação guiada (10 min)',
      'Banho relaxante com música',
      'Leitura de um livro favorito',
      'Jardinagem ou cuidado de plantas',
      'Pintura por números',
      'Escutar música instrumental'
    ],
    creativity: [
      'Desenhar ou pintar livremente',
      'Escrever um conto curto',
      'Fazer artesanato com materiais reciclados',
      'Criar uma playlist personalizada',
      'Fotografar objetos do cotidiano',
      'Cozinhar uma receita nova'
    ],
    social: [
      'Ligar para um amigo ou familiar',
      'Organizar um encontro virtual',
      'Jogar um jogo de tabuleiro online',
      'Participar de um grupo de interesse',
      'Fazer uma videochamada surpresa',
      'Compartilhar memórias antigas'
    ],
    learning: [
      'Aprender uma nova língua (app)',
      'Fazer um curso online gratuito',
      'Ler um artigo sobre um tema novo',
      'Pesquisar sobre um hobby',
      'Aprender a tocar um instrumento',
      'Estudar sobre um país diferente'
    ],
    movement: [
      'Dança livre em casa',
      'Yoga para iniciantes',
      'Caminhada no bairro',
      'Exercícios de alongamento',
      'Jogar com um pet',
      'Dança com vídeo game'
    ],
    nature: [
      'Observar pássaros pela janela',
      'Caminhar em um parque próximo',
      'Fazer um piquenique no quintal',
      'Plantar sementes ou mudas',
      'Observar as nuvens',
      'Fazer uma trilha urbana'
    ]
  }

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setSelectedActivity('')
  }

  const handleActivitySelect = (activity: string) => {
    setSelectedActivity(activity)
  }

  const getRandomActivity = () => {
    if (!selectedCategory) return
    const categoryActivities = activities[selectedCategory as keyof typeof activities]
    const randomIndex = Math.floor(Math.random() * categoryActivities.length)
    setSelectedActivity(categoryActivities[randomIndex])
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🎯 Off Work
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Encontre atividades perfeitas para seu tempo livre e transforme momentos de ócio em experiências significativas
        </p>
      </div>

      {/* Categorias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategorySelect(category.id)}
            className={`p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
              selectedCategory === category.id
                ? 'border-blue-500 bg-blue-50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <div className="text-center">
              <div className="text-4xl mb-3">{category.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {category.name}
              </h3>
              <p className="text-sm text-gray-600">
                {category.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Atividades da categoria selecionada */}
      {selectedCategory && (
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Atividades de {categories.find(c => c.id === selectedCategory)?.name}
            </h2>
            <button
              onClick={getRandomActivity}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🎲 Surpreenda-me
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activities[selectedCategory as keyof typeof activities].map((activity, index) => (
              <button
                key={index}
                onClick={() => handleActivitySelect(activity)}
                className={`p-4 rounded-lg border-2 text-left transition-all duration-200 hover:scale-105 ${
                  selectedActivity === activity
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-sm font-medium text-gray-900">
                  {activity}
                </span>
                {selectedActivity === activity && (
                  <div className="mt-2 text-xs text-green-600 font-medium">
                    ✅ Selecionado
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Atividade selecionada */}
      {selectedActivity && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8 text-center border border-green-200">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Atividade Escolhida!
          </h3>
          <p className="text-lg text-gray-700 mb-6">
            {selectedActivity}
          </p>
          <div className="space-y-3 text-sm text-gray-600">
            <p>✨ Aproveite esse momento para se desconectar do trabalho</p>
            <p>🌟 Transforme seu tempo livre em uma experiência valiosa</p>
            <p>💡 Lembre-se: pequenas atividades podem trazer grandes satisfações</p>
          </div>
        </div>
      )}

      {/* Dicas extras */}
      <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3">
          💡 Dicas para aproveitar melhor seu tempo livre:
        </h3>
        <ul className="space-y-2 text-sm text-yellow-700">
          <li>• Reserve pelo menos 30 minutos por dia para atividades pessoais</li>
          <li>• Desligue notificações do trabalho durante seu tempo livre</li>
          <li>• Experimente atividades diferentes para descobrir novos interesses</li>
          <li>• Compartilhe suas experiências com amigos e familiares</li>
          <li>• Mantenha um registro das atividades que mais te fazem feliz</li>
        </ul>
      </div>
    </div>
  )
}
