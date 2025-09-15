// Interface simplificada para ideias off-work
export interface OffWorkIdea {
  id: string
  user_id: string
  title: string
  description?: string
  is_prioritized: boolean
  tags?: string[]
  estimated_duration?: number
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface CreateIdeaData {
  title: string
  description?: string
  tags?: string[]
  estimated_duration?: number
}

export interface UpdateIdeaData {
  title?: string
  description?: string
  is_prioritized?: boolean
  tags?: string[]
  estimated_duration?: number
  completed_at?: string
}