'use client'

import { useState, useRef, useEffect } from 'react'
import { Memory } from '@/types'
import { createClient } from '@/lib/supabase'

interface MemoryRegistrationModalProps {
  memory: Memory | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedMemory: Partial<Memory>) => Promise<void>
}

const moodOptions = [
  { emoji: '😊', label: 'Feliz', value: 'feliz' },
  { emoji: '😌', label: 'Tranquilo', value: 'tranquilo' },
  { emoji: '🤩', label: 'Empolgado', value: 'empolgado' },
  { emoji: '😌', label: 'Realizado', value: 'realizado' },
  { emoji: '😄', label: 'Divertido', value: 'divertido' },
  { emoji: '🥰', label: 'Gratidão', value: 'gratidao' },
  { emoji: '😌', label: 'Inspirado', value: 'inspirado' },
  { emoji: '😊', label: 'Satisfeito', value: 'satisfeito' },
  { emoji: '🤔', label: 'Reflexivo', value: 'reflexivo' },
  { emoji: '😌', label: 'Sereno', value: 'sereno' }
]

export default function MemoryRegistrationModal({ 
  memory, 
  isOpen, 
  onClose, 
  onSave 
}: MemoryRegistrationModalProps) {
  const [notes, setNotes] = useState('')
  const [mood, setMood] = useState('')
  const [media, setMedia] = useState<string[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Reset form when modal opens with new memory
  useEffect(() => {
    if (memory) {
      setNotes(memory.notes || '')
      setMood(memory.mood || '')
      setMedia(memory.media || [])
      setUploadingFiles([])
      setUploadProgress({})
    }
  }, [memory])

  const uploadFileToStorage = async (file: File): Promise<string> => {
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Usuário não autenticado. Faça login novamente.')
    }
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `memories/${memory?.id}/${fileName}`

    console.log('Tentando upload:', { filePath, fileSize: file.size, fileName })

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Erro detalhado do upload:', uploadError)
      
      if (uploadError.message.includes('Bucket not found')) {
        throw new Error('Bucket de storage não configurado. Execute o script setup-storage.sql no Supabase.')
      } else if (uploadError.message.includes('permission')) {
        throw new Error('Erro de permissão. Verifique se você está logado.')
      } else {
        throw new Error(`Erro no upload: ${uploadError.message}`)
      }
    }

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    // Limitar a 3 arquivos
    if (media.length + uploadingFiles.length + files.length > 3) {
      alert('Você pode adicionar no máximo 3 fotos/vídeos.')
      return
    }

    const newFiles = Array.from(files)
    setUploadingFiles(prev => [...prev, ...newFiles])

    try {
      const uploadPromises = newFiles.map(async (file) => {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))
        
        // Simular progresso (em produção, você usaria um callback real)
        const interval = setInterval(() => {
          setUploadProgress(prev => {
            const current = prev[file.name] || 0
            if (current < 90) {
              return { ...prev, [file.name]: current + 10 }
            }
            return prev
          })
        }, 100)

        const url = await uploadFileToStorage(file)
        
        clearInterval(interval)
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
        
        return url
      })

      const urls = await Promise.all(uploadPromises)
      setMedia(prev => [...prev, ...urls])
    } catch (error) {
      console.error('Erro detalhado no upload:', error)
      
      let errorMessage = 'Erro ao fazer upload dos arquivos. Tente novamente.'
      
      if (error instanceof Error) {
        if (error.message.includes('Bucket not found')) {
          errorMessage = 'Bucket de storage não configurado. Execute o script SQL no Supabase.'
        } else if (error.message.includes('permission') || error.message.includes('403')) {
          errorMessage = 'Erro de permissão. Verifique se as políticas de segurança foram criadas.'
        } else if (error.message.includes('413') || error.message.includes('too large')) {
          errorMessage = 'Arquivo muito grande. Tamanho máximo: 10MB.'
        } else {
          errorMessage = `Erro: ${error.message}`
        }
      }
      
      alert(errorMessage)
    } finally {
      setUploadingFiles(prev => prev.filter(f => !newFiles.includes(f)))
      setUploadProgress({})
    }
  }

  const removeMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index))
  }

  const removeUploadingFile = (file: File) => {
    setUploadingFiles(prev => prev.filter(f => f !== file))
    setUploadProgress(prev => {
      const newProgress = { ...prev }
      delete newProgress[file.name]
      return newProgress
    })
  }

  const handleSave = async () => {
    // Validação básica
    if (!notes.trim() && media.length === 0 && !mood) {
      alert('Adicione pelo menos uma nota, foto ou selecione um sentimento para salvar a memória.')
      return
    }

    setIsSaving(true)
    try {
      await onSave({
        notes: notes.trim(),
        mood,
        media
      })
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Erro ao salvar memória:', error)
      alert('Erro ao salvar a memória. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (!isSaving) {
      onClose()
    }
  }

  if (!isOpen || !memory) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              📝 Registrar Memória
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Complete os detalhes da sua experiência
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Título da experiência (fixo) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🎯 Título da Experiência
            </label>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 text-gray-900 font-medium">
              {memory.title}
            </div>
          </div>

          {/* Notas/Reflexão */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              💭 Notas / Reflexão <span className="text-gray-500">(opcional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => {
                const value = e.target.value
                if (value.length <= 500) {
                  setNotes(value)
                }
              }}
              placeholder="Como foi essa experiência? O que você sentiu? Que aprendizado teve? Que momentos especiais você viveu?"
              className={`w-full border rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all ${
                notes.length >= 500 ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              rows={4}
              disabled={isSaving}
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                {notes.length}/500 caracteres
              </p>
              {notes.length > 450 && (
                <p className="text-xs text-amber-600">
                  {500 - notes.length} caracteres restantes
                </p>
              )}
            </div>
          </div>

          {/* Upload de mídia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📸 Fotos / Vídeos <span className="text-gray-500">(opcional, máximo 3)</span>
            </label>
            
            {/* Preview das mídias existentes */}
            {media.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                {media.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Mídia ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg shadow-sm"
                    />
                    <button
                      onClick={() => removeMedia(index)}
                      disabled={isSaving}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Arquivos sendo enviados */}
            {uploadingFiles.length > 0 && (
              <div className="space-y-2 mb-4">
                {uploadingFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        📁
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress[file.name] || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeUploadingFile(file)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Botão de upload */}
            {media.length + uploadingFiles.length < 3 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 group"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📷</div>
                <p className="text-sm text-gray-600 font-medium">
                  Clique para adicionar foto ou vídeo
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG, MP4 até 10MB
                </p>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Seleção de humor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              😊 Como você se sentiu? <span className="text-gray-500">(opcional)</span>
            </label>
            <div className="grid grid-cols-5 gap-3">
              {moodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setMood(option.value)}
                  disabled={isSaving}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                    mood === option.value
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-3xl mb-2">{option.emoji}</div>
                  <div className="text-xs text-gray-600 font-medium">{option.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || uploadingFiles.length > 0}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 flex items-center font-medium shadow-lg hover:shadow-xl"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : uploadingFiles.length > 0 ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Enviando arquivos...
              </>
            ) : (
              <>
                <span className="mr-2">💾</span>
                Salvar Memória
              </>
            )}
          </button>
        </div>

        {/* Mensagem de sucesso */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-xl p-8 text-center shadow-2xl max-w-sm mx-4">
              <div className="text-6xl mb-4 animate-bounce">✅</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Memória salva com sucesso!</h3>
              <p className="text-gray-600">Sua experiência foi registrada no diário.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 