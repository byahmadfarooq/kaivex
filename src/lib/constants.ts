import { Habit, PipelineStage, SleepSettings } from '../types';

export const DEFAULT_USER_ID = process.env.NEXT_PUBLIC_DEFAULT_USER_ID || '00000000-0000-0000-0000-000000000001';

export const DEFAULT_SLEEP_SETTINGS: SleepSettings = {
  user_id: DEFAULT_USER_ID,
  target_bedtime: '22:00',
  target_wake_time: '05:00',
  weight_duration: 0.40,
  weight_bedtime: 0.30,
  weight_wake: 0.30,
  penalty_factor: 1.5,
  nap_threshold_minutes: 60,
  nap_penalty_per_minute: 0.5,
  nap_late_cutoff: '16:00',
  late_nap_penalty_factor: 1.5,
};

export const DEFAULT_HABITS: Habit[] = [
  { id: '11111111-0000-0000-0000-000000000001', user_id: DEFAULT_USER_ID, name: 'Fajr Prayer', type: 'boolean', target_value: 1, is_active: true, order_index: 1 },
  { id: '11111111-0000-0000-0000-000000000002', user_id: DEFAULT_USER_ID, name: 'Zuhr Prayer', type: 'boolean', target_value: 1, is_active: true, order_index: 2 },
  { id: '11111111-0000-0000-0000-000000000003', user_id: DEFAULT_USER_ID, name: 'Asr Prayer', type: 'boolean', target_value: 1, is_active: true, order_index: 3 },
  { id: '11111111-0000-0000-0000-000000000004', user_id: DEFAULT_USER_ID, name: 'Maghrib Prayer', type: 'boolean', target_value: 1, is_active: true, order_index: 4 },
  { id: '11111111-0000-0000-0000-000000000005', user_id: DEFAULT_USER_ID, name: 'Isha Prayer', type: 'boolean', target_value: 1, is_active: true, order_index: 5 },
  { id: '11111111-0000-0000-0000-000000000006', user_id: DEFAULT_USER_ID, name: 'Run', type: 'boolean', target_value: 1, is_active: true, order_index: 6 },
  { id: '11111111-0000-0000-0000-000000000007', user_id: DEFAULT_USER_ID, name: 'LinkedIn Comments', type: 'counter', target_value: 5, is_active: true, order_index: 7 },
  { id: '11111111-0000-0000-0000-000000000008', user_id: DEFAULT_USER_ID, name: 'LinkedIn Connection Requests', type: 'counter', target_value: 20, is_active: true, order_index: 8 },
  { id: '11111111-0000-0000-0000-000000000009', user_id: DEFAULT_USER_ID, name: 'Conversations / DMs Started', type: 'counter', target_value: 5, is_active: true, order_index: 9 },
];

export const DEFAULT_PIPELINE_STAGES: PipelineStage[] = [
  { id: '22222222-0000-0000-0000-000000000001', user_id: DEFAULT_USER_ID, name: 'Contacted', order_index: 1 },
  { id: '22222222-0000-0000-0000-000000000002', user_id: DEFAULT_USER_ID, name: 'Replied', order_index: 2 },
  { id: '22222222-0000-0000-0000-000000000003', user_id: DEFAULT_USER_ID, name: 'Conversation', order_index: 3 },
  { id: '22222222-0000-0000-0000-000000000004', user_id: DEFAULT_USER_ID, name: 'Call Booked', order_index: 4 },
  { id: '22222222-0000-0000-0000-000000000005', user_id: DEFAULT_USER_ID, name: 'Closed', order_index: 5 },
];

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;