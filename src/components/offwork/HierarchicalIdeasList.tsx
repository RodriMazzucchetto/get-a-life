'use client';

import { useState, useEffect } from 'react';
import { Idea, Category, Subcategory, IdeaWithSelection, CATEGORY_CONFIG } from '@/types/offwork';
import { listIdeas, listSubcategories } from '@/lib/offwork/service';

interface HierarchicalIdeasListProps {
  selectedCategory?: Category;
  onToggleSelect: (ideaId: string, selected: boolean) => void;
  onMoveToDay: (ideaId: string, date: string) => void;
  ideasWithSelection: IdeaWithSelection[];
}

interface GroupedIdeas {
  [category: string]: {
    [subcategory: string]: IdeaWithSelection[];
  };
}

export default function HierarchicalIdeasList({
  selectedCategory,
  onToggleSelect,
  onMoveToDay,
  ideasWithSelection
}: HierarchicalIdeasListProps) {
  const [groupedIdeas, setGroupedIdeas] = useState<GroupedIdeas>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());

  // Agrupar ideias por categoria e subcategoria
  useEffect(() => {
    const grouped: GroupedIdeas = {};
    
    ideasWithSelection.forEach(idea => {
      const category = idea.category;
      const subcategory = idea.subcategory?.name || 'Sem subcategoria';
      
      if (!grouped[category]) {
        grouped[category] = {};
      }
      
      if (!grouped[category][subcategory]) {
        grouped[category][subcategory] = [];
      }
      
      grouped[category][subcategory].push(idea);
    });
    
    setGroupedIdeas(grouped);
    
    // Expandir categoria selecionada
    if (selectedCategory) {
      setExpandedCategories(new Set([selectedCategory]));
    }
  }, [ideasWithSelection, selectedCategory]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleSubcategory = (subcategoryKey: string) => {
    const newExpanded = new Set(expandedSubcategories);
    if (newExpanded.has(subcategoryKey)) {
      newExpanded.delete(subcategoryKey);
    } else {
      newExpanded.add(subcategoryKey);
    }
    setExpandedSubcategories(newExpanded);
  };

  const getFilteredCategories = () => {
    if (selectedCategory) {
      return { [selectedCategory]: groupedIdeas[selectedCategory] || {} };
    }
    return groupedIdeas;
  };

  return (
    <div className="space-y-4">
      {Object.entries(getFilteredCategories()).map(([category, subcategories]) => {
        const config = CATEGORY_CONFIG[category as Category];
        const isExpanded = expandedCategories.has(category);
        
        return (
          <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Cabeçalho da Categoria */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{config?.icon || '📝'}</span>
                <span className="font-medium text-gray-800">{config?.label || category}</span>
                <span className="text-sm text-gray-500">
                  ({Object.values(subcategories).flat().length} ideias)
                </span>
              </div>
              <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {/* Subcategorias */}
            {isExpanded && (
              <div className="border-t border-gray-200">
                {Object.entries(subcategories).map(([subcategory, ideas]) => {
                  const subcategoryKey = `${category}-${subcategory}`;
                  const isSubExpanded = expandedSubcategories.has(subcategoryKey);
                  
                  return (
                    <div key={subcategoryKey} className="border-b border-gray-100 last:border-b-0">
                      {/* Cabeçalho da Subcategoria */}
                      <button
                        onClick={() => toggleSubcategory(subcategoryKey)}
                        className="w-full px-6 py-2 bg-gray-25 hover:bg-gray-50 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">{subcategory}</span>
                          <span className="text-xs text-gray-500">({ideas.length})</span>
                        </div>
                        <span className={`transform transition-transform text-xs ${isSubExpanded ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </button>

                      {/* Lista de Ideias */}
                      {isSubExpanded && (
                        <div className="px-6 py-2 space-y-1">
                          {ideas.map((idea) => (
                            <IdeaItem
                              key={idea.id}
                              idea={idea}
                              onToggleSelect={onToggleSelect}
                              onMoveToDay={onMoveToDay}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface IdeaItemProps {
  idea: IdeaWithSelection;
  onToggleSelect: (ideaId: string, selected: boolean) => void;
  onMoveToDay: (ideaId: string, date: string) => void;
}

function IdeaItem({ idea, onToggleSelect, onMoveToDay }: IdeaItemProps) {
  const config = CATEGORY_CONFIG[idea.category];
  
  return (
    <div className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 transition-colors">
      {/* Toggle de seleção */}
      <button
        onClick={() => onToggleSelect(idea.id, !idea.isSelected)}
        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
          idea.isSelected
            ? 'bg-blue-500 border-blue-500 text-white'
            : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        {idea.isSelected && '✓'}
      </button>

      {/* Conteúdo da ideia */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-800 truncate">{idea.title}</h4>
        {idea.assignedDate && (
          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
            ✓ Alocada para {idea.assignedDate}
          </span>
        )}
      </div>

      {/* Ações */}
      {idea.isSelected && !idea.assignedDate && (
        <div className="flex items-center gap-1">
          <select
            onChange={(e) => {
              if (e.target.value) {
                onMoveToDay(idea.id, e.target.value);
                e.target.value = '';
              }
            }}
            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
            defaultValue=""
          >
            <option value="">Mover para...</option>
            <option value="2024-01-15">Seg 15</option>
            <option value="2024-01-16">Ter 16</option>
            <option value="2024-01-17">Qua 17</option>
            <option value="2024-01-18">Qui 18</option>
            <option value="2024-01-19">Sex 19</option>
            <option value="2024-01-20">Sáb 20</option>
            <option value="2024-01-21">Dom 21</option>
          </select>
        </div>
      )}
    </div>
  );
}
