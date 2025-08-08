'use client'

import { useAuthContext } from "@/contexts/AuthContext";
import Link from "next/link";

export default function Home() {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            Get a Life
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            Saia do piloto automático e comece a viver experiências mais significativas no dia a dia
          </p>
          
          {user ? (
            <div className="space-y-4">
              <p className="text-lg text-gray-700">
                Bem-vindo de volta, {user.email}!
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/dashboard"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                >
                  Ir para o Dashboard
                </Link>
                <Link
                  href="/auth/logout"
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                >
                  Sair
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-lg text-gray-700 mb-8">
                Descubra atividades personalizadas baseadas no seu humor, localização e tempo livre
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/auth/login"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                >
                  Criar Conta
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
