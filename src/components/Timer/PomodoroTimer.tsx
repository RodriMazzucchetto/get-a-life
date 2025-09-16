'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePomodoroTimer } from '@/hooks/usePomodoroTimer'

interface PomodoroTimerProps {
  onCycleComplete?: (cyclesCompleted: number) => void
}

export default function PomodoroTimer({ onCycleComplete }: PomodoroTimerProps) {
  // Hook para gerenciar dados do pomodoro
  const { cyclesCompleted, sessionCycles, completeCycle, resetSession } = usePomodoroTimer()
  
  // Estados do timer
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutos em segundos
  const [cycleDuration, setCycleDuration] = useState(25) // em minutos
  const [isEditingDuration, setIsEditingDuration] = useState(false)
  
  // Estados da UI
  const [isPaused, setIsPaused] = useState(false)
  
  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  // Função para tocar som de notificação
  const playNotificationSound = useCallback(() => {
    try {
      // Criar um som de notificação usando Web Audio API
      const audioContext = new AudioContext()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2)
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.log('Erro ao tocar som:', error)
    }
  }, [])
  
  // Função para mostrar notificação do browser
  const showBrowserNotification = useCallback(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Ciclo Concluído! 🎉', {
          body: `Você completou ${cyclesCompleted + 1} ciclos hoje!`,
          icon: '/favicon.ico',
          tag: 'pomodoro-cycle'
        })
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Ciclo Concluído! 🎉', {
              body: `Você completou ${cyclesCompleted + 1} ciclos hoje!`,
              icon: '/favicon.ico',
              tag: 'pomodoro-cycle'
            })
          }
        })
      }
    }
  }, [cyclesCompleted])
  
  // Solicitar permissão para notificações ao montar
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])
  
  // Função para iniciar/pausar o timer
  const toggleTimer = () => {
    if (isRunning) {
      // Pausar
      setIsPaused(true)
      setIsRunning(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    } else {
      // Iniciar ou retomar
      setIsPaused(false)
      setIsRunning(true)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Ciclo concluído
            setIsRunning(false)
            setIsPaused(false)
            
            // Marcar ciclo como completo usando o hook
            const { totalCycles } = completeCycle()
            
            // Notificações
            playNotificationSound()
            showBrowserNotification()
            
            // Callback para componente pai
            if (onCycleComplete) {
              onCycleComplete(totalCycles)
            }
            
            // Resetar timer para próximo ciclo
            return cycleDuration * 60
          }
          return prev - 1
        })
      }, 1000)
    }
  }
  
  // Função para resetar o timer
  const resetTimer = () => {
    setIsRunning(false)
    setIsPaused(false)
    setTimeLeft(cycleDuration * 60)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }
  
  // Função para atualizar duração do ciclo
  const updateCycleDuration = (minutes: number) => {
    setCycleDuration(minutes)
    setTimeLeft(minutes * 60)
    setIsEditingDuration(false)
  }
  
  // Função para salvar duração editada
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (value >= 1 && value <= 120) { // Entre 1 e 120 minutos
      setCycleDuration(value)
    }
  }
  
  // Função para confirmar edição da duração
  const confirmDurationEdit = () => {
    setTimeLeft(cycleDuration * 60)
    setIsEditingDuration(false)
  }
  
  // Limpar interval ao desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])
  
  // Formatar tempo para exibição
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Ícone do Timer */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      {/* Duração Editável */}
      <div className="flex items-center gap-2">
        {isEditingDuration ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={cycleDuration}
              onChange={handleDurationChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmDurationEdit()
                if (e.key === 'Escape') setIsEditingDuration(false)
              }}
              className="w-12 px-1 py-1 text-sm border border-gray-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
              min="1"
              max="120"
              autoFocus
            />
            <span className="text-xs text-gray-500">min</span>
            <button
              onClick={confirmDurationEdit}
              className="p-1 text-green-600 hover:text-green-700"
              title="Confirmar"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditingDuration(true)}
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            title="Clique para editar duração"
          >
            {cycleDuration}min
          </button>
        )}
      </div>

      {/* Timer Display */}
      <div className="flex-1 flex items-center justify-center">
        <span className={`text-sm font-mono ${
          isRunning ? 'text-blue-600' : isPaused ? 'text-orange-600' : 'text-gray-600'
        }`}>
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Controles */}
      <div className="flex items-center gap-1">
        <button
          onClick={toggleTimer}
          className={`p-2 rounded-full transition-colors ${
            isRunning
              ? 'bg-red-100 text-red-600 hover:bg-red-200'
              : 'bg-green-100 text-green-600 hover:bg-green-200'
          }`}
          title={isRunning ? 'Pausar' : isPaused ? 'Continuar' : 'Iniciar'}
        >
          {isRunning ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <button
          onClick={resetTimer}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Resetar timer"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Contador de Ciclos */}
      <div className="flex-shrink-0 text-xs text-gray-500">
        <div className="text-center">
          <div className="font-medium">{cyclesCompleted}</div>
          <div className="text-xs">ciclos</div>
        </div>
      </div>
    </div>
  )
}
