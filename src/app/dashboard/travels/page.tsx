'use client'

import { useState } from 'react'

export default function TravelsPage() {
  const [loading] = useState(false)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">✈️ Viagens</h1>
        <p className="text-gray-600 mt-2">
          Planeje suas próximas aventuras e explore novos lugares
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🌍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Funcionalidade em Desenvolvimento
          </h3>
          <p className="text-gray-500">
            Em breve você poderá planejar e organizar suas viagens aqui!
          </p>
        </div>
      </div>
    </div>
  )
}
