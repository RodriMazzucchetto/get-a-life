// User types
export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  full_name: string
  email: string
  created_at: string
  updated_at: string
  onboarding_data?: OnboardingData
}

export interface UserPreferences {
  interests: string[]
  location: string
  available_time: 'morning' | 'afternoon' | 'evening' | 'night'
  budget_range: 'low' | 'medium' | 'high'
  activity_type: 'indoor' | 'outdoor' | 'both'
  social_preference: 'solo' | 'group' | 'both'
}

// Activity types
export interface Activity {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  location: string
  duration_minutes: number
  cost_range: 'free' | 'low' | 'medium' | 'high'
  indoor_outdoor: 'indoor' | 'outdoor' | 'both'
  social_type: 'solo' | 'group' | 'both'
  difficulty: 'easy' | 'medium' | 'hard'
  weather_dependent: boolean
  created_at: string
  updated_at: string
}

export interface ActivitySuggestion {
  id: string
  user_id: string
  activity_id: string
  suggested_at: string
  context: SuggestionContext
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
  rating?: number
  feedback?: string
}

export interface SuggestionContext {
  mood: 'happy' | 'sad' | 'stressed' | 'energetic' | 'tired' | 'neutral'
  weather: 'sunny' | 'rainy' | 'cloudy' | 'snowy'
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night'
  available_time: number // in minutes
  location: string
}

// Mood tracking
export interface MoodEntry {
  id: string
  user_id: string
  mood: 'happy' | 'sad' | 'stressed' | 'energetic' | 'tired' | 'neutral'
  intensity: 1 | 2 | 3 | 4 | 5
  notes?: string
  created_at: string
}

// Tipos para o onboarding
export interface OnboardingData {
  city: string
  comfortLevel: 'comfort' | 'routine' | 'challenge' | 'surprise'
  interests: string[]
  restrictions: string[]
  currentState: 'automatic' | 'pleasure' | 'stimulus' | 'memories'
  healthConditions: HealthCondition[]
  completed: boolean
  completedAt?: string
}

export interface HealthCondition {
  type: 'mobility' | 'dietary' | 'other'
  details: string[]
  description?: string
}

export interface Memory {
  id: string
  user_id: string
  title: string
  life_front: string
  accepted_at: string
  notes?: string
  media?: string[]
  mood?: string
  created_at: string
}

export interface CreateMemoryData {
  title: string
  life_front: string
  notes?: string
  media?: string[]
  mood?: string
}

export interface OnboardingStep {
  id: string
  title: string
  description: string
  component: React.ComponentType<OnboardingStepProps>
  required: boolean
}

export interface OnboardingStepProps {
  data: Partial<OnboardingData>
  onUpdate: (updates: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
  currentStep: number
  totalSteps: number
}

// Re-export Off Work types
export * from './offwork'

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
      }
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>
      }
      activities: {
        Row: Activity
        Insert: Omit<Activity, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Activity, 'id' | 'created_at' | 'updated_at'>>
      }
      activity_suggestions: {
        Row: ActivitySuggestion
        Insert: Omit<ActivitySuggestion, 'id' | 'suggested_at'>
        Update: Partial<Omit<ActivitySuggestion, 'id' | 'suggested_at'>>
      }
      mood_entries: {
        Row: MoodEntry
        Insert: Omit<MoodEntry, 'id' | 'created_at'>
        Update: Partial<Omit<MoodEntry, 'id' | 'created_at'>>
      }
    }
  }
} 