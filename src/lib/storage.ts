import {
  DEFAULT_HABITS,
  DEFAULT_PIPELINE_STAGES,
  DEFAULT_SLEEP_SETTINGS,
  DEFAULT_USER_ID,
} from './constants';
import { calculateSleepQuality } from './sleep-calc';
import { isSupabaseConfigured, supabase } from './supabase';
import { generateSampleData } from './sample-data';
import {
  Habit,
  HabitLog,
  NapEntry,
  PipelineContact,
  PipelineStage,
  Run,
  SleepEntry,
  SleepSettings,
  Task,
  DailyLogEntry,
  DailySummary,
} from '../types/index';

// Browser LocalStorage keys with safe prefix
const LS_PREFIX = 'kaivex_store_';

export function getLocal<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (raw === null || raw === undefined) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export function setLocal<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(val));
  } catch (err) {
    console.error('LocalStorage error:', err);
  }
}

// ----------------- HABITS -----------------
export async function getHabits(): Promise<Habit[]> {
  const localHabits = getLocal<Habit[]>('habits', DEFAULT_HABITS);

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('order_index', { ascending: true });
      if (!error && Array.isArray(data) && data.length > 0) {
        const map = new Map<string, Habit>();
        localHabits.forEach(h => map.set(h.id, h));
        data.forEach(h => map.set(h.id, h));
        const merged = Array.from(map.values()).sort((a, b) => a.order_index - b.order_index);
        setLocal('habits', merged);
        return merged;
      }
    } catch (err) {
      console.warn('Supabase getHabits fallback:', err);
    }
  }

  return localHabits;
}

export async function saveHabit(habit: Partial<Habit> & { name: string; type: Habit['type'] }): Promise<Habit> {
  const habits = await getHabits();
  const id = habit.id || crypto.randomUUID();
  const newHabit: Habit = {
    id,
    user_id: DEFAULT_USER_ID,
    name: habit.name,
    type: habit.type,
    target_value: habit.target_value ?? (habit.type === 'counter' ? 5 : 1),
    is_active: habit.is_active !== undefined ? habit.is_active : true,
    order_index: habit.order_index ?? habits.length + 1,
    created_at: habit.created_at || new Date().toISOString(),
  };

  const existingIdx = habits.findIndex(h => h.id === id);
  let updatedHabits: Habit[];
  if (existingIdx >= 0) {
    updatedHabits = habits.map(h => (h.id === id ? newHabit : h));
  } else {
    updatedHabits = [...habits, newHabit];
  }
  setLocal('habits', updatedHabits);

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('habits').upsert(newHabit).select().single();
      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('Supabase saveHabit fallback:', err);
    }
  }

  return newHabit;
}

export async function archiveHabit(id: string, is_active: boolean = false): Promise<void> {
  const habits = getLocal<Habit[]>('habits', DEFAULT_HABITS);
  const updated = habits.map(h => (h.id === id ? { ...h, is_active } : h));
  setLocal('habits', updated);

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('habits').update({ is_active }).eq('id', id);
    } catch (err) {
      console.warn('Supabase archiveHabit fallback:', err);
    }
  }
}

export async function deleteHabit(id: string): Promise<void> {
  // CRITICAL FIX: Only delete the targeted habit and its associated logs.
  // NEVER touch sleep, pipeline contacts, tasks, or runs!
  const habits = getLocal<Habit[]>('habits', DEFAULT_HABITS);
  const filteredHabits = habits.filter(h => h.id !== id);
  setLocal('habits', filteredHabits);

  const logs = getLocal<HabitLog[]>('habit_logs', []);
  const filteredLogs = logs.filter(l => l.habit_id !== id);
  setLocal('habit_logs', filteredLogs);

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('habit_logs').delete().eq('habit_id', id);
      await supabase.from('habits').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteHabit fallback:', err);
    }
  }
}

// ----------------- HABIT LOGS -----------------
export async function getHabitLogs(startDate?: string, endDate?: string): Promise<HabitLog[]> {
  let localLogs = getLocal<HabitLog[]>('habit_logs', []);

  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase.from('habit_logs').select('*');
      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);
      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        const map = new Map<string, HabitLog>();
        localLogs.forEach(l => map.set(`${l.habit_id}_${l.date}`, l));
        data.forEach(l => map.set(`${l.habit_id}_${l.date}`, l));
        const merged = Array.from(map.values());
        setLocal('habit_logs', merged);
        localLogs = merged;
      }
    } catch (err) {
      console.warn('Supabase getHabitLogs fallback:', err);
    }
  }

  return localLogs.filter(l => {
    if (startDate && l.date < startDate) return false;
    if (endDate && l.date > endDate) return false;
    return true;
  });
}

export async function saveHabitLog(habit_id: string, date: string, value: number): Promise<HabitLog> {
  const log: HabitLog = {
    id: crypto.randomUUID(),
    habit_id,
    date,
    value,
    updated_at: new Date().toISOString(),
  };

  const logs = getLocal<HabitLog[]>('habit_logs', []);
  const existingIdx = logs.findIndex(l => l.habit_id === habit_id && l.date === date);
  let updatedLogs: HabitLog[];
  if (existingIdx >= 0) {
    log.id = logs[existingIdx].id;
    updatedLogs = logs.map((l, idx) => (idx === existingIdx ? { ...l, value, updated_at: new Date().toISOString() } : l));
  } else {
    updatedLogs = [...logs, log];
  }
  setLocal('habit_logs', updatedLogs);

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('habit_logs')
        .upsert({ habit_id, date, value, updated_at: new Date().toISOString() }, { onConflict: 'habit_id,date' })
        .select()
        .single();
      if (!error && data) {
        log.id = data.id;
      }
    } catch (err) {
      console.warn('Supabase saveHabitLog fallback:', err);
    }
  }

  return log;
}

// ----------------- SLEEP & NAPS -----------------
export async function getSleepSettings(): Promise<SleepSettings> {
  const localSettings = getLocal<SleepSettings>('sleep_settings', DEFAULT_SLEEP_SETTINGS);

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('sleep_settings').select('*').limit(1).maybeSingle();
      if (!error && data) {
        setLocal('sleep_settings', data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase getSleepSettings fallback:', err);
    }
  }
  return localSettings;
}

export async function saveSleepSettings(settings: SleepSettings): Promise<SleepSettings> {
  setLocal('sleep_settings', settings);

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('sleep_settings')
        .upsert(settings, { onConflict: 'user_id' })
        .select()
        .single();
      if (!error && data) {
        setLocal('sleep_settings', data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase saveSleepSettings fallback:', err);
    }
  }
  return settings;
}

export async function getNaps(date: string): Promise<NapEntry[]> {
  const allNaps = getLocal<NapEntry[]>('nap_entries', []);
  const localDateNaps = allNaps.filter(n => n.date === date);

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('nap_entries')
        .select('*')
        .eq('date', date)
        .order('start_time', { ascending: true });
      if (!error && Array.isArray(data) && data.length > 0) {
        const map = new Map<string, NapEntry>();
        allNaps.forEach(n => map.set(n.id, n));
        data.forEach(n => map.set(n.id, n));
        const merged = Array.from(map.values());
        setLocal('nap_entries', merged);
        return merged.filter(n => n.date === date);
      }
    } catch (err) {
      console.warn('Supabase getNaps fallback:', err);
    }
  }

  return localDateNaps;
}

export async function getAllNaps(): Promise<NapEntry[]> {
  const localNaps = getLocal<NapEntry[]>('nap_entries', []);

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('nap_entries').select('*').order('date', { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) {
        const map = new Map<string, NapEntry>();
        localNaps.forEach(n => map.set(n.id, n));
        data.forEach(n => map.set(n.id, n));
        const merged = Array.from(map.values());
        setLocal('nap_entries', merged);
        return merged;
      }
    } catch (err) {
      console.warn('Supabase getAllNaps fallback:', err);
    }
  }
  return localNaps;
}

export async function saveNap(nap: { id?: string; user_id?: string; date: string; start_time: string; end_time: string; notes?: string | null }): Promise<NapEntry> {
  const start = new Date(nap.start_time);
  const end = new Date(nap.end_time);
  const duration_minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60)));

  const entry: NapEntry = {
    id: nap.id || crypto.randomUUID(),
    user_id: DEFAULT_USER_ID,
    date: nap.date,
    start_time: nap.start_time,
    end_time: nap.end_time,
    duration_minutes,
    notes: nap.notes || null,
    created_at: new Date().toISOString(),
  };

  const naps = getLocal<NapEntry[]>('nap_entries', []);
  const filtered = naps.filter(n => n.id !== entry.id);
  setLocal('nap_entries', [...filtered, entry]);

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('nap_entries').upsert(entry).select().single();
      if (!error && data) {
        entry.id = data.id;
      }
    } catch (err) {
      console.warn('Supabase saveNap fallback:', err);
    }
  }

  await recalculateSleepQualityForDate(nap.date);
  return entry;
}

export async function deleteNap(id: string, date: string): Promise<void> {
  const naps = getLocal<NapEntry[]>('nap_entries', []);
  setLocal('nap_entries', naps.filter(n => n.id !== id));

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('nap_entries').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteNap fallback:', err);
    }
  }

  await recalculateSleepQualityForDate(date);
}

export async function getSleepEntry(date: string): Promise<SleepEntry | null> {
  const entries = getLocal<SleepEntry[]>('sleep_entries', []);
  const localMatch = entries.find(e => e.date === date) || null;

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('sleep_entries').select('*').eq('date', date).maybeSingle();
      if (!error && data) {
        const filtered = entries.filter(e => e.date !== date);
        setLocal('sleep_entries', [...filtered, data]);
        return data;
      }
    } catch (err) {
      console.warn('Supabase getSleepEntry fallback:', err);
    }
  }

  return localMatch;
}

export async function getSleepHistory(limit: number = 30): Promise<SleepEntry[]> {
  let entries = getLocal<SleepEntry[]>('sleep_entries', []);

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('sleep_entries')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit);
      if (!error && Array.isArray(data) && data.length > 0) {
        const map = new Map<string, SleepEntry>();
        entries.forEach(e => map.set(e.date, e));
        data.forEach(e => map.set(e.date, e));
        const merged = Array.from(map.values());
        setLocal('sleep_entries', merged);
        entries = merged;
      }
    } catch (err) {
      console.warn('Supabase getSleepHistory fallback:', err);
    }
  }

  return entries.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

export async function saveSleepEntry(
  entryInput: Omit<SleepEntry, 'id' | 'duration_minutes' | 'quality_score'> & { id?: string }
): Promise<SleepEntry> {
  const settings = await getSleepSettings();
  const naps = await getNaps(entryInput.date);

  const breakdown = calculateSleepQuality(
    entryInput.sleep_time,
    entryInput.wake_time,
    settings,
    naps
  );

  const entry: SleepEntry = {
    id: entryInput.id || crypto.randomUUID(),
    user_id: DEFAULT_USER_ID,
    date: entryInput.date,
    sleep_time: entryInput.sleep_time,
    wake_time: entryInput.wake_time,
    duration_minutes: breakdown.duration_minutes,
    quality_score: breakdown.final_quality_score,
    notes: entryInput.notes || null,
    updated_at: new Date().toISOString(),
  };

  const entries = getLocal<SleepEntry[]>('sleep_entries', []);
  const filtered = entries.filter(e => e.date !== entry.date);
  setLocal('sleep_entries', [...filtered, entry]);

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('sleep_entries')
        .upsert(entry, { onConflict: 'user_id,date' })
        .select()
        .single();
      if (!error && data) {
        entry.id = data.id;
      }
    } catch (err) {
      console.warn('Supabase saveSleepEntry fallback:', err);
    }
  }

  return entry;
}

export async function recalculateSleepQualityForDate(date: string): Promise<void> {
  const entry = await getSleepEntry(date);
  if (!entry) return;

  const settings = await getSleepSettings();
  const naps = await getNaps(date);

  const breakdown = calculateSleepQuality(entry.sleep_time, entry.wake_time, settings, naps);
  entry.quality_score = breakdown.final_quality_score;
  entry.duration_minutes = breakdown.duration_minutes;
  entry.updated_at = new Date().toISOString();

  const entries = getLocal<SleepEntry[]>('sleep_entries', []);
  setLocal('sleep_entries', entries.map(e => (e.id === entry.id ? entry : e)));

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('sleep_entries')
        .update({ quality_score: entry.quality_score, duration_minutes: entry.duration_minutes })
        .eq('id', entry.id);
    } catch (err) {
      console.warn('Supabase recalculate error:', err);
    }
  }
}

// ----------------- RUNS -----------------
export async function getRuns(): Promise<Run[]> {
  let runs = getLocal<Run[]>('runs', []);

  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/runs');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.runs) && data.runs.length > 0) {
          const map = new Map<string, Run>();
          runs.forEach(r => map.set(r.id, r));
          data.runs.forEach((r: Run) => map.set(r.id, r));
          const merged = Array.from(map.values());
          setLocal('runs', merged);
          runs = merged;
        }
      }
    } catch (err) {
      console.warn('API getRuns error:', err);
    }
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('runs').select('*').order('date', { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) {
        const map = new Map<string, Run>();
        runs.forEach(r => map.set(r.id, r));
        data.forEach(r => map.set(r.id, r));
        const merged = Array.from(map.values());
        setLocal('runs', merged);
        runs = merged;
      }
    } catch (err) {
      console.warn('Supabase getRuns fallback:', err);
    }
  }

  return runs.sort((a, b) => b.date.localeCompare(a.date));
}

export async function saveRun(runInput: Omit<Run, 'id'> & { id?: string }): Promise<Run> {
  const run: Run = {
    id: runInput.id || crypto.randomUUID(),
    user_id: DEFAULT_USER_ID,
    date: runInput.date,
    distance_km: Number(runInput.distance_km),
    duration_minutes: Number(runInput.duration_minutes),
    pace: runInput.pace,
    source: 'manual',
    strava_activity_id: null,
    notes: runInput.notes || null,
    created_at: runInput.created_at || new Date().toISOString(),
  };

  const existingRuns = getLocal<Run[]>('runs', []);
  const filtered = existingRuns.filter(r => r.id !== run.id);
  setLocal('runs', [run, ...filtered]);

  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(run),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.run) {
          const updated = [result.run, ...filtered];
          setLocal('runs', updated);
          return result.run;
        }
      }
    } catch (err) {
      console.warn('API saveRun fallback:', err);
    }
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('runs').upsert(run).select().single();
      if (!error && data) {
        run.id = data.id;
      }
    } catch (err) {
      console.warn('Supabase saveRun fallback:', err);
    }
  }

  return run;
}

export async function deleteRun(id: string): Promise<void> {
  const runs = getLocal<Run[]>('runs', []);
  setLocal('runs', runs.filter(r => r.id !== id));

  if (typeof window !== 'undefined') {
    try {
      await fetch(`/api/runs?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API deleteRun error:', err);
    }
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('runs').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteRun fallback:', err);
    }
  }
}

// ----------------- LINKEDIN PIPELINE -----------------
export async function getPipelineStages(): Promise<PipelineStage[]> {
  const localStages = getLocal<PipelineStage[]>('pipeline_stages', DEFAULT_PIPELINE_STAGES);

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .order('order_index', { ascending: true });
      if (!error && Array.isArray(data) && data.length > 0) {
        setLocal('pipeline_stages', data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase getPipelineStages fallback:', err);
    }
  }
  return localStages;
}

export async function savePipelineStage(stage: Partial<PipelineStage> & { name: string }): Promise<PipelineStage> {
  const stages = await getPipelineStages();
  const id = stage.id || crypto.randomUUID();
  const newStage: PipelineStage = {
    id,
    user_id: DEFAULT_USER_ID,
    name: stage.name,
    order_index: stage.order_index ?? stages.length + 1,
    created_at: stage.created_at || new Date().toISOString(),
  };

  const filtered = stages.filter(s => s.id !== id);
  const updated = [...filtered, newStage].sort((a, b) => a.order_index - b.order_index);
  setLocal('pipeline_stages', updated);

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('pipeline_stages').upsert(newStage).select().single();
      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('Supabase savePipelineStage fallback:', err);
    }
  }

  return newStage;
}

export async function deletePipelineStage(id: string): Promise<void> {
  const stages = getLocal<PipelineStage[]>('pipeline_stages', DEFAULT_PIPELINE_STAGES);
  setLocal('pipeline_stages', stages.filter(s => s.id !== id));

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('pipeline_stages').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deletePipelineStage fallback:', err);
    }
  }
}

export async function getPipelineContacts(): Promise<PipelineContact[]> {
  let contacts = getLocal<PipelineContact[]>('pipeline_contacts', []);

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('pipeline_contacts')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) {
        const map = new Map<string, PipelineContact>();
        contacts.forEach(c => map.set(c.id, c));
        data.forEach(c => map.set(c.id, c));
        const merged = Array.from(map.values());
        setLocal('pipeline_contacts', merged);
        contacts = merged;
      }
    } catch (err) {
      console.warn('Supabase getPipelineContacts fallback:', err);
    }
  }
  return contacts;
}

export async function savePipelineContact(contact: Partial<PipelineContact> & { name: string; current_stage_id: string }): Promise<PipelineContact> {
  const contacts = await getPipelineContacts();
  const id = contact.id || crypto.randomUUID();
  const newContact: PipelineContact = {
    id,
    user_id: DEFAULT_USER_ID,
    name: contact.name,
    linkedin_url: contact.linkedin_url || null,
    current_stage_id: contact.current_stage_id,
    last_contact_date: contact.last_contact_date || null,
    notes: contact.notes || null,
    created_at: contact.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const filtered = contacts.filter(c => c.id !== id);
  const updated = [newContact, ...filtered];
  setLocal('pipeline_contacts', updated);

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('pipeline_contacts').upsert(newContact).select().single();
      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('Supabase savePipelineContact fallback:', err);
    }
  }

  return newContact;
}

export async function deletePipelineContact(id: string): Promise<void> {
  const contacts = getLocal<PipelineContact[]>('pipeline_contacts', []);
  setLocal('pipeline_contacts', contacts.filter(c => c.id !== id));

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('pipeline_contacts').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deletePipelineContact fallback:', err);
    }
  }
}

// ----------------- TASKS (WEEKLY KANBAN) -----------------
export async function getTasks(weekStartDate?: string): Promise<Task[]> {
  let allTasks = getLocal<Task[]>('tasks', []);

  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase.from('tasks').select('*');
      if (weekStartDate) query = query.eq('week_start_date', weekStartDate);
      const { data, error } = await query.order('order_index', { ascending: true });
      if (!error && Array.isArray(data) && data.length > 0) {
        const map = new Map<string, Task>();
        allTasks.forEach(t => map.set(t.id, t));
        data.forEach(t => map.set(t.id, t));
        const merged = Array.from(map.values());
        setLocal('tasks', merged);
        allTasks = merged;
      }
    } catch (err) {
      console.warn('Supabase getTasks fallback:', err);
    }
  }

  if (weekStartDate) {
    return allTasks.filter(t => t.week_start_date === weekStartDate);
  }
  return allTasks;
}

export async function saveTask(taskInput: Partial<Task> & { title: string; day_of_week: Task['day_of_week']; week_start_date: string; date: string }): Promise<Task> {
  const tasks = await getTasks();
  const id = taskInput.id || crypto.randomUUID();
  const task: Task = {
    id,
    user_id: DEFAULT_USER_ID,
    title: taskInput.title,
    notes: taskInput.notes || null,
    day_of_week: taskInput.day_of_week,
    week_start_date: taskInput.week_start_date,
    date: taskInput.date,
    is_done: Boolean(taskInput.is_done),
    priority: taskInput.priority || null,
    order_index: taskInput.order_index ?? tasks.length,
    created_at: taskInput.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const allTasks = getLocal<Task[]>('tasks', []);
  const filtered = allTasks.filter(t => t.id !== task.id);
  setLocal('tasks', [...filtered, task]);

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('tasks').upsert(task).select().single();
      if (!error && data) {
        task.id = data.id;
      }
    } catch (err) {
      console.warn('Supabase saveTask fallback:', err);
    }
  }

  return task;
}

export async function toggleTaskDone(id: string, is_done: boolean): Promise<void> {
  const allTasks = getLocal<Task[]>('tasks', []);
  setLocal('tasks', allTasks.map(t => (t.id === id ? { ...t, is_done, updated_at: new Date().toISOString() } : t)));

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('tasks').update({ is_done, updated_at: new Date().toISOString() }).eq('id', id);
    } catch (err) {
      console.warn('Supabase toggleTaskDone fallback:', err);
    }
  }
}

export async function deleteTask(id: string): Promise<void> {
  const allTasks = getLocal<Task[]>('tasks', []);
  setLocal('tasks', allTasks.filter(t => t.id !== id));

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('tasks').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteTask fallback:', err);
    }
  }
}

// ----------------- DAILY MICRO-LOGS & TIMELINE STREAM -----------------
export async function getDailyLogs(date?: string): Promise<DailyLogEntry[]> {
  let logs = getLocal<DailyLogEntry[]>('daily_logs', []);

  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase.from('daily_logs').select('*').eq('user_id', DEFAULT_USER_ID);
      if (date) {
        query = query.eq('date', date);
      }
      const { data, error } = await query.order('time', { ascending: true });
      if (!error && data) {
        const remoteMap = new Map<string, DailyLogEntry>();
        data.forEach((l: DailyLogEntry) => remoteMap.set(l.id, l));
        logs.forEach(l => {
          if (!remoteMap.has(l.id) && (!date || l.date === date)) {
            remoteMap.set(l.id, l);
          }
        });
        const merged = Array.from(remoteMap.values());
        if (date) {
          const others = logs.filter(l => l.date !== date);
          logs = [...others, ...data];
        } else {
          logs = merged;
        }
        setLocal('daily_logs', logs);
      }
    } catch (err) {
      console.warn('Supabase getDailyLogs fallback:', err);
    }
  }

  if (date) {
    logs = logs.filter(l => l.date === date);
  }

  return logs.sort((a, b) => a.time.localeCompare(b.time));
}

export async function saveDailyLog(logInput: Omit<DailyLogEntry, 'id'> & { id?: string }): Promise<DailyLogEntry> {
  const entry: DailyLogEntry = {
    id: logInput.id || crypto.randomUUID(),
    user_id: DEFAULT_USER_ID,
    date: logInput.date,
    time: logInput.time,
    timestamp: logInput.timestamp || `${logInput.date}T${logInput.time}:00.000Z`,
    content: logInput.content.trim(),
    category: logInput.category || 'general',
    mood_energy: logInput.mood_energy ?? null,
    created_at: logInput.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const allLogs = getLocal<DailyLogEntry[]>('daily_logs', []);
  const filtered = allLogs.filter(l => l.id !== entry.id);
  setLocal('daily_logs', [...filtered, entry]);

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('daily_logs').upsert(entry);
    } catch (err) {
      console.warn('Supabase saveDailyLog fallback:', err);
    }
  }

  return entry;
}

export async function deleteDailyLog(id: string): Promise<void> {
  const allLogs = getLocal<DailyLogEntry[]>('daily_logs', []);
  setLocal('daily_logs', allLogs.filter(l => l.id !== id));

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('daily_logs').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteDailyLog fallback:', err);
    }
  }
}

// ----------------- DAILY SUMMARY -----------------
export async function getDailySummary(date: string): Promise<DailySummary | null> {
  const summaries = getLocal<DailySummary[]>('daily_summaries', []);
  let summary = summaries.find(s => s.date === date) || null;

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('daily_summaries')
        .select('*')
        .eq('user_id', DEFAULT_USER_ID)
        .eq('date', date)
        .maybeSingle();

      if (!error && data) {
        summary = data;
        const filtered = summaries.filter(s => s.date !== date);
        setLocal('daily_summaries', [...filtered, data]);
      }
    } catch (err) {
      console.warn('Supabase getDailySummary fallback:', err);
    }
  }

  return summary;
}

export async function saveDailySummary(summaryInput: Omit<DailySummary, 'id'> & { id?: string }): Promise<DailySummary> {
  const summary: DailySummary = {
    id: summaryInput.id || crypto.randomUUID(),
    user_id: DEFAULT_USER_ID,
    date: summaryInput.date,
    key_win: summaryInput.key_win?.trim() || null,
    lessons_learned: summaryInput.lessons_learned?.trim() || null,
    day_rating: summaryInput.day_rating ?? null,
    compiled_digest: summaryInput.compiled_digest || null,
    created_at: summaryInput.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const allSummaries = getLocal<DailySummary[]>('daily_summaries', []);
  const filtered = allSummaries.filter(s => s.date !== summary.date && s.id !== summary.id);
  setLocal('daily_summaries', [...filtered, summary]);

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('daily_summaries').upsert(summary);
    } catch (err) {
      console.warn('Supabase saveDailySummary fallback:', err);
    }
  }

  return summary;
}

// ----------------- SAMPLE & PREVIEW DATA CONTROLS -----------------
export async function loadSampleData(): Promise<{ success: boolean; message: string }> {
  try {
    const sample = generateSampleData();

    setLocal('habits', sample.habits);
    setLocal('habit_logs', sample.habitLogs);
    setLocal('sleep_entries', sample.sleepEntries);
    setLocal('nap_entries', sample.naps);
    setLocal('runs', sample.runs);
    setLocal('pipeline_contacts', sample.contacts);
    setLocal('pipeline_stages', DEFAULT_PIPELINE_STAGES);
    setLocal('tasks', sample.tasks);
    setLocal('daily_logs', sample.dailyLogs);
    setLocal('daily_summaries', sample.dailySummaries);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('habits').upsert(sample.habits);
        await supabase.from('habit_logs').upsert(sample.habitLogs);
        await supabase.from('sleep_entries').upsert(sample.sleepEntries);
        if (sample.naps.length > 0) {
          await supabase.from('nap_entries').upsert(sample.naps);
        }
        await supabase.from('runs').upsert(sample.runs);
        await supabase.from('pipeline_stages').upsert(DEFAULT_PIPELINE_STAGES);
        await supabase.from('pipeline_contacts').upsert(sample.contacts);
        await supabase.from('tasks').upsert(sample.tasks);
        if (sample.dailyLogs.length > 0) {
          await supabase.from('daily_logs').upsert(sample.dailyLogs);
        }
        if (sample.dailySummaries.length > 0) {
          await supabase.from('daily_summaries').upsert(sample.dailySummaries);
        }
      } catch (sbErr) {
        console.warn('Supabase sample data sync error:', sbErr);
      }
    }

    return { success: true, message: 'Sample data successfully loaded across all modules!' };
  } catch (err: any) {
    console.error('Error loading sample data:', err);
    return { success: false, message: err.message || 'Failed to load sample data.' };
  }
}

export async function clearAllSampleData(): Promise<{ success: boolean; message: string }> {
  try {
    setLocal('habits', DEFAULT_HABITS);
    setLocal('pipeline_stages', DEFAULT_PIPELINE_STAGES);

    setLocal('habit_logs', []);
    setLocal('sleep_entries', []);
    setLocal('nap_entries', []);
    setLocal('runs', []);
    setLocal('pipeline_contacts', []);
    setLocal('tasks', []);
    setLocal('daily_logs', []);
    setLocal('daily_summaries', []);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('habit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('sleep_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('nap_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('runs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('pipeline_contacts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('daily_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('daily_summaries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (sbErr) {
        console.warn('Supabase clear error:', sbErr);
      }
    }

    return { success: true, message: 'All test/sample data cleared! Clean slate restored.' };
  } catch (err: any) {
    console.error('Error clearing sample data:', err);
    return { success: false, message: err.message || 'Failed to clear sample data.' };
  }
}

// ----------------- FULL DATA EXPORT -----------------
export async function getAllDataForExport(): Promise<Record<string, unknown>> {
  const habits = await getHabits();
  const habit_logs = await getHabitLogs();
  const sleep_entries = await getSleepHistory(1000);
  const nap_entries = await getAllNaps();
  const sleep_settings = await getSleepSettings();
  const runs = await getRuns();
  const pipeline_stages = await getPipelineStages();
  const pipeline_contacts = await getPipelineContacts();
  const tasks = await getTasks();
  const daily_logs = await getDailyLogs();
  const daily_summaries = getLocal<DailySummary[]>('daily_summaries', []);

  return {
    exported_at: new Date().toISOString(),
    user_id: DEFAULT_USER_ID,
    habits,
    habit_logs,
    sleep_entries,
    nap_entries,
    sleep_settings,
    runs,
    pipeline_stages,
    pipeline_contacts,
    tasks,
    daily_logs,
    daily_summaries,
  };
}
