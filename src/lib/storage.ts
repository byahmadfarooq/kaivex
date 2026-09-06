import {
  DEFAULT_HABITS,
  DEFAULT_PIPELINE_STAGES,
  DEFAULT_SLEEP_SETTINGS,
  DEFAULT_USER_ID,
} from './constants';
import { calculateSleepQuality } from './sleep-calc';
import { isSupabaseConfigured, supabase } from './supabase';
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
} from '../types';

// Browser LocalStorage keys for instant fallback & offline availability
const LS_PREFIX = 'kaivex_store_';

function getLocal<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocal<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(val));
  } catch (err) {
    console.error('LocalStorage error:', err);
  }
}

// ----------------- HABITS -----------------
export async function getHabits(): Promise<Habit[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('order_index', { ascending: true });
      if (!error && data && data.length > 0) {
        setLocal('habits', data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase getHabits fallback:', err);
    }
  }
  return getLocal<Habit[]>('habits', DEFAULT_HABITS);
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

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('habits').upsert(newHabit).select().single();
      if (!error && data) {
        const updated = habits.filter(h => h.id !== id).concat(data);
        setLocal('habits', updated);
        return data;
      }
    } catch (err) {
      console.warn('Supabase saveHabit fallback:', err);
    }
  }

  const existingIdx = habits.findIndex(h => h.id === id);
  let updatedHabits: Habit[];
  if (existingIdx >= 0) {
    updatedHabits = habits.map(h => (h.id === id ? newHabit : h));
  } else {
    updatedHabits = [...habits, newHabit];
  }
  setLocal('habits', updatedHabits);
  return newHabit;
}

export async function archiveHabit(id: string, is_active: boolean = false): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('habits').update({ is_active }).eq('id', id);
    } catch (err) {
      console.warn('Supabase archiveHabit fallback:', err);
    }
  }
  const habits = getLocal<Habit[]>('habits', DEFAULT_HABITS);
  const updated = habits.map(h => (h.id === id ? { ...h, is_active } : h));
  setLocal('habits', updated);
}

export async function deleteHabit(id: string): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('habits').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteHabit fallback:', err);
    }
  }
  const habits = getLocal<Habit[]>('habits', DEFAULT_HABITS);
  setLocal('habits', habits.filter(h => h.id !== id));
}

// ----------------- HABIT LOGS -----------------
export async function getHabitLogs(startDate?: string, endDate?: string): Promise<HabitLog[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase.from('habit_logs').select('*');
      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);
      const { data, error } = await query;
      if (!error && data) {
        const localLogs = getLocal<HabitLog[]>('habit_logs', []);
        // merge unique
        const map = new Map<string, HabitLog>();
        localLogs.forEach(l => map.set(`${l.habit_id}_${l.date}`, l));
        data.forEach(l => map.set(`${l.habit_id}_${l.date}`, l));
        const merged = Array.from(map.values());
        setLocal('habit_logs', merged);
        return data;
      }
    } catch (err) {
      console.warn('Supabase getHabitLogs fallback:', err);
    }
  }

  const logs = getLocal<HabitLog[]>('habit_logs', []);
  return logs.filter(l => {
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

  const logs = getLocal<HabitLog[]>('habit_logs', []);
  const existingIdx = logs.findIndex(l => l.habit_id === habit_id && l.date === date);
  let updatedLogs: HabitLog[];
  if (existingIdx >= 0) {
    updatedLogs = logs.map((l, idx) => (idx === existingIdx ? { ...l, value, updated_at: new Date().toISOString() } : l));
  } else {
    updatedLogs = [...logs, log];
  }
  setLocal('habit_logs', updatedLogs);
  return log;
}

// ----------------- SLEEP & NAPS -----------------
export async function getSleepSettings(): Promise<SleepSettings> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('sleep_settings').select('*').limit(1).single();
      if (!error && data) {
        setLocal('sleep_settings', data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase getSleepSettings fallback:', err);
    }
  }
  return getLocal<SleepSettings>('sleep_settings', DEFAULT_SLEEP_SETTINGS);
}

export async function saveSleepSettings(settings: SleepSettings): Promise<SleepSettings> {
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
  setLocal('sleep_settings', settings);
  return settings;
}

export async function getNaps(date: string): Promise<NapEntry[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('nap_entries').select('*').eq('date', date).order('start_time', { ascending: true });
      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('Supabase getNaps fallback:', err);
    }
  }
  const allNaps = getLocal<NapEntry[]>('nap_entries', []);
  return allNaps.filter(n => n.date === date);
}

export async function getAllNaps(): Promise<NapEntry[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('nap_entries').select('*').order('date', { ascending: false });
      if (!error && data) {
        setLocal('nap_entries', data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase getAllNaps fallback:', err);
    }
  }
  return getLocal<NapEntry[]>('nap_entries', []);
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

  const naps = getLocal<NapEntry[]>('nap_entries', []);
  const filtered = naps.filter(n => n.id !== entry.id);
  setLocal('nap_entries', [...filtered, entry]);

  // Recalculate that day's sleep score if a main sleep entry exists
  await recalculateSleepQualityForDate(nap.date);

  return entry;
}

export async function deleteNap(id: string, date: string): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('nap_entries').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteNap fallback:', err);
    }
  }
  const naps = getLocal<NapEntry[]>('nap_entries', []);
  setLocal('nap_entries', naps.filter(n => n.id !== id));

  // Recalculate sleep score
  await recalculateSleepQualityForDate(date);
}

export async function getSleepEntry(date: string): Promise<SleepEntry | null> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('sleep_entries').select('*').eq('date', date).maybeSingle();
      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('Supabase getSleepEntry fallback:', err);
    }
  }
  const entries = getLocal<SleepEntry[]>('sleep_entries', []);
  return entries.find(e => e.date === date) || null;
}

export async function getSleepHistory(limit: number = 30): Promise<SleepEntry[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('sleep_entries')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit);
      if (!error && data) {
        setLocal('sleep_entries', data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase getSleepHistory fallback:', err);
    }
  }
  const entries = getLocal<SleepEntry[]>('sleep_entries', []);
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

  const entries = getLocal<SleepEntry[]>('sleep_entries', []);
  const filtered = entries.filter(e => e.date !== entry.date);
  setLocal('sleep_entries', [...filtered, entry]);
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

  const entries = getLocal<SleepEntry[]>('sleep_entries', []);
  setLocal(
    'sleep_entries',
    entries.map(e => (e.id === entry.id ? entry : e))
  );
}

// ----------------- RUNS -----------------
export async function getRuns(): Promise<Run[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('runs').select('*').order('date', { ascending: false });
      if (!error && data) {
        setLocal('runs', data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase getRuns fallback:', err);
    }
  }
  return getLocal<Run[]>('runs', []);
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

  const runs = getLocal<Run[]>('runs', []);
  const filtered = runs.filter(r => r.id !== run.id);
  setLocal('runs', [run, ...filtered]);
  return run;
}

export async function deleteRun(id: string): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('runs').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteRun fallback:', err);
    }
  }
  const runs = getLocal<Run[]>('runs', []);
  setLocal('runs', runs.filter(r => r.id !== id));
}

// ----------------- LINKEDIN PIPELINE -----------------
export async function getPipelineStages(): Promise<PipelineStage[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .order('order_index', { ascending: true });
      if (!error && data && data.length > 0) {
        setLocal('pipeline_stages', data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase getPipelineStages fallback:', err);
    }
  }
  return getLocal<PipelineStage[]>('pipeline_stages', DEFAULT_PIPELINE_STAGES);
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

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('pipeline_stages').upsert(newStage).select().single();
      if (!error && data) {
        const updated = stages.filter(s => s.id !== id).concat(data);
        setLocal('pipeline_stages', updated);
        return data;
      }
    } catch (err) {
      console.warn('Supabase savePipelineStage fallback:', err);
    }
  }

  const filtered = stages.filter(s => s.id !== id);
  const updated = [...filtered, newStage].sort((a, b) => a.order_index - b.order_index);
  setLocal('pipeline_stages', updated);
  return newStage;
}

export async function deletePipelineStage(id: string): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('pipeline_stages').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deletePipelineStage fallback:', err);
    }
  }
  const stages = getLocal<PipelineStage[]>('pipeline_stages', DEFAULT_PIPELINE_STAGES);
  setLocal('pipeline_stages', stages.filter(s => s.id !== id));
}

export async function getPipelineContacts(): Promise<PipelineContact[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('pipeline_contacts')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setLocal('pipeline_contacts', data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase getPipelineContacts fallback:', err);
    }
  }
  return getLocal<PipelineContact[]>('pipeline_contacts', []);
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

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('pipeline_contacts').upsert(newContact).select().single();
      if (!error && data) {
        const updated = contacts.filter(c => c.id !== id).concat(data);
        setLocal('pipeline_contacts', updated);
        return data;
      }
    } catch (err) {
      console.warn('Supabase savePipelineContact fallback:', err);
    }
  }

  const filtered = contacts.filter(c => c.id !== id);
  const updated = [newContact, ...filtered];
  setLocal('pipeline_contacts', updated);
  return newContact;
}

export async function deletePipelineContact(id: string): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('pipeline_contacts').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deletePipelineContact fallback:', err);
    }
  }
  const contacts = getLocal<PipelineContact[]>('pipeline_contacts', []);
  setLocal('pipeline_contacts', contacts.filter(c => c.id !== id));
}

// ----------------- TASKS (WEEKLY KANBAN) -----------------
export async function getTasks(weekStartDate?: string): Promise<Task[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase.from('tasks').select('*');
      if (weekStartDate) query = query.eq('week_start_date', weekStartDate);
      const { data, error } = await query.order('order_index', { ascending: true });
      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('Supabase getTasks fallback:', err);
    }
  }

  const allTasks = getLocal<Task[]>('tasks', []);
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

  const allTasks = getLocal<Task[]>('tasks', []);
  const filtered = allTasks.filter(t => t.id !== task.id);
  setLocal('tasks', [...filtered, task]);
  return task;
}

export async function toggleTaskDone(id: string, is_done: boolean): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('tasks').update({ is_done, updated_at: new Date().toISOString() }).eq('id', id);
    } catch (err) {
      console.warn('Supabase toggleTaskDone fallback:', err);
    }
  }
  const allTasks = getLocal<Task[]>('tasks', []);
  setLocal('tasks', allTasks.map(t => (t.id === id ? { ...t, is_done, updated_at: new Date().toISOString() } : t)));
}

export async function deleteTask(id: string): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('tasks').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteTask fallback:', err);
    }
  }
  const allTasks = getLocal<Task[]>('tasks', []);
  setLocal('tasks', allTasks.filter(t => t.id !== id));
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
  };
}