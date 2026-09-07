export interface User {
  id: string;
  email: string;
  created_at?: string;
}

export type HabitType = 'boolean' | 'counter';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  type: HabitType;
  target_value?: number | null;
  is_active: boolean;
  order_index: number;
  created_at?: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  date: string; // YYYY-MM-DD
  value: number; // 0 or 1 for boolean, actual count for counter
  created_at?: string;
  updated_at?: string;
}

export interface SleepEntry {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD ("night of")
  sleep_time: string; // ISO string
  wake_time: string; // ISO string
  duration_minutes: number;
  quality_score: number; // 0 - 100
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface NapEntry {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // ISO string
  end_time: string; // ISO string
  duration_minutes: number;
  notes?: string | null;
  created_at?: string;
}

export interface SleepSettings {
  id?: string;
  user_id: string;
  target_bedtime: string; // "22:00"
  target_wake_time: string; // "05:00"
  weight_duration: number; // 0.40
  weight_bedtime: number; // 0.30
  weight_wake: number; // 0.30
  penalty_factor: number; // 1.5
  nap_threshold_minutes: number; // 60
  nap_penalty_per_minute: number; // 0.5
  nap_late_cutoff: string; // "16:00"
  late_nap_penalty_factor: number; // 1.5
  created_at?: string;
  updated_at?: string;
}

export interface SleepQualityBreakdown {
  duration_minutes: number;
  target_duration_minutes: number;
  duration_score: number;
  bedtime_diff_minutes: number;
  bedtime_score: number;
  wake_diff_minutes: number;
  wake_score: number;
  base_score: number;
  total_nap_minutes: number;
  nap_over_threshold: number;
  is_late_nap: boolean;
  late_nap_multiplier: number;
  nap_penalty: number;
  final_quality_score: number;
}

export interface Run {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  distance_km: number;
  duration_minutes: number;
  pace: string; // e.g. "5:20" min/km
  source: 'manual' | 'strava';
  strava_activity_id?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface PipelineStage {
  id: string;
  user_id: string;
  name: string;
  order_index: number;
  created_at?: string;
}

export interface PipelineContact {
  id: string;
  user_id: string;
  name: string;
  linkedin_url?: string | null;
  current_stage_id: string;
  last_contact_date?: string | null; // YYYY-MM-DD
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  notes?: string | null;
  day_of_week: DayOfWeek;
  week_start_date: string; // YYYY-MM-DD (Monday of week)
  date: string; // YYYY-MM-DD (concrete date)
  is_done: boolean;
  priority?: TaskPriority | null;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export interface DailyDashboardData {
  date: string;
  habits: {
    habit: Habit;
    log?: HabitLog;
  }[];
  habitCompletionPercentage: number;
  sleepEntry?: SleepEntry | null;
  naps: NapEntry[];
  totalNapMinutes: number;
  tasks: Task[];
  run?: Run | null;
  weeklyHabitPercentage: number;
  habitStreakDays: number;
}

export type LogCategory = 'wake' | 'activity' | 'focus' | 'mood' | 'meal' | 'reflection' | 'general';

export interface DailyLogEntry {
  id: string;
  user_id: string;
  date: string;               // YYYY-MM-DD
  time: string;               // HH:mm (e.g. "05:15", "14:30")
  timestamp: string;          // ISO string
  content: string;            // Text of what you are doing/feeling
  category: LogCategory;      // Categorization
  mood_energy?: number | null;// 1 (low/exhausted) to 5 (peak/flow)
  created_at?: string;
  updated_at?: string;
}

export interface DailySummary {
  id: string;
  user_id: string;
  date: string;               // YYYY-MM-DD
  key_win?: string | null;    // Major accomplishment
  lessons_learned?: string | null; // Adjustments or reflections
  day_rating?: number | null; // 1 to 5
  compiled_digest?: string | null; // Auto-compiled text summary
  created_at?: string;
  updated_at?: string;
}