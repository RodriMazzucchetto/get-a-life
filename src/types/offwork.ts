// Tipos para funcionalidade Off Work

export type Category = 'saude' | 'social' | 'aprendizado' | 'aventura' | 'criatividade' | 'familia';

export interface Idea {
  id: string;
  title: string;
  category: Category;
  created_at: string;
}

export interface WeekSelection {
  id: string;
  idea_id: string;
  week_start: string;
  selected_at: string;
}

export interface DayAssignment {
  id: string;
  idea_id: string;
  date: string;
  assigned_at: string;
}

export interface IdeaWithSelection extends Idea {
  isSelected: boolean;
  assignedDate?: string;
}

export interface DayData {
  date: string;
  label: string;
  shortLabel: string;
  assignments: IdeaWithSelection[];
}

export interface WeekData {
  weekStart: string;
  days: DayData[];
  selectedIdeas: IdeaWithSelection[];
  unassignedIdeas: IdeaWithSelection[];
}

// Configurações de categoria
export const CATEGORY_CONFIG: Record<Category, { 
  label: string; 
  color: string; 
  icon: string; 
  bgColor: string;
}> = {
  saude: {
    label: 'Saúde',
    color: 'text-green-600',
    icon: '💚',
    bgColor: 'bg-green-50'
  },
  social: {
    label: 'Social',
    color: 'text-blue-600',
    icon: '👥',
    bgColor: 'bg-blue-50'
  },
  aprendizado: {
    label: 'Aprendizado',
    color: 'text-purple-600',
    icon: '📚',
    bgColor: 'bg-purple-50'
  },
  aventura: {
    label: 'Aventura',
    color: 'text-orange-600',
    icon: '🏔️',
    bgColor: 'bg-orange-50'
  },
  criatividade: {
    label: 'Criatividade',
    color: 'text-pink-600',
    icon: '🎨',
    bgColor: 'bg-pink-50'
  },
  familia: {
    label: 'Família',
    color: 'text-indigo-600',
    icon: '👨‍👩‍👧‍👦',
    bgColor: 'bg-indigo-50'
  }
};
