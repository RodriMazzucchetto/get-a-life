'use client'

import React, { useState, useRef, useEffect } from 'react'

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

  // Função para arredondar para múltiplos de 5
  const roundToNearest5 = (value: number) => {
    return Math.round(value / 5) * 5
  }

  // Função para calcular progresso baseado na posição do mouse
  const calculateProgress = (clientX: number) => {
    if (!barRef.current) return progress

    const rect = barRef.current.getBoundingClientRect()
    const clickX = clientX - rect.left
    const barWidth = rect.width
    const newProgress = (clickX / barWidth) * 100

    // Limitar entre 0 e 100
    const clampedProgress = Math.max(0, Math.min(100, newProgress))
    
    // Arredondar para múltiplos de 5
    return roundToNearest5(clampedProgress)
  }

  // Função para lidar com clique na barra
  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const newProgress = calculateProgress(e.clientX)
    onProgressChange(newProgress)
  }

  // Função para lidar com início do arrasto
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    setDragProgress(calculateProgress(e.clientX))
  }

  // Função para lidar com movimento do mouse
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return

    const newProgress = calculateProgress(e.clientX)
    setDragProgress(newProgress)
  }

  // Função para lidar com fim do arrasto
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false)
      const finalProgress = roundToNearest5(dragProgress)
      onProgressChange(finalProgress)
    }
  }

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
  }, [isDragging, dragProgress])

  // Progresso atual (dragProgress durante arrasto, progress durante exibição)
  const currentProgress = isDragging ? dragProgress : progress
  const roundedProgress = roundToNearest5(currentProgress)

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-600">Progresso</span>
        <span className="text-xs font-medium text-gray-900">{roundedProgress}%</span>
      </div>
      
      <div 
        ref={barRef}
        className="relative w-full bg-gray-200 rounded-full h-2 cursor-pointer hover:bg-gray-300 transition-colors"
        onClick={handleBarClick}
        onMouseDown={handleMouseDown}
      >
        {/* Barra de progresso */}
        <div 
          className={`h-2 rounded-full transition-all duration-200 ${getProgressColor(roundedProgress)}`}
          style={{ width: `${roundedProgress}%` }}
        />
        
        {/* Indicador de arrasto */}
        {isDragging && (
          <div 
            className="absolute top-0 w-4 h-4 bg-white border-2 border-gray-400 rounded-full shadow-lg transform -translate-y-1 -translate-x-2 cursor-grab active:cursor-grabbing"
            style={{ left: `${roundedProgress}%` }}
          />
        )}
        
        {/* Tooltip durante arrasto */}
        {isDragging && (
          <div 
            className="absolute bottom-6 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap"
            style={{ left: `${roundedProgress}%` }}
          >
            {roundedProgress}%
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

