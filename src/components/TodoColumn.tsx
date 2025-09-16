'use client'

import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Todo } from '@/lib/planning'
import { TodoStatus } from '@/hooks/useTodos'
import { SortableTodoItem } from './SortableTodoItem'

interface TodoColumnProps {
  title: string
  todos: Todo[]
  status: TodoStatus
}

export function TodoColumn({ title, todos, status }: TodoColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ 
    id: status,
    data: { type: 'column', status }
  })

  const todoIds = todos.map(todo => todo.id)

  return (
    <div className="flex flex-col h-full">
      {/* Header da coluna */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
          {todos.length}
        </span>
      </div>

      {/* Área droppable */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 min-h-[400px] p-4 rounded-lg border-2 border-dashed transition-colors
          ${isOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-200 bg-gray-50'
          }
        `}
      >
        <SortableContext 
          items={todoIds} 
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {todos.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400">
                <div className="text-center">
                  <div className="text-sm">Nenhum item</div>
                  <div className="text-xs mt-1">Arraste itens aqui</div>
                </div>
              </div>
            ) : (
              todos.map(todo => (
                <SortableTodoItem 
                  key={todo.id}
                  todo={todo}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}
