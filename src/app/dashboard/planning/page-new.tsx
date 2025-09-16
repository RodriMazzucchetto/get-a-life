'use client'

import React, { useState } from 'react'
import { TodoBoard } from '@/components/TodoBoard'
import { usePlanningData } from '@/hooks/usePlanningData'

export default function PlanningPageNew() {
  const { projects, goals, reminders, isLoading } = usePlanningData()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900">
              Planejamento
            </h1>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {projects.length} projetos • {goals.length} metas • {reminders.length} lembretes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Carregando...</div>
          </div>
        ) : (
          <TodoBoard />
        )}
      </div>

      {/* Debug Info (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded text-xs">
          <div>Nova Arquitetura ✅</div>
          <div>Single Source of Truth</div>
          <div>DnD Simplificado</div>
        </div>
      )}
    </div>
  )
}
