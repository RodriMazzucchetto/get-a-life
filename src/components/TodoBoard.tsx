'use client'

import React from 'react'
import { DndContext, DragEndEvent, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useTodos, TodoStatus } from '@/hooks/useTodos'
import { TodoColumn } from './TodoColumn'

export function TodoBoard() {
  const { todosByStatus, moveTodo, calculateNewRank, isLoading } = useTodos()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // UMA ÚNICA FUNÇÃO PARA TODOS OS CASOS DE DnD
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) return

    const todoId = active.id as string
    const overId = over.id as string

    // Detectar destino
    let targetStatus: TodoStatus
    let targetPosition: string | undefined

    // Verificar se está soltando em um container (área vazia)
    if (['backlog', 'current_week', 'in_progress'].includes(overId)) {
      targetStatus = overId as TodoStatus
      targetPosition = undefined // Vai para o final
    } else {
      // Está soltando em um item específico
      const targetTodo = todosByStatus.backlog.find(t => t.id === overId) ||
                        todosByStatus.current_week.find(t => t.id === overId) ||
                        todosByStatus.in_progress.find(t => t.id === overId)
      
      if (!targetTodo) return

      targetStatus = targetTodo.status
      targetPosition = targetTodo.id
    }

    // Calcular nova posição
    const newRank = calculateNewRank(targetStatus, targetPosition)

    // Mover (função atômica)
    moveTodo(todoId, targetStatus, newRank).catch(error => {
      console.error('❌ Erro no drag & drop:', error)
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando todos...</div>
      </div>
    )
  }

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-3 gap-6 p-6">
        <TodoColumn 
          title="Backlog" 
          todos={todosByStatus.backlog}
          status="backlog"
        />
        
        <TodoColumn 
          title="Semana Atual" 
          todos={todosByStatus.current_week}
          status="current_week"
        />
        
        <TodoColumn 
          title="Em Progresso" 
          todos={todosByStatus.in_progress}
          status="in_progress"
        />
      </div>

      <DragOverlay>
        {/* Placeholder para o item sendo arrastado */}
      </DragOverlay>
    </DndContext>
  )
}

