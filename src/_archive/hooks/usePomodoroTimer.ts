import { useState, useEffect, useCallback } from 'react'

interface PomodoroData {
  date: string
  cycles: number
  lastUpdate: string
  sessionCycles?: number
}

export function usePomodoroTimer() {
  const [cyclesCompleted, setCyclesCompleted] = useState(0)
  const [sessionCycles, setSessionCycles] = useState(0)
  
  // Carregar dados salvos
  const loadSavedData = useCallback(() => {
    try {
      const savedData = localStorage.getItem('pomodoro-data')
      const today = new Date().toDateString()
      
      if (savedData) {
        const data: PomodoroData = JSON.parse(savedData)
        if (data.date === today) {
          setCyclesCompleted(data.cycles)
          setSessionCycles(data.sessionCycles || 0)
        } else {
          // Novo dia, resetar contadores
          setCyclesCompleted(0)
          setSessionCycles(0)
          saveData(0, 0)
        }
      }
    } catch (error) {
      console.log('Erro ao carregar dados do pomodoro:', error)
    }
  }, [])
  
  // Salvar dados
  const saveData = useCallback((cycles: number, session: number) => {
    try {
      const today = new Date().toDateString()
      const data: PomodoroData = {
        date: today,
        cycles: cycles,
        sessionCycles: session,
        lastUpdate: new Date().toISOString()
      }
      localStorage.setItem('pomodoro-data', JSON.stringify(data))
    } catch (error) {
      console.log('Erro ao salvar dados do pomodoro:', error)
    }
  }, [])
  
  // Marcar ciclo como completo
  const completeCycle = useCallback(() => {
    const newCyclesCompleted = cyclesCompleted + 1
    const newSessionCycles = sessionCycles + 1
    
    setCyclesCompleted(newCyclesCompleted)
    setSessionCycles(newSessionCycles)
    
    // Salvar dados
    saveData(newCyclesCompleted, newSessionCycles)
    
    return {
      totalCycles: newCyclesCompleted,
      sessionCycles: newSessionCycles
    }
  }, [cyclesCompleted, sessionCycles, saveData])
  
  // Resetar sessão
  const resetSession = useCallback(() => {
    setSessionCycles(0)
    saveData(cyclesCompleted, 0)
  }, [cyclesCompleted, saveData])
  
  // Carregar dados ao montar
  useEffect(() => {
    loadSavedData()
  }, [loadSavedData])
  
  return {
    cyclesCompleted,
    sessionCycles,
    completeCycle,
    resetSession,
    loadSavedData
  }
}
