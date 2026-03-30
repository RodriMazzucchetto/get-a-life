import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'

interface ModalOverlayProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

/**
 * Overlay de modal: filhos devem usar ModalPanel (scroll interno + max-h) ou conteúdo
 * com altura limitada. items-start evita centrar verticalmente conteúdo alto (cortava
 * topo/fundo no viewport). O conteúdo filho define max-w (ex. via ModalPanel).
 */
export default function ModalOverlay({ isOpen, onClose, children }: ModalOverlayProps) {
  const [mounted, setMounted] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const scrollPositionRef = useRef<number>(0)

  // Bloquear scroll do fundo sem position:fixed no body — evita inputs que não recebem foco/teclado (iOS e alguns desktop)
  useEffect(() => {
    if (!isOpen) return

    scrollPositionRef.current = window.scrollY
    const scrollbarW = window.innerWidth - document.documentElement.clientWidth
    const prevBodyOverflow = document.body.style.overflow
    const prevHtmlOverflow = document.documentElement.style.overflow
    const prevPadding = document.body.style.paddingRight

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    if (scrollbarW > 0) {
      document.body.style.paddingRight = `${scrollbarW}px`
    }

    return () => {
      document.body.style.overflow = prevBodyOverflow
      document.body.style.paddingRight = prevPadding
      document.documentElement.style.overflow = prevHtmlOverflow
      window.scrollTo(0, scrollPositionRef.current)
    }
  }, [isOpen])

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div
      ref={modalRef}
      role="presentation"
      className="fixed inset-0 z-[100] overflow-y-auto overflow-x-hidden"
      style={{ overscrollBehavior: 'contain' }}
    >
      <div
        className="absolute inset-0 z-0 cursor-pointer"
        aria-hidden
        onClick={onClose}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.22)',
        }}
      />

      {/* items-start: conteúdo alto não fica “centrado” no viewport (metade cortada). ModalPanel faz scroll interno. */}
      <div
        className="relative z-10 flex min-h-[100dvh] w-full items-start justify-center px-4 py-8 sm:px-6 sm:py-10 pointer-events-none"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <div
          data-modal-content
          role="dialog"
          aria-modal="true"
          className="pointer-events-auto w-full"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
