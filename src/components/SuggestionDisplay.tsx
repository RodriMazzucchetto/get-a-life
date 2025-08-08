'use client'

interface SuggestionDisplayProps {
  suggestion: string
}

export default function SuggestionDisplay({ suggestion }: SuggestionDisplayProps) {
  // Função para processar o texto da sugestão e extrair seções
  const processSuggestion = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim())
    
    const sections = {
      title: '',
      context: '',
      links: [] as string[],
      tips: [] as string[]
    }
    
    let currentSection = 'title'
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Detectar título principal (primeira linha com emoji)
      if (!sections.title && trimmedLine.includes('🎯')) {
        sections.title = trimmedLine
        currentSection = 'context'
        continue
      }
      
      // Detectar contexto (linhas que começam com 📖)
      if (trimmedLine.includes('📖')) {
        sections.context = trimmedLine.replace('📖', '').trim()
        currentSection = 'links'
        continue
      }
      
      // Detectar links (linhas que começam com 🔗)
      if (trimmedLine.includes('🔗') && trimmedLine.includes('http')) {
        sections.links.push(trimmedLine)
        currentSection = 'links'
        continue
      }
      
      // Detectar dicas (linhas que começam com 💡)
      if (trimmedLine.includes('💡')) {
        sections.tips.push(trimmedLine)
        currentSection = 'tips'
        continue
      }
      
      // Se estamos no contexto e a linha não tem emoji, adicionar ao contexto
      if (currentSection === 'context' && !sections.context && !trimmedLine.includes('🔗') && !trimmedLine.includes('💡')) {
        sections.context = trimmedLine
      }
    }
    
    return sections
  }
  
  const sections = processSuggestion(suggestion)
  
  // Se não conseguimos estruturar bem, tentar extrair pelo menos o título
  if (!sections.title && sections.links.length === 0) {
    const lines = suggestion.split('\n').filter(line => line.trim())
    const firstLine = lines[0]?.trim() || ''
    
    // Se a primeira linha parece um título, usar ela
    if (firstLine.length < 80 && (firstLine.includes('🎯') || firstLine.includes('✨') || firstLine.includes('!'))) {
      sections.title = firstLine
      sections.context = lines.slice(1).join(' ')
    } else {
      // Fallback para texto simples
      return (
        <div className="text-center">
          <h4 className="text-2xl font-bold text-blue-900 mb-4">
            🎯 Sua Sugestão Personalizada
          </h4>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {suggestion}
            </p>
          </div>
        </div>
      )
    }
  }
  
  return (
    <div className="space-y-4">
      {/* Título/Ação Principal */}
      {sections.title && (
        <div className="text-center pb-3">
          <h4 className="text-2xl font-bold text-blue-900 mb-2">
            {sections.title}
          </h4>
          <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full"></div>
        </div>
      )}
      
      {/* Contexto/Descrição */}
      {sections.context && (
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <p className="text-blue-800 leading-relaxed text-center text-sm">
            {sections.context}
          </p>
        </div>
      )}
      
      {/* Links Úteis */}
      {sections.links.length > 0 && (
        <div>
          <h5 className="text-lg font-semibold text-gray-800 mb-3 flex items-center justify-center">
            <span className="mr-2">🔗</span>
            Links úteis para execução
          </h5>
          <div className="space-y-2">
            {sections.links.map((link, index) => {
              // Extrair título e URL do link
              const linkMatch = link.match(/🔗 Link: (.+?) - (.+)/)
              if (linkMatch) {
                const [, title, url] = linkMatch
                return (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow hover:border-blue-300"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-blue-600 font-medium leading-relaxed">
                        {title}
                      </p>
                      <span className="text-blue-400 text-sm">↗</span>
                    </div>
                  </a>
                )
              }
              return null
            })}
          </div>
        </div>
      )}
      
      {/* Dicas Opcionais */}
      {sections.tips.length > 0 && (
        <div>
          <h5 className="text-lg font-semibold text-gray-800 mb-3 flex items-center justify-center">
            <span className="mr-2">💡</span>
            Dicas opcionais
          </h5>
          <div className="space-y-2">
            {sections.tips.map((tip, index) => (
              <div key={index} className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3">
                <p className="text-amber-800 leading-relaxed text-sm">
                  {tip.replace(/^💡\s*/, '')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Fechamento motivador */}
      <div className="text-center bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-5">
        <p className="text-emerald-800 font-bold text-lg mb-2">
          ✨ Agora é sua vez!
        </p>
        <p className="text-emerald-700 text-sm">
          Viva esta experiência e registre o momento no app para criar uma memória especial.
        </p>
      </div>
    </div>
  )
} 