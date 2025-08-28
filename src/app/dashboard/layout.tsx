'use client'

import { useState } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Home', href: '/dashboard', active: true },
  { name: 'Minhas Memórias', href: '/dashboard/memories', active: true },
  { name: 'Viagens', href: '/dashboard/travels', active: true },
  { name: 'Planejamento', href: '/dashboard/planning', active: true },
  { name: 'Off Work', href: '/dashboard/off-work', active: true },
  { name: 'Radar da Vida', href: '/dashboard/radar', active: false, comingSoon: true },
  { name: 'Mini-desafios', href: '/dashboard/challenges', active: false, comingSoon: true },
  { name: 'Relatórios', href: '/dashboard/reports', active: false, comingSoon: true },
  { name: 'Configurações', href: '/dashboard/settings', active: true },
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, signOut } = useAuthContext()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar para mobile */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-gray-900">Get a Life</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.active ? item.href : '#'}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  item.active
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
                onClick={!item.active ? (e) => e.preventDefault() : undefined}
              >
                {item.name}
                {item.comingSoon && (
                  <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                    Em breve
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Sidebar para desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-bold text-gray-900">Get a Life</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.active ? item.href : '#'}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  item.active
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
                onClick={!item.active ? (e) => e.preventDefault() : undefined}
              >
                {item.name}
                {item.comingSoon && (
                  <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                    Em breve
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="lg:pl-64">
        {/* Header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Perfil do usuário */}
              <div className="flex items-center gap-x-2">
                <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                </div>
              </div>
              
              {/* Botão de logout */}
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sair
              </button>
            </div>
          </div>
        </div>

        {/* Conteúdo da página */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}