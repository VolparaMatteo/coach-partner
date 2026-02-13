export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  phone: string | null
  avatar_url: string | null
  sport: string | null
  coaching_level: string | null
  years_experience: number | null
  onboarding_completed: boolean
  onboarding_step: number
  philosophy_focus: string | null
  created_at: string
}

export interface Team {
  id: number
  coach_id: number
  name: string
  sport: string
  category: string | null
  level: string | null
  gender: string | null
  num_athletes: number | null
  training_days: string | null
  match_day: string | null
  season: string | null
  athletes_count: number
  created_at: string
}

export interface Athlete {
  id: number
  team_id: number
  first_name: string
  last_name: string
  full_name: string
  birth_date: string | null
  photo_url: string | null
  jersey_number: number | null
  position: string | null
  secondary_position: string | null
  dominant_foot: string | null
  dominant_hand: string | null
  height_cm: number | null
  weight_kg: number | null
  status: 'available' | 'attention' | 'unavailable'
  notes: string | null
  objectives: string | null
  created_at: string
}

export interface TrainingSession {
  id: number
  team_id: number
  date: string
  start_time: string | null
  end_time: string | null
  duration_minutes: number | null
  title: string | null
  objectives: string | null
  status: 'planned' | 'in_progress' | 'completed'
  rpe_avg: number | null
  session_rating: number | null
  what_worked: string | null
  what_to_improve: string | null
  template_name: string | null
  blocks_count: number
  blocks?: TrainingBlock[]
  created_at: string
}

export interface TrainingBlock {
  id: number
  session_id: number
  order: number
  block_type: string
  name: string
  objective: string | null
  duration_minutes: number | null
  intensity: string | null
  description: string | null
  coaching_points: string | null
  variations: string | null
  equipment: string | null
  space: string | null
  num_players: string | null
  rules: string | null
  tags: string | null
  completed: boolean
  actual_rpe: number | null
  notes: string | null
  video_url: string | null
}

export interface Match {
  id: number
  team_id: number
  date: string
  time: string | null
  competition: string | null
  opponent: string
  venue: string | null
  home_away: string
  status: 'upcoming' | 'in_progress' | 'completed'
  called_up: string | null
  game_plan: string | null
  opponent_analysis: string | null
  special_situations: string | null
  score_home: number | null
  score_away: number | null
  result: string | null
  what_worked: string | null
  what_didnt_work: string | null
  key_moments: string | null
  training_priorities: string | null
  created_at: string
}

export interface Evaluation {
  id: number
  athlete_id: number
  training_session_id: number | null
  match_id: number | null
  date: string
  technical: number | null
  tactical: number | null
  physical: number | null
  mental: number | null
  discipline: number | null
  form: number | null
  overall: number | null
  comment: string | null
  tags: string | null
  created_at: string
}

export interface WellnessEntry {
  id: number
  athlete_id: number
  date: string
  energy: number | null
  sleep_quality: number | null
  stress: number | null
  doms: number | null
  pain: number | null
  mood: string | null
  notes: string | null
}

export interface Note {
  id: number
  coach_id: number
  entity_type: string | null
  entity_id: number | null
  text: string
  tags: string | null
  is_quick_note: boolean
  created_at: string
}

export interface AIReport {
  id: number
  coach_id: number
  report_type: string
  title: string | null
  content: string
  confidence: string | null
  feedback: string | null
  saved: boolean
  created_at: string
}

export interface SportConfig {
  label: string
  positions: { value: string; label: string }[]
  categories: { value: string; label: string }[]
  block_types: { value: string; label: string }[]
  session_objectives: string[]
  evaluation_tags: string[]
  physical_attribute: string
}

export interface Season {
  id: number
  coach_id: number
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  notes: string | null
  created_at: string
}

export interface StaffMember {
  id: number
  coach_id: number
  user_id: number | null
  email: string
  name: string | null
  role: 'viewer' | 'editor' | 'admin'
  status: 'pending' | 'active' | 'revoked'
  team_ids: number[] | null
  created_at: string
}

export interface Goal {
  id: number
  athlete_id: number
  title: string
  description: string | null
  category: string | null
  deadline: string | null
  progress: number
  status: 'active' | 'completed' | 'abandoned'
  created_at: string
}

export interface TimelineEvent {
  type: 'evaluation' | 'note' | 'injury' | 'attendance' | 'wellness'
  date: string
  data: Record<string, unknown>
}

export interface PeriodizationCycle {
  id: number
  team_id: number
  parent_id: number | null
  name: string
  cycle_type: 'macro' | 'meso' | 'micro'
  start_date: string
  end_date: string
  objectives: string | null
  planned_load: string | null
  notes: string | null
  color: string | null
  created_at: string
}

export interface TrainingLoadData {
  acwr: number
  acute_load: number
  chronic_load: number
  monotony: number
  strain: number
  risk: string
  risk_label: string
  risk_color: string
  weekly_trend: { week: string; load: number; sessions: number; avg_daily: number }[]
  athlete_loads: { athlete_id: number; name: string; load: number; sessions: number }[]
}

export interface CommunityPost {
  id: number
  author_id: number
  author_name: string | null
  author_sport: string | null
  author_avatar: string | null
  sport: string
  post_type: 'text' | 'photo' | 'exercise' | 'training'
  content: string | null
  image_url: string | null
  shared_exercise: Record<string, unknown> | null
  shared_training_data: { title?: string; duration_minutes?: number; objectives?: string; blocks?: Record<string, unknown>[] } | null
  likes_count: number
  comments_count: number
  saves_count: number
  liked?: boolean
  saved?: boolean
  created_at: string
}

export interface CommunityComment {
  id: number
  post_id: number
  author_id: number
  author_name: string | null
  author_avatar: string | null
  text: string
  created_at: string
}

export interface CoachProfile {
  id: number
  name: string
  avatar_url: string | null
  sport: string | null
  coaching_level: string | null
  years_experience: number | null
  followers_count: number
  following_count: number
  posts_count: number
  is_following: boolean
  is_self: boolean
}

export interface ChatConversation {
  user_id: number
  name: string
  avatar_url: string | null
  sport: string | null
  last_message: ChatMessage | null
  unread_count: number
}

export interface ChatMessage {
  id: number
  sender_id: number
  receiver_id: number
  sender_name: string | null
  text: string
  read: boolean
  created_at: string
}

export interface ChatRequestType {
  id: number
  from_user_id: number
  from_user_name: string | null
  from_user_avatar: string | null
  from_user_sport: string | null
  to_user_id: number
  to_user_name: string | null
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}
