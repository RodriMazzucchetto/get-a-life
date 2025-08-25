import React from 'react'

interface ModalOverlayProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function ModalOverlay({ isOpen, onClose, children }: ModalOverlayProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay extremamente sutil - apenas para interceptar cliques */}
      <div 
        className="absolute inset-0 bg-gray-100 bg-opacity-10"
        onClick={onClose}
      />
      
      {/* Conteúdo da modal */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
