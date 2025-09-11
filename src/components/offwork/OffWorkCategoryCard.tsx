import React from 'react'
import { OffWorkCategory, OffWorkActivity, CreateActivityData } from '@/types/offwork'

interface OffWorkCategoryCardProps {
  category: OffWorkCategory
  activities: OffWorkActivity[]
  isExpanded: boolean
  onToggle: () => void
  onCreateActivity: (data: CreateActivityData) => Promise<OffWorkActivity>
  loading?: boolean
}

export function OffWorkCategoryCard({
  category,
  activities,
  isExpanded,
  onToggle,
  onCreateActivity,
  loading = false
}: OffWorkCategoryCardProps) {
  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-500',
      green: 'bg-green-100 text-green-500',
      orange: 'bg-orange-100 text-orange-500',
      purple: 'bg-purple-100 text-purple-500',
      cyan: 'bg-cyan-100 text-cyan-500',
      pink: 'bg-pink-100 text-pink-500',
      indigo: 'bg-indigo-100 text-indigo-500',
      yellow: 'bg-yellow-100 text-yellow-500',
    }
    return colorMap[color] || 'bg-gray-100 text-gray-500'
  }

  const handleCreateActivity = () => {
    onCreateActivity({
      category_id: category.id,
      title: `Nova atividade de ${category.name.toLowerCase()}`,
      description: 'Descreva sua atividade aqui...'
    })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${getColorClasses(category.color)}`}>
              <div className="w-4 h-4 rounded-full bg-current"></div>
            </div>
            <span className="font-medium text-gray-900">{category.name}</span>
            {activities.length > 0 && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {activities.length}
              </span>
            )}
          </div>
          <svg className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="py-4">
            {loading ? (
              <div className="text-center text-gray-500">
                <p>Carregando...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.length > 0 ? (
                  activities.map((activity) => (
                    <div key={activity.id} className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900">{activity.title}</h4>
                      {activity.description && (
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                          activity.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {activity.status === 'completed' ? 'Concluída' :
                           activity.status === 'in_progress' ? 'Em andamento' : 'Pendente'}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          activity.priority === 'high' ? 'bg-red-100 text-red-800' :
                          activity.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {activity.priority === 'high' ? 'Alta' :
                           activity.priority === 'medium' ? 'Média' : 'Baixa'}
                        </span>
                        {activity.estimated_duration && (
                          <span className="text-xs text-gray-500">
                            {activity.estimated_duration}min
                          </span>
                        )}
                      </div>
                      {activity.tags && activity.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {activity.tags.map((tag, index) => (
                            <span key={index} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500">
                    <p>Nenhuma atividade de {category.name.toLowerCase()} ainda.</p>
                    <button
                      onClick={handleCreateActivity}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Adicionar atividade
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
