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
} from '@/lib/storage';
import { Habit, HabitLog, SleepEntry, NapEntry, Task, Run, SleepSettings } from '@/types';
import { DAYS_OF_WEEK } from '@/lib/constants';
import {
  CheckSquare,
  Square,
  Moon,
  Activity,
  Kanban,
  ArrowRight,
  Sparkles,
  Percent,
  Flame,
  Coffee,
  CheckCircle2,
  Clock,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { format, parseISO, startOfWeek } from 'date-fns';

export default function DashboardPage() {
  const { selectedDate, setSelectedDate } = useDate();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [sleepEntry, setSleepEntry] = useState<SleepEntry | null>(null);
  const [naps, setNaps] = useState<NapEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [settings, setSettings] = useState<SleepSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Quick task input on dashboard
  const [quickTaskTitle, setQuickTaskTitle] = useState('');

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
      ] = await Promise.all([
        getHabits(),
        getHabitLogs(selectedDate, selectedDate),
        getSleepEntry(selectedDate),
        getNaps(selectedDate),
        getTasks(monday),
        getRuns(),
        getSleepSettings(),
      ]);

      setHabits(fetchedHabits.filter((h) => h.is_active));
      setHabitLogs(fetchedLogs);
      setSleepEntry(fetchedSleep);
      setNaps(fetchedNaps);
      setTasks(fetchedTasks);
      setRuns(fetchedRuns);
      setSettings(fetchedSettings);
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

  // Tasks for selected date (concrete date match)
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

  const totalNapMins = naps.reduce((acc, n) => acc + (Number(n.duration_minutes) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-cyan-400" />
            <span>Daily Command Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            At-a-glance performance snapshot for {format(parseISO(selectedDate + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/habits"
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          >
            Habits View
          </Link>
          <Link
            href="/sleep"
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          >
            Sleep View
          </Link>
          <Link
            href="/tasks"
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25"
          >
            Kanban Board
          </Link>
        </div>
      </div>

      <DateSelector />

      {/* Top 4 Quick Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Habit Completion */}
        <Link
          href="/habits"
          className="bg-[#0d131f]/80 border border-slate-800/80 hover:border-cyan-500/40 rounded-3xl p-5 shadow-xl transition-all group flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Habits Done</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-extrabold text-white">{habitStats.pct}%</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {habitStats.completed} of {habitStats.total} completed
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CheckSquare className="w-5 h-5 text-cyan-400" />
          </div>
        </Link>

        {/* Sleep Quality */}
        <Link
          href="/sleep"
          className="bg-[#0d131f]/80 border border-slate-800/80 hover:border-indigo-500/40 rounded-3xl p-5 shadow-xl transition-all group flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Night Sleep</p>
            <div className="flex items-baseline gap-1 mt-1">
              {sleepEntry ? (
                <>
                  <span className="text-3xl font-extrabold text-white">{sleepEntry.quality_score}%</span>
                  <span className="text-xs text-slate-500 font-semibold">
                    ({(sleepEntry.duration_minutes / 60).toFixed(1)}h)
                  </span>
                </>
              ) : (
                <span className="text-base font-bold text-amber-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-4 h-4" /> Not Logged
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {naps.length > 0 ? `${totalNapMins}m total daytime naps` : 'No naps logged'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Moon className="w-5 h-5 text-indigo-400" />
          </div>
        </Link>

        {/* Today's Tasks */}
        <Link
          href="/tasks"
          className="bg-[#0d131f]/80 border border-slate-800/80 hover:border-cyan-500/40 rounded-3xl p-5 shadow-xl transition-all group flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Kanban Tasks</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-extrabold text-white">
                {tasksCompleted}
                <span className="text-base text-slate-500 font-normal"> / {todayTasks.length}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {todayTasks.length - tasksCompleted} remaining for today
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Kanban className="w-5 h-5 text-cyan-400" />
          </div>
        </Link>

        {/* Running Activity */}
        <Link
          href="/running"
          className="bg-[#0d131f]/80 border border-slate-800/80 hover:border-emerald-500/40 rounded-3xl p-5 shadow-xl transition-all group flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Running Log</p>
            <div className="flex items-baseline gap-1 mt-1">
              {runOnDate ? (
                <>
                  <span className="text-3xl font-extrabold text-white">{runOnDate.distance_km}</span>
                  <span className="text-xs text-slate-500 font-semibold">km ({runOnDate.pace}/km)</span>
                </>
              ) : (
                <span className="text-base font-bold text-slate-500 mt-1">No run logged</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {runOnDate ? `${runOnDate.duration_minutes} minutes active` : 'Rest or unrecorded'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
        </Link>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Habit Checklist Widget */}
        <div className="bg-[#0d131f]/80 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-cyan-400" />
                <span>Today's Habits</span>
              </h2>
              <Link
                href="/habits"
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>View All Views</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2 max-h-[340px] overflow-y-auto">
              {habits.map((habit) => {
                const val = logMap.get(habit.id) || 0;
                const isComplete = habit.type === 'boolean' ? val > 0 : val >= (habit.target_value || 1);

                return (
                  <div
                    key={habit.id}
                    onClick={() => handleToggleHabit(habit.id)}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                      isComplete
                        ? 'bg-cyan-950/20 border-cyan-800/40 text-cyan-200'
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors ${
                          isComplete ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isComplete ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs font-semibold">{habit.name}</span>
                    </div>

                    <div className="text-[11px] font-semibold text-slate-400">
                      {habit.type === 'counter' ? `${val} / ${habit.target_value}` : isComplete ? 'Done' : 'Pending'}
                    </div>
                  </div>
                );
              })}

              {habits.length === 0 && (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No habits defined yet.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span>Live completion: <strong className="text-cyan-400">{habitStats.pct}%</strong></span>
            <Link href="/habits" className="hover:text-white transition-colors">
              Manage habits →
            </Link>
          </div>
        </div>

        {/* Today's Tasks Widget */}
        <div className="bg-[#0d131f]/80 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Kanban className="w-5 h-5 text-cyan-400" />
                <span>Today's Kanban Tasks</span>
              </h2>
              <Link
                href="/tasks"
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>Full 7-Day Board</span>
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
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer shadow-md shadow-cyan-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            <div className="space-y-2 max-h-[280px] overflow-y-auto">
              {todayTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id, !task.is_done)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    task.is_done
                      ? 'bg-slate-900/30 border-slate-800/40 text-slate-500'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className={`w-4 h-4 rounded transition-colors ${
                        task.is_done ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {task.is_done ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>
                    <span className={`text-xs font-semibold ${task.is_done ? 'line-through' : ''}`}>
                      {task.title}
                    </span>
                  </div>

                  {task.priority && (
                    <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
                      {task.priority}
                    </span>
                  )}
                </div>
              ))}

              {todayTasks.length === 0 && (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No tasks scheduled for today. Add one above!
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span>
              Remaining today: <strong className="text-white">{todayTasks.length - tasksCompleted}</strong>
            </span>
            <Link href="/tasks" className="hover:text-white transition-colors">
              Weekly view →
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom 2 Widgets: Sleep Summary & Running Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sleep Snapshot */}
        <div className="bg-[#0d131f]/80 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Moon className="w-5 h-5 text-indigo-400" />
              <span>Night Sleep & Recovery</span>
            </h2>
            <Link
              href="/sleep"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>Sleep Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {sleepEntry ? (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">
                    {(sleepEntry.duration_minutes / 60).toFixed(1)} hrs
                  </span>
                  <span className="text-sm font-semibold text-cyan-400">
                    {sleepEntry.quality_score}% Quality
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Slept: {format(new Date(sleepEntry.sleep_time), 'hh:mm a')} → Woke:{' '}
                  {format(new Date(sleepEntry.wake_time), 'hh:mm a')}
                </p>
                {totalNapMins > 0 && (
                  <p className="text-xs text-amber-400 mt-0.5">
                    Daytime naps: {totalNapMins} mins logged
                  </p>
                )}
              </div>
              <Link
                href="/sleep"
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
              >
                Edit
              </Link>
            </div>
          ) : (
            <div className="py-6 text-center space-y-2">
              <p className="text-xs text-slate-400">Last night's sleep has not been recorded yet.</p>
              <Link
                href="/sleep"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold"
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Log Sleep Now</span>
              </Link>
            </div>
          )}
        </div>

        {/* Running Snapshot */}
        <div className="bg-[#0d131f]/80 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span>Running Session</span>
            </h2>
            <Link
              href="/running"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>Running Log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {runOnDate ? (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">{runOnDate.distance_km} km</span>
                  <span className="text-sm font-semibold text-emerald-400">
                    Pace: {runOnDate.pace}/km
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Duration: {runOnDate.duration_minutes} minutes</p>
                {runOnDate.notes && (
                  <p className="text-xs text-slate-500 italic mt-0.5 line-clamp-1">"{runOnDate.notes}"</p>
                )}
              </div>
              <Link
                href="/running"
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
              >
                Edit
              </Link>
            </div>
          ) : (
            <div className="py-6 text-center space-y-2">
              <p className="text-xs text-slate-400">No run logged for this date.</p>
              <Link
                href="/running"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Log Run Session</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}