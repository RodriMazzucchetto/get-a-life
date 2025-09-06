// Serviços Supabase para funcionalidade Off Work

import { createClient } from '@/lib/supabase';
import { Idea, WeekSelection, DayAssignment, IdeaWithSelection, WeekData, Category } from '@/types/offwork';
import { getWeekStart, getWeekDays } from './date';

/**
 * Lista todas as ideias, opcionalmente filtradas por categoria
 */
export async function listIdeas(category?: Category): Promise<Idea[]> {
  const supabase = createClient();
  let query = supabase
    .from('idea')
    .select('*')
    .order('created_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Erro ao listar ideias:', error);
    throw error;
  }

  return data || [];
}

/**
 * Lista ideias selecionadas para uma semana específica
 */
export async function listSelectedForWeek(weekStart: string): Promise<Idea[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('week_selection')
    .select(`
      idea_id,
      idea:idea_id (
        id,
        title,
        category,
        created_at
      )
    `)
    .eq('week_start', weekStart);

  if (error) {
    console.error('Erro ao listar ideias selecionadas:', error);
    throw error;
  }

  return (data?.map(item => item.idea).filter(Boolean) || []) as unknown as Idea[];
}

/**
 * Lista alocações de ideias para uma semana específica
 */
export async function listAssignmentsForWeek(weekStart: string): Promise<DayAssignment[]> {
  const supabase = createClient();
  const weekDays = getWeekDays(weekStart);
  
  const { data, error } = await supabase
    .from('day_assignment')
    .select('*')
    .in('date', weekDays)
    .order('date', { ascending: true });

  if (error) {
    console.error('Erro ao listar alocações:', error);
    throw error;
  }

  return data || [];
}

/**
 * Carrega dados completos da semana (ideias, seleções e alocações)
 */
export async function loadWeekData(weekStart?: string): Promise<WeekData> {
  const currentWeekStart = weekStart || getWeekStart();
  const weekDays = getWeekDays(currentWeekStart);

  // Carregar dados em paralelo
  const [ideas, selectedIdeas, assignments] = await Promise.all([
    listIdeas(),
    listSelectedForWeek(currentWeekStart),
    listAssignmentsForWeek(currentWeekStart)
  ]);

  // Criar mapas para facilitar consultas
  const selectedIds = new Set(selectedIdeas.map(idea => idea.id));
  const assignmentMap = new Map<string, DayAssignment>();
  
  assignments.forEach(assignment => {
    assignmentMap.set(assignment.idea_id, assignment);
  });

  // Enriquecer ideias com informações de seleção e alocação
  const ideasWithSelection: IdeaWithSelection[] = ideas.map(idea => {
    const assignment = assignmentMap.get(idea.id);
    return {
      ...idea,
      isSelected: selectedIds.has(idea.id),
      assignedDate: assignment?.date
    };
  });

  // Separar ideias selecionadas em alocadas e não alocadas
  const selectedAndAssigned = ideasWithSelection.filter(idea => 
    idea.isSelected && idea.assignedDate
  );
  const selectedButUnassigned = ideasWithSelection.filter(idea => 
    idea.isSelected && !idea.assignedDate
  );

  // Criar dados dos dias
  const days = weekDays.map(date => {
    const dayAssignments = selectedAndAssigned.filter(idea => idea.assignedDate === date);
    return {
      date,
      label: formatDayLabel(date),
      shortLabel: formatDayShort(date),
      assignments: dayAssignments
    };
  });

  return {
    weekStart: currentWeekStart,
    days,
    selectedIdeas: selectedButUnassigned,
    unassignedIdeas: ideasWithSelection.filter(idea => !idea.isSelected)
  };
}

/**
 * Alterna seleção de uma ideia para a semana
 */
export async function toggleSelectForWeek(
  ideaId: string, 
  weekStart: string, 
  selected: boolean
): Promise<void> {
  const supabase = createClient();
  if (selected) {
    // Adicionar seleção
    const { error } = await supabase
      .from('week_selection')
      .insert({
        idea_id: ideaId,
        week_start: weekStart
      });

    if (error) {
      console.error('Erro ao selecionar ideia:', error);
      throw error;
    }
  } else {
    // Remover seleção e qualquer alocação da semana
    const weekDays = getWeekDays(weekStart);
    
    await Promise.all([
      supabase
        .from('week_selection')
        .delete()
        .eq('idea_id', ideaId)
        .eq('week_start', weekStart),
      supabase
        .from('day_assignment')
        .delete()
        .eq('idea_id', ideaId)
        .in('date', weekDays)
    ]);
  }
}

/**
 * Aloca uma ideia para um dia específico
 * Remove qualquer alocação anterior da mesma semana
 */
export async function assignIdeaToDate(ideaId: string, date: string): Promise<void> {
  const supabase = createClient();
  const weekStart = getWeekStart(new Date(date));
  const weekDays = getWeekDays(weekStart);

  // Remover alocações anteriores da mesma semana
  await supabase
    .from('day_assignment')
    .delete()
    .eq('idea_id', ideaId)
    .in('date', weekDays);

  // Adicionar nova alocação
  const { error } = await supabase
    .from('day_assignment')
    .insert({
      idea_id: ideaId,
      date
    });

  if (error) {
    console.error('Erro ao alocar ideia:', error);
    throw error;
  }
}

/**
 * Remove alocação de uma ideia de um dia específico
 */
export async function unassignIdeaFromDate(ideaId: string, date: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('day_assignment')
    .delete()
    .eq('idea_id', ideaId)
    .eq('date', date);

  if (error) {
    console.error('Erro ao desalocar ideia:', error);
    throw error;
  }
}

/**
 * Move uma ideia de um dia para outro
 */
export async function moveIdeaToDate(ideaId: string, fromDate: string, toDate: string): Promise<void> {
  await assignIdeaToDate(ideaId, toDate);
}

// Helpers de formatação (re-exportados para conveniência)
import { formatDayLabel, formatDayShort } from './date';
