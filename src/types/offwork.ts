// Tipos para funcionalidade Off Work

export type Category = 'crescimento' | 'mini-aventuras' | 'lifestyle' | 'esporte' | 'social' | 'relacionamentos' | 'hobbies' | 'viagens' | 'saude' | 'aprendizado' | 'criatividade' | 'familia' | 'aventura';

export interface Idea {
  id: string;
  title: string;
  category: Category;
  subcategory?: string;
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

// Configurações de categoria baseadas no mapa mental "Getting a Life"
export const CATEGORY_CONFIG: Record<Category, { 
  label: string; 
  color: string; 
  icon: string; 
  bgColor: string;
}> = {
  crescimento: {
    label: 'Crescimento',
    color: 'text-pink-600',
    icon: '🌱',
    bgColor: 'bg-pink-50'
  },
  'mini-aventuras': {
    label: 'Mini Aventuras',
    color: 'text-yellow-600',
    icon: '🎯',
    bgColor: 'bg-yellow-50'
  },
  lifestyle: {
    label: 'Lifestyle',
    color: 'text-green-600',
    icon: '✨',
    bgColor: 'bg-green-50'
  },
  esporte: {
    label: 'Esporte',
    color: 'text-blue-600',
    icon: '🏃‍♂️',
    bgColor: 'bg-blue-50'
  },
  social: {
    label: 'Social',
    color: 'text-orange-600',
    icon: '🤝',
    bgColor: 'bg-orange-50'
  },
  relacionamentos: {
    label: 'Relacionamentos',
    color: 'text-red-600',
    icon: '💕',
    bgColor: 'bg-red-50'
  },
  hobbies: {
    label: 'Hobbies',
    color: 'text-purple-600',
    icon: '🎨',
    bgColor: 'bg-purple-50'
  },
  viagens: {
    label: 'Viagens',
    color: 'text-indigo-600',
    icon: '✈️',
    bgColor: 'bg-indigo-50'
  },
  // Categorias antigas para compatibilidade
  saude: {
    label: 'Saúde',
    color: 'text-green-600',
    icon: '💚',
    bgColor: 'bg-green-50'
  },
  aprendizado: {
    label: 'Aprendizado',
    color: 'text-purple-600',
    icon: '📚',
    bgColor: 'bg-purple-50'
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
  },
  aventura: {
    label: 'Aventura',
    color: 'text-orange-600',
    icon: '🏔️',
    bgColor: 'bg-orange-50'
  }
};
