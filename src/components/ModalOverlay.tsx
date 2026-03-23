import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'

interface ModalOverlayProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

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

  // Portal para document.body para evitar herdar estilos do container
  return createPortal(
    <div
      ref={modalRef}
      role="presentation"
      className="fixed inset-0 z-[100] overflow-y-auto"
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

      <div className="relative z-10 flex min-h-full w-full items-center justify-center p-4 pointer-events-none">
        <div
          data-modal-content
          role="dialog"
          aria-modal="true"
          className="pointer-events-auto w-full max-h-[min(90vh,720px)] overflow-y-auto rounded-xl"
          style={{ overscrollBehavior: 'contain' }}
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
