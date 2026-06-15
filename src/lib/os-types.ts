export type OsBlockType = 'finance' | 'growth' | 'ops'
export type OsGoalStatus = 'active' | 'achieved' | 'abandoned'
export type OsCycleStatus = 'active' | 'closed'
export type OsBetStatus =
  | 'draft'
  | 'banked'
  | 'rejected'
  | 'on_course'
  | 'deviating'
  | 'executed'
  | 'failed'
export type OsBetUpdateStatus = 'on_course' | 'deviating' | 'executed' | 'failed'
export type OsTaskBoardStatus = 'backlog' | 'current_week' | 'in_progress'
/** @deprecated Use OsTaskBoardStatus — kept as alias during transition */
export type OsTaskStatus = OsTaskBoardStatus

export interface OsBlockRow {
  id: string
  user_id: string
  project_id: string
  type: OsBlockType
  created_at: string
}

export interface OsGoalRow {
  id: string
  user_id: string
  block_id: string
  title: string
  description: string | null
  appetite_cycles: number | null
  status: OsGoalStatus
  is_priority: boolean
  pos: number | null
  created_at: string
  updated_at: string
}

export interface OsCycleRow {
  id: string
  user_id: string
  project_id: string
  cycle_month: string
  status: OsCycleStatus
  created_at: string
  updated_at: string
}

export interface OsBetRow {
  id: string
  user_id: string
  goal_id: string
  cycle_id: string | null
  title: string
  pitch_objective: string | null
  pitch_outcome: string | null
  pitch_data: string | null
  impact_score: number | null
  effort_score: number | null
  priority_score: number | null
  status: OsBetStatus
  is_priority: boolean
  pos: number | null
  execution_owner: string | null
  created_at: string
  updated_at: string
}

export interface OsBetUpdateRow {
  id: string
  user_id: string
  bet_id: string
  week_start: string
  status: OsBetUpdateStatus
  what_done: string | null
  blockers: string | null
  created_at: string
}

export interface OsTaskRow {
  id: string
  user_id: string
  project_id: string | null
  bet_id: string | null
  title: string
  description: string | null
  is_maintenance: boolean
  status: OsTaskBoardStatus
  on_hold: boolean
  on_hold_reason: string | null
  priority: string | null
  due_date: string | null
  completed_at: string | null
  pos: number | null
  importance: number | null
  urgency: number | null
  created_at: string
  updated_at: string
}

export interface OsBlockInsert {
  user_id: string
  project_id: string
  type: OsBlockType
  created_at?: string
}

export interface OsGoalInsert {
  user_id: string
  block_id: string
  title: string
  description?: string | null
  appetite_cycles?: number | null
  status?: OsGoalStatus
  created_at?: string
  updated_at?: string
}

export interface OsCycleInsert {
  user_id: string
  project_id: string
  cycle_month: string
  status?: OsCycleStatus
  created_at?: string
  updated_at?: string
}

export interface OsBetInsert {
  user_id: string
  goal_id: string
  cycle_id?: string | null
  title: string
  pitch_objective?: string | null
  pitch_outcome?: string | null
  pitch_data?: string | null
  impact_score?: number | null
  effort_score?: number | null
  status?: OsBetStatus
  is_priority?: boolean
  pos?: number | null
  execution_owner?: string | null
  created_at?: string
  updated_at?: string
}

export interface OsBetUpdateInsert {
  user_id: string
  bet_id: string
  week_start: string
  status: OsBetUpdateStatus
  what_done?: string | null
  blockers?: string | null
  created_at?: string
}

export interface OsTaskInsert {
  user_id: string
  project_id?: string | null
  bet_id?: string | null
  title: string
  description?: string | null
  is_maintenance?: boolean
  status?: OsTaskBoardStatus
  on_hold?: boolean
  on_hold_reason?: string | null
  priority?: string | null
  due_date?: string | null
  completed_at?: string | null
  pos?: number | null
  importance?: number | null
  urgency?: number | null
  created_at?: string
  updated_at?: string
}

export type OsBlockUpdate = Partial<Omit<OsBlockRow, 'id' | 'user_id' | 'project_id' | 'created_at'>>
export type OsGoalUpdate = Partial<Omit<OsGoalRow, 'id' | 'user_id' | 'block_id' | 'created_at'>>
export type OsCycleUpdate = Partial<Omit<OsCycleRow, 'id' | 'user_id' | 'project_id' | 'created_at'>>
export type OsBetUpdate = Partial<Omit<OsBetRow, 'id' | 'user_id' | 'goal_id' | 'priority_score' | 'created_at'>>
export type OsBetWeeklyUpdate = Partial<Omit<OsBetUpdateRow, 'id' | 'user_id' | 'bet_id' | 'created_at'>>
export type OsTaskUpdate = Partial<Omit<OsTaskRow, 'id' | 'user_id' | 'created_at'>>

export interface OsDatabaseTables {
  os_blocks: {
    Row: OsBlockRow
    Insert: OsBlockInsert
    Update: OsBlockUpdate
  }
  os_goals: {
    Row: OsGoalRow
    Insert: OsGoalInsert
    Update: OsGoalUpdate
  }
  os_cycles: {
    Row: OsCycleRow
    Insert: OsCycleInsert
    Update: OsCycleUpdate
  }
  os_bets: {
    Row: OsBetRow
    Insert: OsBetInsert
    Update: OsBetUpdate
  }
  os_bet_updates: {
    Row: OsBetUpdateRow
    Insert: OsBetUpdateInsert
    Update: OsBetWeeklyUpdate
  }
  os_tasks: {
    Row: OsTaskRow
    Insert: OsTaskInsert
    Update: OsTaskUpdate
  }
}
