'use client'

import { useAuthContext } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

export default function SettingsPage() {
  const { user, loading } = useAuthContext()
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login')
    }
  }, [user, loading, router])

  const loadProfile = useCallback(async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Erro ao carregar perfil:', error)
        return
      }

      if (!data) {
        await supabase.from('user_profiles').insert({
          user_id: user.id,
          full_name: user.user_metadata?.full_name || 'Usuário',
        })
        setFullName(user.user_metadata?.full_name || '')
        return
      }

      setFullName(data.full_name || '')
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    if (user) loadProfile()
  }, [user, loadProfile])

  const handleSaveName = async () => {
    if (!user) return
    setIsSaving(true)
    setSaveMessage(null)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert(
          { user_id: user.id, full_name: fullName.trim() || 'Usuário' },
          { onConflict: 'user_id' }
        )

      if (error) {
        console.error(error)
        setSaveMessage('Não foi possível salvar.')
        return
      }
      setSaveMessage('Salvo.')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch {
      setSaveMessage('Não foi possível salvar.')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="mt-1 text-sm text-gray-500">Conta e perfil.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-lg">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Minha conta</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">E-mail</label>
            <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
          </div>
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
              Nome (opcional)
            </label>
            <input
              id="full_name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Como prefere ser chamado"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveName}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : 'Salvar nome'}
            </button>
            {saveMessage && <span className="text-sm text-gray-600">{saveMessage}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
