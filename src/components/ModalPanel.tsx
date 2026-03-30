import type { ReactNode } from 'react'

export type ModalPanelProps = {
  children: ReactNode
  /** Classes Tailwind de largura máxima, ex.: max-w-lg, max-w-2xl, max-w-4xl */
  maxWidthClass?: string
  /** default: padding uniforme; none para modais com secções próprias (ex.: em espera) */
  padding?: 'default' | 'none'
  className?: string
}

/**
 * Painel branco padrão das modais: limita altura à viewport e aplica scroll interno
 * visível quando o conteúdo é longo (evita corte vertical / rodapé inacessível).
 */
export function ModalPanel({
  children,
  maxWidthClass = 'max-w-2xl',
  padding = 'default',
  className = '',
}: ModalPanelProps) {
  const paddingClass = padding === 'none' ? 'p-0' : 'p-6'

  return (
    <div
      className={`mx-auto w-full ${maxWidthClass} max-h-[min(92dvh,56rem)] overflow-y-auto overscroll-contain rounded-xl border-2 border-gray-100 bg-white shadow-2xl ring-4 ring-white/50 [scrollbar-gutter:stable] ${paddingClass} ${className}`}
    >
      {children}
    </div>
  )
}
