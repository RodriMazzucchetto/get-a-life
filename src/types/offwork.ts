export interface OffWorkCategory {
  id: string
  name: string
  color: string
  description?: string
  icon?: string
  activity_count?: number
  created_at: string
  updated_at: string
}

export interface OffWorkActivity {
  id: string
  user_id: string
  category_id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  estimated_duration?: number
  actual_duration?: number
  due_date?: string
  completed_at?: string
  tags?: string[]
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
  offwork_categories?: OffWorkCategory
}

export interface OffWorkIdea {
  id: string
  user_id: string
  category_id: string
  title: string
  description?: string
  source?: string
  status: 'idea' | 'planned' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  estimated_duration?: number
  tags?: string[]
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
  offwork_categories?: OffWorkCategory
}

export interface CreateActivityData {
  category_id: string
  title: string
  description?: string
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority?: 'low' | 'medium' | 'high'
  estimated_duration?: number
  due_date?: string
  tags?: string[]
  metadata?: Record<string, unknown>
}

export interface UpdateActivityData {
  title?: string
  description?: string
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority?: 'low' | 'medium' | 'high'
  estimated_duration?: number
  actual_duration?: number
  due_date?: string
  completed_at?: string
  tags?: string[]
  metadata?: Record<string, unknown>
}

export interface CreateIdeaData {
  category_id: string
  title: string
  description?: string
  status?: 'idea' | 'planned' | 'in_progress' | 'completed' | 'cancelled'
  priority?: 'low' | 'medium' | 'high'
  estimated_duration?: number
  tags?: string[]
  metadata?: Record<string, unknown>
  source?: string
}