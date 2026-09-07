'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useDate } from '@/context/DateContext';
import DateSelector from '@/components/DateSelector';
import {
  getHabits,
  getHabitLogs,
  saveHabitLog,
  getSleepEntry,
  getNaps,
  getTasks,
  saveTask,
  toggleTaskDone,
  getRuns,
  getSleepSettings,
  getDailyLogs,
  saveDailyLog,
} from '@/lib/storage';
import { Habit, HabitLog, SleepEntry, NapEntry, Task, Run, SleepSettings, DailyLogEntry } from '@/types';
import {
  CheckSquare,
  Square,
  Moon,
  Activity,
  Kanban,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Plus,
  AlertCircle,
  ListPlus,
  Send,
} from 'lucide-react';
import { format, parseISO, startOfWeek } from 'date-fns';

export default function DashboardPage() {
  const { selectedDate } = useDate();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [sleepEntry, setSleepEntry] = useState<SleepEntry | null>(null);
  const [naps, setNaps] = useState<NapEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLogEntry[]>([]);
  const [settings, setSettings] = useState<SleepSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Quick task & quick log inputs on dashboard
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickLogText, setQuickLogText] = useState('');

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const center = parseISO(selectedDate + 'T12:00:00');
      const monday = format(startOfWeek(center, { weekStartsOn: 1 }), 'yyyy-MM-dd');

      const [
        fetchedHabits,
        fetchedLogs,
        fetchedSleep,
        fetchedNaps,
        fetchedTasks,
        fetchedRuns,
        fetchedSettings,
        fetchedDailyLogs,
      ] = await Promise.all([
        getHabits(),
        getHabitLogs(selectedDate, selectedDate),
        getSleepEntry(selectedDate),
        getNaps(selectedDate),
        getTasks(monday),
        getRuns(),
        getSleepSettings(),
        getDailyLogs(selectedDate),
      ]);

      setHabits(fetchedHabits.filter((h) => h.is_active));
      setHabitLogs(fetchedLogs);
      setSleepEntry(fetchedSleep);
      setNaps(fetchedNaps);
      setTasks(fetchedTasks);
      setRuns(fetchedRuns);
      setSettings(fetchedSettings);
      setDailyLogs(fetchedDailyLogs);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Habit log map
  const logMap = useMemo(() => {
    const map = new Map<string, number>();
    habitLogs.forEach((l) => map.set(l.habit_id, Number(l.value)));
    return map;
  }, [habitLogs]);

  // Habit metrics
  const habitStats = useMemo(() => {
    if (habits.length === 0) return { pct: 0, completed: 0, total: 0 };
    let score = 0;
    let completed = 0;
    habits.forEach((h) => {
      const val = logMap.get(h.id) || 0;
      if (h.type === 'boolean') {
        if (val > 0) {
          score += 1;
          completed += 1;
        }
      } else {
        const target = h.target_value || 1;
        score += Math.min(1, val / target);
        if (val >= target) completed += 1;
      }
    });
    return {
      pct: Math.round((score / habits.length) * 100),
      completed,
      total: habits.length,
    };
  }, [habits, logMap]);

  // Toggle habit on dashboard
  const handleToggleHabit = async (habitId: string) => {
    const current = logMap.get(habitId) || 0;
    const next = current > 0 ? 0 : 1;
    setHabitLogs((prev) => {
      const filtered = prev.filter((l) => l.habit_id !== habitId);
      return [...filtered, { id: crypto.randomUUID(), habit_id: habitId, date: selectedDate, value: next }];
    });
    await saveHabitLog(habitId, selectedDate, next);
  };

  // Run on selected date
  const runOnDate = useMemo(() => {
    return runs.find((r) => r.date === selectedDate) || null;
  }, [runs, selectedDate]);

  // Tasks for selected date
  const todayTasks = useMemo(() => {
    return tasks.filter((t) => t.date === selectedDate);
  }, [tasks, selectedDate]);

  const tasksCompleted = todayTasks.filter((t) => t.is_done).length;

  // Toggle task done
  const handleToggleTask = async (id: string, is_done: boolean) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, is_done } : t)));
    await toggleTaskDone(id, is_done);
  };

  // Quick add task
  const handleQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;

    const center = parseISO(selectedDate + 'T12:00:00');
    const monday = format(startOfWeek(center, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const dayName = format(center, 'EEEE') as Task['day_of_week'];

    const newTask = await saveTask({
      title: quickTaskTitle.trim(),
      day_of_week: dayName,
      week_start_date: monday,
      date: selectedDate,
      is_done: false,
    });

    setTasks((prev) => [...prev, newTask]);
    setQuickTaskTitle('');
  };

  // Quick add log to Daily Stream
  const handleQuickLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLogText.trim()) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newLog = await saveDailyLog({
      user_id: '00000000-0000-0000-0000-000000000001',
      date: selectedDate,
      time: timeStr,
      timestamp: `${selectedDate}T${timeStr}:00.000Z`,
      content: quickLogText.trim(),
      category: 'general',
    });

    setDailyLogs((prev) => [...prev, newLog]);
    setQuickLogText('');
  };

  const totalNapMins = naps.reduce((acc, n) => acc + (Number(n.duration_minutes) || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#14181B] dark:text-[#E7ECEC] flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-[#D9551F] dark:text-[#FF7A47]" />
            <span>Daily Command Center</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#6B655F] dark:text-[#98A6AD] mt-1 font-mono">
            {format(parseISO(selectedDate + 'T12:00:00'), 'EEEE, MMMM d, yyyy')} • Performance Snapshot
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/habits"
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] hover:bg-[#D6CDBC] dark:hover:bg-[#1D2830] transition-colors"
          >
            Habits
          </Link>
          <Link
            href="/logs"
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] hover:bg-[#D6CDBC] dark:hover:bg-[#1D2830] transition-colors flex items-center gap-1.5"
          >
            <ListPlus className="w-3.5 h-3.5 text-[#D9551F] dark:text-[#FF7A47]" />
            <span>Logs</span>
          </Link>
          <Link
            href="/sleep"
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] hover:bg-[#D6CDBC] dark:hover:bg-[#1D2830] transition-colors"
          >
            Sleep
          </Link>
          <Link
            href="/tasks"
            className="text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-[#D9551F]/15 dark:bg-[#FF7A47]/20 border border-[#D9551F]/30 dark:border-[#FF7A47]/40 text-[#D9551F] dark:text-[#FF7A47] font-bold hover:bg-[#D9551F]/25 dark:hover:bg-[#FF7A47]/30 transition-colors"
          >
            Kanban Board
          </Link>
        </div>
      </div>

      <DateSelector />

      {/* Quick Stream Micro-Log Bar */}
      <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-2xl p-3 shadow-sm transition-colors flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="w-8 h-8 rounded-xl bg-[#D9551F]/15 dark:bg-[#FF7A47]/20 border border-[#D9551F]/30 dark:border-[#FF7A47]/40 flex items-center justify-center flex-shrink-0">
            <ListPlus className="w-4 h-4 text-[#D9551F] dark:text-[#FF7A47]" />
          </div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] sm:hidden">
            Quick Log
          </span>
        </div>

        <form onSubmit={handleQuickLog} className="flex-1 flex items-center gap-2 w-full">
          <input
            type="text"
            value={quickLogText}
            onChange={(e) => setQuickLogText(e.target.value)}
            placeholder={`Log #${dailyLogs.length + 1}: Drop a quick moment or status (e.g., Woke up at 5:00 AM • Deep work session started • Energy peak)...`}
            className="flex-1 px-3 py-1.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-xs text-[#14181B] dark:text-[#E7ECEC] placeholder-[#6B655F]/60 focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-xl bg-[#D9551F] hover:bg-[#C24816] dark:bg-[#FF7A47] dark:hover:bg-[#FF8E61] text-white dark:text-[#0B0F14] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm flex-shrink-0"
          >
            <Send className="w-3 h-3" />
            <span>Log #{dailyLogs.length + 1}</span>
          </button>
        </form>

        <Link
          href="/logs"
          className="text-xs font-mono font-semibold text-[#D9551F] dark:text-[#FF7A47] hover:underline flex items-center gap-1 whitespace-nowrap sm:pl-3 sm:border-l sm:border-[#CFC3AB]/60 dark:sm:border-[#1D2830] self-end sm:self-center"
        >
          <span>{dailyLogs.length} logged today</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Top 4 Quick Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Habit Completion */}
        <Link
          href="/habits"
          className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] hover:border-[#D9551F] dark:hover:border-[#FF7A47] rounded-3xl p-5 shadow-sm transition-all group flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] font-mono">Habits Done</p>
            <div className="flex items-baseline gap-1 mt-1 font-mono">
              <span className="text-3xl font-extrabold text-[#14181B] dark:text-[#E7ECEC]">{habitStats.pct}%</span>
            </div>
            <p className="text-[11px] text-[#6B655F] dark:text-[#98A6AD] mt-0.5 font-mono">
              {habitStats.completed} of {habitStats.total} completed
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#D9551F]/15 dark:bg-[#FF7A47]/20 border border-[#D9551F]/30 dark:border-[#FF7A47]/40 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CheckSquare className="w-5 h-5 text-[#D9551F] dark:text-[#FF7A47]" />
          </div>
        </Link>

        {/* Sleep Quality */}
        <Link
          href="/sleep"
          className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] hover:border-[#2E9C82] dark:hover:border-[#8FE0CE] rounded-3xl p-5 shadow-sm transition-all group flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] font-mono">Night Sleep</p>
            <div className="flex items-baseline gap-1 mt-1 font-mono">
              {sleepEntry ? (
                <>
                  <span className="text-3xl font-extrabold text-[#14181B] dark:text-[#E7ECEC]">{sleepEntry.quality_score}%</span>
                  <span className="text-xs text-[#6B655F] dark:text-[#98A6AD] font-semibold">
                    ({(sleepEntry.duration_minutes / 60).toFixed(1)}h)
                  </span>
                </>
              ) : (
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-4 h-4" /> Not Logged
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#6B655F] dark:text-[#98A6AD] mt-0.5 font-mono">
              {naps.length > 0 ? `${totalNapMins}m daytime naps` : 'No naps logged'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#2E9C82]/15 dark:bg-[#8FE0CE]/20 border border-[#2E9C82]/30 dark:border-[#8FE0CE]/40 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Moon className="w-5 h-5 text-[#2E9C82] dark:text-[#8FE0CE]" />
          </div>
        </Link>

        {/* Today's Tasks */}
        <Link
          href="/tasks"
          className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] hover:border-[#D9551F] dark:hover:border-[#FF7A47] rounded-3xl p-5 shadow-sm transition-all group flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] font-mono">Kanban Tasks</p>
            <div className="flex items-baseline gap-1 mt-1 font-mono">
              <span className="text-3xl font-extrabold text-[#14181B] dark:text-[#E7ECEC]">
                {tasksCompleted}
                <span className="text-base text-[#6B655F] dark:text-[#98A6AD] font-normal"> / {todayTasks.length}</span>
              </span>
            </div>
            <p className="text-[11px] text-[#6B655F] dark:text-[#98A6AD] mt-0.5 font-mono">
              {todayTasks.length - tasksCompleted} remaining for today
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#D9551F]/15 dark:bg-[#FF7A47]/20 border border-[#D9551F]/30 dark:border-[#FF7A47]/40 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Kanban className="w-5 h-5 text-[#D9551F] dark:text-[#FF7A47]" />
          </div>
        </Link>

        {/* Running Activity */}
        <Link
          href="/running"
          className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] hover:border-[#2E9C82] dark:hover:border-[#8FE0CE] rounded-3xl p-5 shadow-sm transition-all group flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] font-mono">Running Log</p>
            <div className="flex items-baseline gap-1 mt-1 font-mono">
              {runOnDate ? (
                <>
                  <span className="text-3xl font-extrabold text-[#14181B] dark:text-[#E7ECEC]">{runOnDate.distance_km}</span>
                  <span className="text-xs text-[#6B655F] dark:text-[#98A6AD] font-semibold">km ({runOnDate.pace}/km)</span>
                </>
              ) : (
                <span className="text-sm font-bold text-[#6B655F] dark:text-[#98A6AD] mt-1">No run logged</span>
              )}
            </div>
            <p className="text-[11px] text-[#6B655F] dark:text-[#98A6AD] mt-0.5 font-mono">
              {runOnDate ? `${runOnDate.duration_minutes}m active` : 'Rest or unrecorded'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#2E9C82]/15 dark:bg-[#8FE0CE]/20 border border-[#2E9C82]/30 dark:border-[#8FE0CE]/40 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Activity className="w-5 h-5 text-[#2E9C82] dark:text-[#8FE0CE]" />
          </div>
        </Link>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Habit Checklist Widget */}
        <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#CFC3AB] dark:border-[#1D2830] mb-3">
              <h2 className="text-base font-display font-bold text-[#14181B] dark:text-[#E7ECEC] flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-[#D9551F] dark:text-[#FF7A47]" />
                <span>Today's Habits</span>
              </h2>
              <Link
                href="/habits"
                className="text-xs font-semibold text-[#D9551F] dark:text-[#FF7A47] hover:underline flex items-center gap-1 font-mono"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {habits.map((habit) => {
                const val = logMap.get(habit.id) || 0;
                const isComplete = habit.type === 'boolean' ? val > 0 : val >= (habit.target_value || 1);

                return (
                  <div
                    key={habit.id}
                    onClick={() => handleToggleHabit(habit.id)}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                      isComplete
                        ? 'bg-[#2E9C82]/10 dark:bg-[#8FE0CE]/10 border-[#2E9C82]/30 dark:border-[#8FE0CE]/30 text-[#14181B] dark:text-[#E7ECEC]'
                        : 'bg-[#EBE3D3] dark:bg-[#0B0F14] border-[#CFC3AB] dark:border-[#1D2830] hover:border-[#B5A88F] text-[#4A4540] dark:text-[#C2C9CA]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors ${
                          isComplete
                            ? 'bg-[#2E9C82] dark:bg-[#8FE0CE] text-white dark:text-[#0B0F14]'
                            : 'bg-[#DDD5C3] dark:bg-[#17222C] text-[#6B655F] dark:text-[#98A6AD]'
                        }`}
                      >
                        {isComplete ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs font-semibold">{habit.name}</span>
                    </div>

                    <div className="text-[11px] font-mono font-semibold text-[#6B655F] dark:text-[#98A6AD]">
                      {habit.type === 'counter' ? `${val} / ${habit.target_value}` : isComplete ? 'Completed' : 'Pending'}
                    </div>
                  </div>
                );
              })}

              {habits.length === 0 && (
                <div className="py-8 text-center text-[#6B655F] dark:text-[#98A6AD] text-xs font-mono">
                  No habits defined. Load sample data in Settings to preview!
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#CFC3AB] dark:border-[#1D2830] flex items-center justify-between text-xs text-[#6B655F] dark:text-[#98A6AD] font-mono">
            <span>Live completion: <strong className="text-[#D9551F] dark:text-[#FF7A47]">{habitStats.pct}%</strong></span>
            <Link href="/habits" className="hover:text-[#14181B] dark:hover:text-[#E7ECEC] transition-colors">
              Manage habits →
            </Link>
          </div>
        </div>

        {/* Today's Tasks Widget */}
        <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#CFC3AB] dark:border-[#1D2830] mb-3">
              <h2 className="text-base font-display font-bold text-[#14181B] dark:text-[#E7ECEC] flex items-center gap-2">
                <Kanban className="w-5 h-5 text-[#2E9C82] dark:text-[#8FE0CE]" />
                <span>Today's Kanban Tasks</span>
              </h2>
              <Link
                href="/tasks"
                className="text-xs font-semibold text-[#2E9C82] dark:text-[#8FE0CE] hover:underline flex items-center gap-1 font-mono"
              >
                <span>7-Day Board</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Quick Add Task */}
            <form onSubmit={handleQuickAddTask} className="flex gap-2 mb-3">
              <input
                type="text"
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                placeholder="Quick add task for today..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] text-xs placeholder-[#6B655F]/60 focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-[#D9551F] hover:bg-[#C24816] dark:bg-[#FF7A47] dark:hover:bg-[#FF8E61] text-white dark:text-[#0B0F14] font-bold text-xs flex items-center gap-1 cursor-pointer shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {todayTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id, !task.is_done)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    task.is_done
                      ? 'bg-[#EBE3D3]/50 dark:bg-[#0B0F14]/40 border-[#CFC3AB]/50 dark:border-[#1D2830]/50 text-[#6B655F] dark:text-[#98A6AD]'
                      : 'bg-[#EBE3D3] dark:bg-[#0B0F14] border-[#CFC3AB] dark:border-[#1D2830] hover:border-[#B5A88F] text-[#14181B] dark:text-[#E7ECEC]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className={`w-4 h-4 rounded transition-colors ${
                        task.is_done ? 'text-[#2E9C82] dark:text-[#8FE0CE]' : 'text-[#6B655F] dark:text-[#98A6AD]'
                      }`}
                    >
                      {task.is_done ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>
                    <span className={`text-xs font-semibold ${task.is_done ? 'line-through opacity-70' : ''}`}>
                      {task.title}
                    </span>
                  </div>

                  {task.priority && (
                    <span className="text-[10px] uppercase font-bold font-mono text-[#6B655F] dark:text-[#98A6AD] px-2 py-0.5 rounded bg-[#DDD5C3] dark:bg-[#17222C] border border-[#CFC3AB] dark:border-[#1D2830]">
                      {task.priority}
                    </span>
                  )}
                </div>
              ))}

              {todayTasks.length === 0 && (
                <div className="py-8 text-center text-[#6B655F] dark:text-[#98A6AD] text-xs font-mono">
                  No tasks scheduled for today. Add one above!
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#CFC3AB] dark:border-[#1D2830] flex items-center justify-between text-xs text-[#6B655F] dark:text-[#98A6AD] font-mono">
            <span>
              Remaining today: <strong className="text-[#14181B] dark:text-[#E7ECEC]">{todayTasks.length - tasksCompleted}</strong>
            </span>
            <Link href="/tasks" className="hover:text-[#14181B] dark:hover:text-[#E7ECEC] transition-colors">
              Weekly view →
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom 2 Widgets: Sleep Summary & Running Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sleep Snapshot */}
        <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-6 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-[#CFC3AB] dark:border-[#1D2830]">
            <h2 className="text-base font-display font-bold text-[#14181B] dark:text-[#E7ECEC] flex items-center gap-2">
              <Moon className="w-5 h-5 text-[#2E9C82] dark:text-[#8FE0CE]" />
              <span>Night Sleep & Recovery</span>
            </h2>
            <Link
              href="/sleep"
              className="text-xs font-semibold text-[#2E9C82] dark:text-[#8FE0CE] hover:underline flex items-center gap-1 font-mono"
            >
              <span>Sleep Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {sleepEntry ? (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830]">
              <div>
                <div className="flex items-baseline gap-2 font-mono">
                  <span className="text-3xl font-bold text-[#14181B] dark:text-[#E7ECEC]">
                    {(sleepEntry.duration_minutes / 60).toFixed(1)} hrs
                  </span>
                  <span className="text-sm font-semibold text-[#2E9C82] dark:text-[#8FE0CE]">
                    {sleepEntry.quality_score}% Quality
                  </span>
                </div>
                <p className="text-xs text-[#6B655F] dark:text-[#98A6AD] mt-1 font-mono">
                  Slept: {format(new Date(sleepEntry.sleep_time), 'hh:mm a')} • Woke:{' '}
                  {format(new Date(sleepEntry.wake_time), 'hh:mm a')}
                </p>
                {totalNapMins > 0 && (
                  <p className="text-xs text-[#D9551F] dark:text-[#FF7A47] mt-0.5 font-mono">
                    Daytime naps: {totalNapMins} mins logged
                  </p>
                )}
              </div>
              <Link
                href="/sleep"
                className="px-3.5 py-1.5 rounded-xl bg-[#DDD5C3] dark:bg-[#17222C] hover:bg-[#D6CDBC] dark:hover:bg-[#1E2B37] text-xs font-semibold text-[#14181B] dark:text-[#E7ECEC] border border-[#CFC3AB] dark:border-[#1D2830]"
              >
                Edit
              </Link>
            </div>
          ) : (
            <div className="py-6 text-center space-y-2 font-mono">
              <p className="text-xs text-[#6B655F] dark:text-[#98A6AD]">Last night's sleep has not been recorded yet.</p>
              <Link
                href="/sleep"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2E9C82]/15 hover:bg-[#2E9C82]/25 text-[#2E9C82] dark:text-[#8FE0CE] border border-[#2E9C82]/30 dark:border-[#8FE0CE]/30 text-xs font-semibold"
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Log Sleep Now</span>
              </Link>
            </div>
          )}
        </div>

        {/* Running Snapshot */}
        <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-6 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-[#CFC3AB] dark:border-[#1D2830]">
            <h2 className="text-base font-display font-bold text-[#14181B] dark:text-[#E7ECEC] flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#D9551F] dark:text-[#FF7A47]" />
              <span>Running Session</span>
            </h2>
            <Link
              href="/running"
              className="text-xs font-semibold text-[#D9551F] dark:text-[#FF7A47] hover:underline flex items-center gap-1 font-mono"
            >
              <span>Running Log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {runOnDate ? (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830]">
              <div>
                <div className="flex items-baseline gap-2 font-mono">
                  <span className="text-3xl font-bold text-[#14181B] dark:text-[#E7ECEC]">{runOnDate.distance_km} km</span>
                  <span className="text-sm font-semibold text-[#D9551F] dark:text-[#FF7A47]">{runOnDate.pace}/km</span>
                </div>
                <p className="text-xs text-[#6B655F] dark:text-[#98A6AD] mt-1 font-mono">
                  Active time: {runOnDate.duration_minutes} minutes
                  {runOnDate.notes ? ` • "${runOnDate.notes}"` : ''}
                </p>
              </div>
              <Link
                href="/running"
                className="px-3.5 py-1.5 rounded-xl bg-[#DDD5C3] dark:bg-[#17222C] hover:bg-[#D6CDBC] dark:hover:bg-[#1E2B37] text-xs font-semibold text-[#14181B] dark:text-[#E7ECEC] border border-[#CFC3AB] dark:border-[#1D2830]"
              >
                Details
              </Link>
            </div>
          ) : (
            <div className="py-6 text-center space-y-2 font-mono">
              <p className="text-xs text-[#6B655F] dark:text-[#98A6AD]">No run logged for this date.</p>
              <Link
                href="/running"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D9551F]/15 hover:bg-[#D9551F]/25 text-[#D9551F] dark:text-[#FF7A47] border border-[#D9551F]/30 dark:border-[#FF7A47]/30 text-xs font-semibold"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Record Run</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
