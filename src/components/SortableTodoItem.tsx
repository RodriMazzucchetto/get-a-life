'use client'

import React, { memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Todo } from '@/lib/planning'

interface SortableTodoItemProps {
  todo: Todo
}

export const SortableTodoItem = memo(function SortableTodoItem({ todo }: SortableTodoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-white rounded-lg border border-gray-200 p-4 cursor-grab active:cursor-grabbing
        hover:shadow-md transition-shadow duration-200
        ${isDragging ? 'shadow-lg z-50' : ''}
        ${todo.onHold ? 'opacity-60 border-orange-300' : ''}
        ${todo.isHighPriority ? 'border-l-4 border-l-red-500' : ''}
      `}
    >
      {/* Header do todo */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 text-sm leading-tight">
          {todo.title}
        </h4>
        
        <div className="flex items-center space-x-1 ml-2">
          {todo.isHighPriority && (
            <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">
              Alta
            </span>
          )}
          {todo.onHold && (
            <span className="px-1.5 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">
              Pausado
            </span>
          )}
        </div>
      </div>

      {/* Descrição */}
      {todo.description && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
          {todo.description}
        </p>
      )}

      {/* Footer com informações */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-2">
          {todo.priority !== 'medium' && (
            <span className={`px-1.5 py-0.5 rounded ${
              todo.priority === 'high' ? 'bg-red-100 text-red-700' :
              todo.priority === 'low' ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {todo.priority === 'high' ? 'Alta' : 
               todo.priority === 'low' ? 'Baixa' : 'Média'}
            </span>
          )}
          
          {todo.category && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
              {todo.category}
            </span>
          )}
        </div>

        {todo.dueDate && (
          <span className="text-gray-400">
            {new Date(todo.dueDate).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>

      {/* Rank para debug (remover em produção) */}
      {process.env.NODE_ENV === 'development' && todo.rank && (
        <div className="mt-2 text-xs text-gray-400 font-mono">
          rank: {todo.rank}
        </div>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // Comparação otimizada para evitar re-renders desnecessários
  return (
    prevProps.todo.id === nextProps.todo.id &&
    prevProps.todo.title === nextProps.todo.title &&
    prevProps.todo.description === nextProps.todo.description &&
    prevProps.todo.status === nextProps.todo.status &&
    prevProps.todo.onHold === nextProps.todo.onHold &&
    prevProps.todo.isHighPriority === nextProps.todo.isHighPriority &&
    prevProps.todo.priority === nextProps.todo.priority &&
    prevProps.todo.category === nextProps.todo.category &&
    prevProps.todo.rank === nextProps.todo.rank
  )
})
