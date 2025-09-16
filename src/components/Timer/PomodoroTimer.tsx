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
  
  // Estados da UI
  const [showSettings, setShowSettings] = useState(false)
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
    setShowSettings(false)
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
  
  // Calcular progresso para a barra circular
  const progress = ((cycleDuration * 60 - timeLeft) / (cycleDuration * 60)) * 100
  
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Timer Pomodoro</h3>
          <p className="text-sm text-gray-600">
            {cyclesCompleted} ciclos hoje • {sessionCycles} nesta sessão
          </p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Configurações"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
      
      {/* Timer Circular */}
      <div className="flex justify-center mb-6">
        <div className="relative w-48 h-48">
          {/* Círculo de fundo */}
          <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#e5e7eb"
              strokeWidth="4"
              fill="none"
            />
            {/* Círculo de progresso */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke={isRunning ? "#3b82f6" : "#10b981"}
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          
          {/* Tempo no centro */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-gray-600">
              {isPaused ? 'Pausado' : isRunning ? 'Em andamento' : 'Pronto'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Controles */}
      <div className="flex justify-center gap-4 mb-4">
        <button
          onClick={toggleTimer}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            isRunning
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isRunning ? (
            <>
              <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              Pausar
            </>
          ) : (
            <>
              <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              {isPaused ? 'Continuar' : 'Iniciar'}
            </>
          )}
        </button>
        
        <button
          onClick={resetTimer}
          className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
        >
          <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          Resetar
        </button>
        
        <button
          onClick={resetSession}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors text-sm"
          title="Resetar contador da sessão"
        >
          <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Reset Sessão
        </button>
      </div>
      
      {/* Configurações */}
      {showSettings && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Duração do Ciclo</h4>
          <div className="flex gap-2 flex-wrap">
            {[15, 20, 25, 30, 45, 60].map((minutes) => (
              <button
                key={minutes}
                onClick={() => updateCycleDuration(minutes)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  cycleDuration === minutes
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {minutes}min
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Recomendado: 25 minutos (técnica Pomodoro clássica)
          </p>
        </div>
      )}
    </div>
  )
}
