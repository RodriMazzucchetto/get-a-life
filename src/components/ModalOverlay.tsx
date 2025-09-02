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

  // Controlar scroll da página de fundo
  useEffect(() => {
    if (isOpen) {
      // Salvar posição atual do scroll
      scrollPositionRef.current = window.scrollY
      
      // Prevenir scroll da página de fundo
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollPositionRef.current}px`
      document.body.style.width = '100%'
    } else {
      // Restaurar scroll da página de fundo
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      
      // Restaurar posição do scroll
      window.scrollTo(0, scrollPositionRef.current)
    }

    // Cleanup
    return () => {
      if (isOpen) {
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        window.scrollTo(0, scrollPositionRef.current)
      }
    }
  }, [isOpen])

  // Controlar scroll da modal
  useEffect(() => {
    if (!isOpen || !modalRef.current) return

    const modal = modalRef.current

    const handleWheel = (e: WheelEvent) => {
      const modalContent = modal.querySelector('[data-modal-content]') as HTMLElement
      if (!modalContent) return

      const { scrollTop, scrollHeight, clientHeight } = modalContent
      const isAtTop = scrollTop === 0
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1

      // Se está no topo e tentando scrollar para cima, ou no bottom e tentando scrollar para baixo
      if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
        // Permitir scroll da página de fundo apenas se a modal estiver completamente visível
        const modalRect = modal.getBoundingClientRect()
        const isModalFullyVisible = modalRect.top >= 0 && modalRect.bottom <= window.innerHeight

        if (isModalFullyVisible) {
          // Restaurar temporariamente o scroll da página
          document.body.style.overflow = ''
          document.body.style.position = ''
          document.body.style.top = ''
          document.body.style.width = ''
          
          // Permitir o scroll
          setTimeout(() => {
            // Re-aplicar as restrições após um breve delay
            document.body.style.overflow = 'hidden'
            document.body.style.position = 'fixed'
            document.body.style.top = `-${scrollPositionRef.current}px`
            document.body.style.width = '100%'
          }, 100)
        }
      }
    }

    modal.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      modal.removeEventListener('wheel', handleWheel)
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
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ 
        overscrollBehavior: 'contain' // Previne scroll bounce
      }}
    >
      {/* Scrim neutro sutil - preto bem fraco para atenuar levemente o fundo */}
      <div 
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.22)', // Preto 22% opacidade - um degrau acima do anterior
          backdropFilter: 'none',
          filter: 'none',
          WebkitBackdropFilter: 'none',
          mixBlendMode: 'normal'
        }}
      />
      
      {/* Conteúdo da modal */}
      <div className="relative z-10 pointer-events-auto min-h-full flex items-center justify-center p-4">
        <div 
          data-modal-content
          className="w-full max-h-full overflow-y-auto"
          style={{ 
            overscrollBehavior: 'contain' // Previne scroll bounce na modal
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
