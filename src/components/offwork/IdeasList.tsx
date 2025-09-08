'use client';

import React, { useState } from 'react';
import { IdeaWithSelection, Category, CATEGORY_CONFIG } from '@/types/offwork';

interface IdeasListProps {
  ideas: IdeaWithSelection[];
  onToggleSelection: (ideaId: string, selected: boolean) => void;
  onMoveToDay: (ideaId: string, date: string) => void;
  weekDays: { date: string; label: string; shortLabel: string }[];
}

interface CategoryFilterProps {
  selectedCategory: Category | null;
  onCategoryChange: (category: Category | null) => void;
}

function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  const categories: Category[] = [
    'crescimento', 'mini-aventuras', 'lifestyle', 'esporte', 
    'social', 'relacionamentos', 'hobbies', 'viagens'
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <button
        onClick={() => onCategoryChange(null)}
        className={`
          px-3 py-1 rounded-full text-sm font-medium transition-colors
          ${selectedCategory === null 
            ? 'bg-gray-800 text-white' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }
        `}
      >
        Todas
      </button>
      {categories.map((category) => {
        const config = CATEGORY_CONFIG[category];
        return (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`
              px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-1
              ${selectedCategory === category 
                ? `${config.bgColor} ${config.color} border-2 border-current` 
                : `${config.bgColor} ${config.color} hover:opacity-80`
              }
            `}
          >
            <span>{config.icon}</span>
            {config.label}
          </button>
        );
      })}
    </div>
  );
}

interface IdeaItemProps {
  idea: IdeaWithSelection;
  onToggleSelection: (ideaId: string, selected: boolean) => void;
  onMoveToDay: (ideaId: string, date: string) => void;
  weekDays: { date: string; label: string; shortLabel: string }[];
}

function IdeaItem({ idea, onToggleSelection, onMoveToDay, weekDays }: IdeaItemProps) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const config = CATEGORY_CONFIG[idea.category];

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      {/* Ícone da categoria */}
      <span className="text-lg">{config.icon}</span>

      {/* Conteúdo da ideia */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm text-gray-800 truncate">{idea.title}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs px-2 py-1 rounded-full ${config.bgColor} ${config.color}`}>
            {config.label}
          </span>
          {idea.subcategory && (
            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
              {idea.subcategory.name}
            </span>
          )}
          {idea.assignedDate && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              ✓ Alocada
            </span>
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-2">
        {/* Menu de mover para dia */}
        {idea.isSelected && !idea.assignedDate && (
          <div className="relative">
            <button
              onClick={() => setShowMoveMenu(!showMoveMenu)}
              className="text-gray-400 hover:text-blue-500 transition-colors p-1"
              title="Mover para dia específico"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>

            {showMoveMenu && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-500 mb-2">Mover para:</div>
                  {weekDays.map((day) => (
                    <button
                      key={day.date}
                      onClick={() => {
                        onMoveToDay(idea.id, day.date);
                        setShowMoveMenu(false);
                      }}
                      className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 rounded"
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Toggle de seleção */}
        <button
          onClick={() => onToggleSelection(idea.id, !idea.isSelected)}
          className={`
            w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
            ${idea.isSelected 
              ? 'bg-blue-500 border-blue-500 text-white' 
              : 'border-gray-300 hover:border-blue-400'
            }
          `}
          title={idea.isSelected ? 'Remover da seleção' : 'Selecionar para esta semana'}
        >
          {idea.isSelected && (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export default function IdeasList({ 
  ideas, 
  onToggleSelection, 
  onMoveToDay, 
  weekDays 
}: IdeasListProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Filtrar ideias por categoria
  const filteredIdeas = selectedCategory 
    ? ideas.filter(idea => idea.category === selectedCategory)
    : ideas;

  // Separar ideias selecionadas e não selecionadas
  const selectedIdeas = filteredIdeas.filter(idea => idea.isSelected);
  const unselectedIdeas = filteredIdeas.filter(idea => !idea.isSelected);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Lista de Ideias
        </h2>
        <span className="text-sm text-gray-500">
          {filteredIdeas.length} {filteredIdeas.length === 1 ? 'ideia' : 'ideias'}
        </span>
      </div>

      {/* Filtros de categoria */}
      <CategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Lista de ideias selecionadas */}
      {selectedIdeas.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Selecionadas ({selectedIdeas.length})
          </h3>
          <div className="space-y-2">
            {selectedIdeas.map((idea) => (
              <IdeaItem
                key={idea.id}
                idea={idea}
                onToggleSelection={onToggleSelection}
                onMoveToDay={onMoveToDay}
                weekDays={weekDays}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lista de ideias não selecionadas */}
      {unselectedIdeas.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            {selectedIdeas.length > 0 ? 'Outras ideias' : 'Todas as ideias'}
          </h3>
          <div className="space-y-2">
            {unselectedIdeas.map((idea) => (
              <IdeaItem
                key={idea.id}
                idea={idea}
                onToggleSelection={onToggleSelection}
                onMoveToDay={onMoveToDay}
                weekDays={weekDays}
              />
            ))}
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {filteredIdeas.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-sm">
            {selectedCategory 
              ? `Nenhuma ideia encontrada na categoria "${CATEGORY_CONFIG[selectedCategory].label}"`
              : 'Nenhuma ideia encontrada'
            }
          </p>
        </div>
      )}
    </div>
  );
}
