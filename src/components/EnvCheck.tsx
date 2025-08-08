'use client'

import { useEffect, useState } from 'react'

export function EnvCheck({ children }: { children: React.ReactNode }) {
  const [isConfigured, setIsConfigured] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkEnv = () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseAnonKey) {
        setIsConfigured(false)
      } else {
        setIsConfigured(true)
      }
      setIsLoading(false)
    }

    checkEnv()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Configuração Necessária</h1>
            <p className="text-gray-600 mb-6">
              Para usar o Get a Life, você precisa configurar as variáveis de ambiente do Supabase.
            </p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-yellow-800 mb-2">Passos para configurar:</h2>
            <ol className="text-sm text-yellow-700 text-left space-y-2">
              <li>1. Crie um arquivo <code className="bg-yellow-100 px-1 rounded">.env.local</code> na raiz do projeto</li>
              <li>2. Adicione suas credenciais do Supabase:</li>
              <li className="ml-4">
                <code className="bg-yellow-100 px-1 rounded block">
                  NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui<br/>
                  NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
                </code>
              </li>
              <li>3. Reinicie o servidor de desenvolvimento</li>
            </ol>
          </div>
          
          <div className="text-sm text-gray-500">
            <p>Não tem um projeto Supabase?</p>
            <a 
              href="https://supabase.com/dashboard" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Crie um gratuitamente
            </a>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
} 