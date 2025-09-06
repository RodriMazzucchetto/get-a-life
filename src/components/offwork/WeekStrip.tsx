'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { DayData, IdeaWithSelection, CATEGORY_CONFIG } from '@/types/offwork';
import { isToday, isPastDate } from '@/lib/offwork/date';

interface WeekStripProps {
  days: DayData[];
  onMoveIdea: (ideaId: string, fromDate: string, toDate: string) => void;
  onUnassignIdea: (ideaId: string, date: string) => void;
}

interface DayCellProps {
  day: DayData;
  onMoveIdea: (ideaId: string, fromDate: string, toDate: string) => void;
  onUnassignIdea: (ideaId: string, date: string) => void;
}

function DayCell({ day, onMoveIdea, onUnassignIdea }: DayCellProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `day-${day.date}`,
  });

  const isTodayDate = isToday(day.date);
  const isPast = isPastDate(day.date);

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-1 min-h-[120px] p-3 rounded-lg border-2 border-dashed transition-all duration-200
        ${isOver 
          ? 'border-blue-400 bg-blue-50' 
          : isTodayDate 
            ? 'border-green-300 bg-green-50' 
            : isPast
              ? 'border-gray-200 bg-gray-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
        }
      `}
    >
      {/* Header do dia */}
      <div className="text-center mb-2">
        <div className={`text-sm font-medium ${isTodayDate ? 'text-green-700' : 'text-gray-700'}`}>
          {day.shortLabel}
        </div>
        <div className="text-xs text-gray-500">
          {day.label}
        </div>
      </div>

      {/* Contador de ideias */}
      {day.assignments.length > 0 && (
        <div className="text-center mb-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {day.assignments.length}
          </span>
        </div>
      )}

      {/* Lista de ideias alocadas */}
      <div className="space-y-1">
        {day.assignments.map((idea) => {
          const config = CATEGORY_CONFIG[idea.category];
          return (
            <div
              key={idea.id}
              className={`
                flex items-center gap-2 p-2 rounded-md text-xs cursor-pointer
                ${config.bgColor} ${config.color}
                hover:opacity-80 transition-opacity
              `}
              onClick={() => onUnassignIdea(idea.id, day.date)}
              title={`Clique para remover: ${idea.title}`}
            >
              <span className="text-xs">{config.icon}</span>
              <span className="truncate flex-1">{idea.title}</span>
            </div>
          );
        })}
      </div>

      {/* Estado vazio */}
      {day.assignments.length === 0 && (
        <div className="text-center text-gray-400 text-xs py-4">
          {isOver ? 'Solte aqui' : 'Arraste ideias'}
        </div>
      )}
    </div>
  );
}

export default function WeekStrip({ days, onMoveIdea, onUnassignIdea }: WeekStripProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Semana Atual</h2>
      
      <div className="grid grid-cols-7 gap-3">
        {days.map((day) => (
          <DayCell
            key={day.date}
            day={day}
            onMoveIdea={onMoveIdea}
            onUnassignIdea={onUnassignIdea}
          />
        ))}
      </div>
    </div>
  );
}
