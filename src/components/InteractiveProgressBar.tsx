'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'

interface InteractiveProgressBarProps {
  progress: number
  onProgressChange: (newProgress: number) => void
  className?: string
}

export default function InteractiveProgressBar({ 
  progress, 
  onProgressChange, 
  className = '' 
}: InteractiveProgressBarProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragProgress, setDragProgress] = useState(progress)
  const barRef = useRef<HTMLDivElement>(null)

  // Sincronizar dragProgress com progress quando prop muda
  useEffect(() => {
    setDragProgress(progress)
  }, [progress])

  // Função para calcular cor baseada no progresso
  const getProgressColor = (progressValue: number) => {
    if (progressValue >= 80) {
      return 'bg-green-500'
    } else if (progressValue >= 60) {
      return 'bg-green-400'
    } else if (progressValue >= 40) {
      return 'bg-yellow-500'
    } else if (progressValue >= 20) {
      return 'bg-orange-500'
    } else {
      return 'bg-red-500'
    }
  }

  // Função para calcular progresso baseado na posição do mouse
  const calculateProgress = useCallback((clientX: number) => {
    if (!barRef.current) return progress

    const rect = barRef.current.getBoundingClientRect()
    const clickX = clientX - rect.left
    const barWidth = rect.width
    const newProgress = (clickX / barWidth) * 100

    // Limitar entre 0 e 100
    return Math.max(0, Math.min(100, newProgress))
  }, [progress])

  // Função para lidar com clique na barra
  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const newProgress = calculateProgress(e.clientX)
    onProgressChange(newProgress)
  }

  // Função para lidar com início do arrasto
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    setDragProgress(calculateProgress(e.clientX))
  }

  // Função para lidar com movimento do mouse
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return

    e.preventDefault()
    const newProgress = calculateProgress(e.clientX)
    setDragProgress(newProgress)
  }, [isDragging, calculateProgress])

  // Função para lidar com fim do arrasto
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
      onProgressChange(dragProgress)
    }
  }, [isDragging, dragProgress, onProgressChange])

  // Adicionar/remover event listeners para mouse
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Progresso atual (dragProgress durante arrasto, progress durante exibição)
  const currentProgress = isDragging ? dragProgress : progress

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-600">Progresso</span>
        <span className="text-xs font-medium text-gray-900">{Math.round(currentProgress)}%</span>
      </div>
      
      <div 
        ref={barRef}
        className="relative w-full bg-gray-200 rounded-full h-3 cursor-pointer hover:bg-gray-300 transition-colors"
        onClick={handleBarClick}
        onMouseDown={handleMouseDown}
        style={{ userSelect: 'none' }}
      >
        {/* Barra de progresso */}
        <div 
          className={`h-3 rounded-full transition-all duration-200 ${getProgressColor(currentProgress)}`}
          style={{ width: `${currentProgress}%` }}
        />
        
        {/* Indicador de arrasto sempre visível */}
        <div 
          className="absolute top-0 w-5 h-5 bg-white border-2 border-gray-400 rounded-full shadow-lg transform -translate-y-1 -translate-x-2.5 cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
          style={{ left: `${currentProgress}%` }}
        />
        
        {/* Tooltip durante arrasto */}
        {isDragging && (
          <div 
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap z-10"
            style={{ left: `${currentProgress}%` }}
          >
            {Math.round(currentProgress)}%
          </div>
        )}
      </div>
      
      {/* Indicadores de porcentagem */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
    </div>
  )
}

