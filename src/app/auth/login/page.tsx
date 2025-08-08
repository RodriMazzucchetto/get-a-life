'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/contexts/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuthContext()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)
    const { error: signInError } = await signIn(email, password)
    
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    // Se não houve erro, o usuário foi autenticado
    // O middleware ou o contexto de auth vai redirecionar automaticamente
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md flex flex-col items-center">
        <h1 className="text-2xl font-medium mb-8 text-center">Welcome Back</h1>
        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-5 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-700 placeholder-gray-400 transition"
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-5 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-700 placeholder-gray-400 transition"
            disabled={loading}
          />
          <button
            type="submit"
            className="w-full bg-[#ff7a3d] hover:bg-[#ff6a1a] text-white font-semibold py-3 rounded-full mt-2 transition disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>
        {error && <div className="text-red-500 text-sm mt-4 text-center">{error}</div>}
        <div className="flex justify-between w-full mt-6 text-sm text-gray-400">
          <Link href="/auth/register" className="hover:underline">Create an account</Link>
          <Link href="/auth/forgot" className="hover:underline">Forgot your password?</Link>
        </div>
      </div>
    </div>
  )
}