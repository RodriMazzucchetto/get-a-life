'use client';

import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { useAuthContext } from '@/contexts/AuthContext';
import { WeekData, IdeaWithSelection, CATEGORY_CONFIG } from '@/types/offwork';
import { getWeekStart, getWeekDays } from '@/lib/offwork/date';
import { loadWeekData, toggleSelectForWeek, assignIdeaToDate, unassignIdeaFromDate, moveIdeaToDate } from '@/lib/offwork/service';
import WeekStrip from '@/components/offwork/WeekStrip';
import SelectedTray from '@/components/offwork/SelectedTray';
import IdeasList from '@/components/offwork/IdeasList';
import HierarchicalIdeasList from '@/components/offwork/HierarchicalIdeasList';

export default function OffWorkPage() {
  const { user } = useAuthContext();
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedIdea, setDraggedIdea] = useState<IdeaWithSelection | null>(null);
  const [viewMode, setViewMode] = useState<'simple' | 'hierarchical'>('hierarchical');

  // Carregar dados da semana atual
  useEffect(() => {
    loadCurrentWeek();
  }, []);

  const loadCurrentWeek = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await loadWeekData();
      setWeekData(data);
    } catch (err) {
      console.error('Erro ao carregar dados da semana:', err);
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Handlers para DND
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Encontrar a ideia sendo arrastada
    const ideaId = (active.id as string).replace('idea-', '');
    const allIdeas = [
      ...(weekData?.selectedIdeas || []),
      ...(weekData?.unassignedIdeas || []),
      ...(weekData?.days.flatMap(day => day.assignments) || [])
    ];
    const idea = allIdeas.find(i => i.id === ideaId);
    setDraggedIdea(idea || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDraggedIdea(null);

    if (!over || !weekData) return;

    const ideaId = (active.id as string).replace('idea-', '');
    const overId = over.id as string;

    // Se soltou em um dia da semana
    if (overId.startsWith('day-')) {
      const targetDate = overId.replace('day-', '');
      handleAssignIdea(ideaId, targetDate);
    }
    // Se soltou na bandeja (tray)
    else if (overId === 'tray') {
      handleUnassignIdea(ideaId);
    }
  };

  // Handlers para ações específicas
  const handleToggleSelection = async (ideaId: string, selected: boolean) => {
    if (!weekData) return;

    try {
      await toggleSelectForWeek(ideaId, weekData.weekStart, selected);
      await loadCurrentWeek(); // Recarregar dados
    } catch (err) {
      console.error('Erro ao alternar seleção:', err);
      setError('Erro ao atualizar seleção. Tente novamente.');
    }
  };

  const handleAssignIdea = async (ideaId: string, date: string) => {
    if (!weekData) return;

    try {
      await assignIdeaToDate(ideaId, date);
      await loadCurrentWeek(); // Recarregar dados
    } catch (err) {
      console.error('Erro ao alocar ideia:', err);
      setError('Erro ao alocar ideia. Tente novamente.');
    }
  };

  const handleUnassignIdea = async (ideaId: string, date?: string) => {
    if (!weekData) return;

    try {
      if (date) {
        await unassignIdeaFromDate(ideaId, date);
      } else {
        // Se não especificou data, remove de qualquer dia da semana
        const weekDays = getWeekDays(weekData.weekStart);
        for (const day of weekDays) {
          await unassignIdeaFromDate(ideaId, day);
        }
      }
      await loadCurrentWeek(); // Recarregar dados
    } catch (err) {
      console.error('Erro ao desalocar ideia:', err);
      setError('Erro ao desalocar ideia. Tente novamente.');
    }
  };

  const handleMoveIdea = async (ideaId: string, fromDate: string, toDate: string) => {
    try {
      await moveIdeaToDate(ideaId, fromDate, toDate);
      await loadCurrentWeek(); // Recarregar dados
    } catch (err) {
      console.error('Erro ao mover ideia:', err);
      setError('Erro ao mover ideia. Tente novamente.');
    }
  };

  const handleMoveToDay = async (ideaId: string, date: string) => {
    await handleAssignIdea(ideaId, date);
  };

  // Estados de loading e erro
  if (loading) {
  return (
      <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando suas ideias...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-lg mb-4">⚠️ {error}</div>
        <button
          onClick={loadCurrentWeek}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!weekData) {
          return (
      <div className="text-center py-8">
        <p className="text-gray-600">Nenhum dado encontrado.</p>
      </div>
    );
  }

  // Preparar dados para os componentes
  const allIdeas = [
    ...weekData.selectedIdeas,
    ...weekData.unassignedIdeas
  ];

  const weekDays = weekData.days.map(day => ({
    date: day.date,
    label: day.label,
    shortLabel: day.shortLabel
  }));

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎯 Off Work - Planejamento Semanal
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Organize suas ideias para esta semana. Selecione, arraste e distribua suas atividades pelos dias.
          </p>
        </div>

        {/* Barra da Semana */}
        <WeekStrip
          days={weekData.days}
          onMoveIdea={handleMoveIdea}
          onUnassignIdea={handleUnassignIdea}
        />

        {/* Bandeja de Ideias Selecionadas */}
        <SelectedTray
          selectedIdeas={weekData.selectedIdeas}
          onUnselectIdea={(ideaId) => handleToggleSelection(ideaId, false)}
        />

        {/* Lista de Ideias */}
        <div className="space-y-4">
          {/* Toggle de Visualização */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Ideias Disponíveis</h2>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('hierarchical')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'hierarchical'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Hierárquica
              </button>
              <button
                onClick={() => setViewMode('simple')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'simple'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Simples
              </button>
            </div>
          </div>

          {/* Renderizar lista baseada no modo */}
          {viewMode === 'hierarchical' ? (
            <HierarchicalIdeasList
              ideasWithSelection={allIdeas}
              onToggleSelect={handleToggleSelection}
              onMoveToDay={handleMoveToDay}
            />
          ) : (
            <IdeasList
              ideas={allIdeas}
              onToggleSelection={handleToggleSelection}
              onMoveToDay={handleMoveToDay}
              weekDays={weekDays}
            />
          )}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId && draggedIdea ? (
            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-lg opacity-90">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {CATEGORY_CONFIG[draggedIdea.category]?.icon || '📝'}
                </span>
                <span className="text-sm font-medium truncate max-w-[200px]">
                  {draggedIdea.title}
                </span>
              </div>
              </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
