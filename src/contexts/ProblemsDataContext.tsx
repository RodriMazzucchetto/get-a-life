'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { problemsService, fromDbProblem, type Problem } from '@/lib/planning'

type ProblemsDataContextValue = {
  problems: Problem[]
  setProblems: Dispatch<SetStateAction<Problem[]>>
  loading: boolean
  reloadProblems: () => Promise<void>
}

const ProblemsDataContext = createContext<ProblemsDataContextValue | null>(null)

export function ProblemsDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext()
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const hydratedUserIdRef = useRef<string | null>(null)

  const loadProblems = useCallback(
    async (options?: { force?: boolean }) => {
      if (!user) return
      if (!options?.force && hydratedUserIdRef.current === user.id) return

      const isColdStart = hydratedUserIdRef.current !== user.id
      if (isColdStart) {
        setLoading(true)
      }

      try {
        const rows = await problemsService.getProblems(user.id)
        setProblems(rows.map(fromDbProblem))
        hydratedUserIdRef.current = user.id
      } catch (error) {
        console.error('Erro ao carregar problemas:', error)
      } finally {
        setLoading(false)
      }
    },
    [user]
  )

  useEffect(() => {
    if (!user) {
      hydratedUserIdRef.current = null
      setProblems([])
      setLoading(false)
      return
    }
    void loadProblems()
  }, [user, loadProblems])

  const value: ProblemsDataContextValue = {
    problems,
    setProblems,
    loading,
    reloadProblems: () => loadProblems({ force: true }),
  }

  return (
    <ProblemsDataContext.Provider value={value}>{children}</ProblemsDataContext.Provider>
  )
}

export function useProblemsData() {
  const context = useContext(ProblemsDataContext)
  if (!context) {
    throw new Error('useProblemsData deve ser usado dentro de ProblemsDataProvider')
  }
  return context
}
