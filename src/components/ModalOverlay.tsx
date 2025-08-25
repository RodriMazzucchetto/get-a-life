import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface ModalOverlayProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function ModalOverlay({ isOpen, onClose, children }: ModalOverlayProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!isOpen || !mounted) return null

  // Portal para document.body para evitar herdar estilos do container
  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Overlay completamente transparente - apenas para interceptar cliques */}
      <div 
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
        style={{ 
          backgroundColor: 'transparent',
          backdropFilter: 'none',
          filter: 'none',
          WebkitBackdropFilter: 'none',
          mixBlendMode: 'normal'
        }}
      />
      
      {/* Conteúdo da modal */}
      <div className="relative z-10 pointer-events-auto">
        {children}
      </div>
    </div>,
    document.body
  )
}
