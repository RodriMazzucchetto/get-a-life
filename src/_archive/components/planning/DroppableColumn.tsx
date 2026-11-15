'use client'

import { useDroppable } from '@dnd-kit/core'

type DroppableColumnProps = {
  id: string
  children: React.ReactNode
  className?: string
}

export function DroppableColumn({ id, children, className = '' }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[120px] rounded-lg transition-colors ${isOver ? 'ring-2 ring-blue-400 ring-offset-2 bg-blue-50/30' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
