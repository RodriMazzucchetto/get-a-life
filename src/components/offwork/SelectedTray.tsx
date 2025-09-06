'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { IdeaWithSelection, CATEGORY_CONFIG } from '@/types/offwork';

interface SelectedTrayProps {
  selectedIdeas: IdeaWithSelection[];
  onUnselectIdea: (ideaId: string) => void;
}

interface DraggableIdeaProps {
  idea: IdeaWithSelection;
  onUnselect: (ideaId: string) => void;
}

function DraggableIdea({ idea, onUnselect }: DraggableIdeaProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `idea-${idea.id}`,
  });

  const config = CATEGORY_CONFIG[idea.category];
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        flex items-center gap-3 p-3 rounded-lg border cursor-grab active:cursor-grabbing
        transition-all duration-200 hover:shadow-md
        ${config.bgColor} ${config.color} border-gray-200
        ${isDragging ? 'opacity-50 shadow-lg' : 'hover:border-gray-300'}
      `}
    >
      {/* Ícone da categoria */}
      <span className="text-lg">{config.icon}</span>
      
      {/* Conteúdo da ideia */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm truncate">{idea.title}</h3>
        <p className="text-xs opacity-75">{config.label}</p>
      </div>

      {/* Botão de remover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onUnselect(idea.id);
        }}
        className="text-gray-400 hover:text-red-500 transition-colors p-1"
        title="Remover da seleção"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function SelectedTray({ selectedIdeas, onUnselectIdea }: SelectedTrayProps) {
  return (
    <div 
      id="tray"
      className="bg-white rounded-lg shadow-sm border p-4 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Selecionadas para esta Semana
        </h2>
        <span className="text-sm text-gray-500">
          {selectedIdeas.length} {selectedIdeas.length === 1 ? 'ideia' : 'ideias'}
        </span>
      </div>

      {selectedIdeas.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">📝</div>
          <p className="text-sm">Nenhuma ideia selecionada</p>
          <p className="text-xs mt-1">Selecione ideias na lista abaixo para começar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {selectedIdeas.map((idea) => (
            <DraggableIdea
              key={idea.id}
              idea={idea}
              onUnselect={onUnselectIdea}
            />
          ))}
        </div>
      )}

      {selectedIdeas.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            💡 <strong>Dica:</strong> Arraste as ideias para os dias da semana acima para organizá-las
          </p>
        </div>
      )}
    </div>
  );
}
