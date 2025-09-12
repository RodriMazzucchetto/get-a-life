import React from 'react'
import { OffWorkCategory, OffWorkActivity } from '@/types/offwork'

interface OffWorkCategoryCardProps {
  category: OffWorkCategory
  activities: OffWorkActivity[]
  isExpanded: boolean
  onToggle: () => void
  onPrioritizeActivity?: (activityId: string) => void
  onMarkRecurring?: (activityId: string) => void
  loading?: boolean
}

export function OffWorkCategoryCard({
  category,
  activities,
  isExpanded,
  onToggle,
  onPrioritizeActivity,
  onMarkRecurring,
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
                                <div key={activity.id} className="group p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                                  <div className="flex justify-between items-center">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-gray-900 truncate">{activity.title}</h4>
                                        {activity.description && (
                                          <span className="text-sm text-gray-500 truncate">• {activity.description}</span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                                      {/* Tags de subcategoria */}
                                      {activity.tags && activity.tags.length > 0 && (
                                        <div className="flex gap-1">
                                          {activity.tags.map((tag, index) => (
                                            <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                                              {tag}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      
                                      {/* Botões de ação - aparecem no hover */}
                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                                        {onPrioritizeActivity && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              onPrioritizeActivity(activity.id)
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                                            title="Priorizar atividade"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                            </svg>
                                          </button>
                                        )}
                                        {onMarkRecurring && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              console.log('🔄 Button clicked for activity:', activity.id)
                                              console.log('🔄 onMarkRecurring function:', onMarkRecurring)
                                              onMarkRecurring(activity.id)
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                            title="Marcar como recorrente"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                  <div className="text-center text-gray-500">
                    <p>Nenhuma atividade de {category.name.toLowerCase()} ainda.</p>
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
