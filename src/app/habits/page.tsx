'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDate } from '@/context/DateContext';
import DateSelector from '@/components/DateSelector';
import {
  getHabits,
  getHabitLogs,
  saveHabitLog,
  saveHabit,
  archiveHabit,
  deleteHabit,
} from '@/lib/storage';
import { Habit, HabitLog, HabitType } from '@/types';
import {
  CheckSquare,
  Square,
  Plus,
  Minus,
  Archive,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  BarChart2,
  CheckCircle2,
  Percent,
  Sparkles,
  X,
} from 'lucide-react';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  parseISO,
  subDays,
  addDays,
} from 'date-fns';

export default function HabitsPage() {
  const { selectedDate, setSelectedDate } = useDate();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitName, setHabitName] = useState('');
  const [habitType, setHabitType] = useState<HabitType>('boolean');
  const [targetValue, setTargetValue] = useState(5);
  const [showArchived, setShowArchived] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedHabits = await getHabits();
      setHabits(fetchedHabits);

      // Fetch logs for current range (past 60 days to next 10 days)
      const center = parseISO(selectedDate + 'T12:00:00');
      const start = format(subDays(center, 40), 'yyyy-MM-dd');
      const end = format(addDays(center, 10), 'yyyy-MM-dd');
      const fetchedLogs = await getHabitLogs(start, end);
      setLogs(fetchedLogs);
    } catch (err) {
      console.error('Error loading habits:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Active habits list
  const activeHabits = useMemo(() => {
    return habits.filter((h) => (showArchived ? true : h.is_active));
  }, [habits, showArchived]);

  // Quick map of logs: habitId_date -> value
  const logMap = useMemo(() => {
    const map = new Map<string, number>();
    logs.forEach((l) => {
      map.set(`${l.habit_id}_${l.date}`, Number(l.value));
    });
    return map;
  }, [logs]);

  // Handle toggling or updating habit
  const handleToggleBoolean = async (habitId: string) => {
    const key = `${habitId}_${selectedDate}`;
    const currentValue = logMap.get(key) || 0;
    const newValue = currentValue > 0 ? 0 : 1;

    // Optimistic UI update
    setLogs((prev) => {
      const filtered = prev.filter((l) => !(l.habit_id === habitId && l.date === selectedDate));
      return [...filtered, { id: crypto.randomUUID(), habit_id: habitId, date: selectedDate, value: newValue }];
    });

    await saveHabitLog(habitId, selectedDate, newValue);
  };

  const handleUpdateCounter = async (habitId: string, delta: number) => {
    const key = `${habitId}_${selectedDate}`;
    const currentValue = logMap.get(key) || 0;
    const newValue = Math.max(0, currentValue + delta);

    // Optimistic UI update
    setLogs((prev) => {
      const filtered = prev.filter((l) => !(l.habit_id === habitId && l.date === selectedDate));
      return [...filtered, { id: crypto.randomUUID(), habit_id: habitId, date: selectedDate, value: newValue }];
    });

    await saveHabitLog(habitId, selectedDate, newValue);
  };

  // Save new or edited habit
  const handleSaveHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;

    if (editingHabit) {
      await saveHabit({
        ...editingHabit,
        name: habitName.trim(),
        type: habitType,
        target_value: habitType === 'counter' ? targetValue : 1,
      });
    } else {
      await saveHabit({
        name: habitName.trim(),
        type: habitType,
        target_value: habitType === 'counter' ? targetValue : 1,
      });
    }

    setShowAddModal(false);
    setEditingHabit(null);
    setHabitName('');
    setHabitType('boolean');
    setTargetValue(5);
    loadData();
  };

  const handleOpenEdit = (h: Habit) => {
    setEditingHabit(h);
    setHabitName(h.name);
    setHabitType(h.type);
    setTargetValue(h.target_value || 5);
    setShowAddModal(true);
  };

  const handleArchive = async (id: string, currentStatus: boolean) => {
    await archiveHabit(id, !currentStatus);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this habit and all its history? (Or use Archive to preserve history)')) {
      await deleteHabit(id);
      loadData();
    }
  };

  // Calculation for Daily View
  const dailyMetrics = useMemo(() => {
    if (activeHabits.length === 0) return { completedCount: 0, total: 0, percentage: 0 };
    let totalScore = 0;
    let completedCount = 0;

    activeHabits.forEach((h) => {
      const val = logMap.get(`${h.id}_${selectedDate}`) || 0;
      if (h.type === 'boolean') {
        if (val > 0) {
          totalScore += 1;
          completedCount += 1;
        }
      } else {
        const target = h.target_value || 1;
        const ratio = Math.min(1, val / target);
        totalScore += ratio;
        if (val >= target) completedCount += 1;
      }
    });

    const percentage = Math.round((totalScore / activeHabits.length) * 100);
    return { completedCount, total: activeHabits.length, percentage };
  }, [activeHabits, logMap, selectedDate]);

  // Days for Weekly View (Monday - Sunday)
  const weekDays = useMemo(() => {
    const center = parseISO(selectedDate + 'T12:00:00');
    const start = startOfWeek(center, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(center, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  // Days for Monthly View
  const monthDays = useMemo(() => {
    const center = parseISO(selectedDate + 'T12:00:00');
    const start = startOfMonth(center);
    const end = endOfMonth(center);
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  // Weekly Completion Statistics
  const weeklyStats = useMemo(() => {
    const habitStats = activeHabits.map((h) => {
      let sumRatio = 0;
      weekDays.forEach((d) => {
        const dateKey = format(d, 'yyyy-MM-dd');
        const val = logMap.get(`${h.id}_${dateKey}`) || 0;
        const target = h.type === 'counter' ? (h.target_value || 1) : 1;
        sumRatio += Math.min(1, val / target);
      });
      const pct = Math.round((sumRatio / weekDays.length) * 100);
      return { habit: h, pct };
    });

    const overall =
      activeHabits.length > 0
        ? Math.round(habitStats.reduce((acc, curr) => acc + curr.pct, 0) / activeHabits.length)
        : 0;

    return { habitStats, overall };
  }, [activeHabits, weekDays, logMap]);

  // Monthly Completion Statistics
  const monthlyStats = useMemo(() => {
    const habitStats = activeHabits.map((h) => {
      let sumRatio = 0;
      monthDays.forEach((d) => {
        const dateKey = format(d, 'yyyy-MM-dd');
        const val = logMap.get(`${h.id}_${dateKey}`) || 0;
        const target = h.type === 'counter' ? (h.target_value || 1) : 1;
        sumRatio += Math.min(1, val / target);
      });
      const pct = Math.round((sumRatio / monthDays.length) * 100);
      return { habit: h, pct };
    });

    const overall =
      activeHabits.length > 0
        ? Math.round(habitStats.reduce((acc, curr) => acc + curr.pct, 0) / activeHabits.length)
        : 0;

    return { habitStats, overall };
  }, [activeHabits, monthDays, logMap]);

  return (
    <div className="space-y-6">
      {/* Top Banner with DateSelector & View Toggles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-cyan-400" />
            <span>Habit Tracker</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Daily routines, prayer tracker, and outreach execution. Backdatable anytime.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setViewMode('daily')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'daily'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Daily View
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'weekly'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Weekly Grid
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'monthly'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Monthly Heatmap
          </button>
        </div>
      </div>

      <DateSelector />

      {/* Metric Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0d131f]/80 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">
              {viewMode === 'daily' ? 'Daily Completion' : viewMode === 'weekly' ? 'Weekly Average' : 'Monthly Average'}
            </p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {viewMode === 'daily'
                ? `${dailyMetrics.percentage}%`
                : viewMode === 'weekly'
                ? `${weeklyStats.overall}%`
                : `${monthlyStats.overall}%`}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Percent className="w-5 h-5 text-cyan-400" />
          </div>
        </div>

        <div className="bg-[#0d131f]/80 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Habits Completed Today</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {dailyMetrics.completedCount}{' '}
              <span className="text-sm font-normal text-slate-500">/ {dailyMetrics.total}</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="bg-[#0d131f]/80 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Manage Habits</p>
            <button
              onClick={() => {
                setEditingHabit(null);
                setHabitName('');
                setHabitType('boolean');
                setTargetValue(5);
                setShowAddModal(true);
              }}
              className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Habit</span>
            </button>
          </div>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
              showArchived
                ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                : 'bg-slate-800/40 text-slate-400 border-slate-700/40 hover:text-slate-200'
            }`}
          >
            {showArchived ? 'Hide Archived' : 'Show Archived'}
          </button>
        </div>
      </div>

      {/* VIEW 1: DAILY CHECKLIST */}
      {viewMode === 'daily' && (
        <div className="bg-[#0d131f]/80 border border-slate-800/80 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Routines for {format(parseISO(selectedDate + 'T12:00:00'), 'EEEE, MMM d')}</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">Click to toggle or update counter</span>
          </div>

          <div className="space-y-2">
            {activeHabits.map((habit) => {
              const currentVal = logMap.get(`${habit.id}_${selectedDate}`) || 0;
              const isBoolean = habit.type === 'boolean';
              const isComplete = isBoolean ? currentVal > 0 : currentVal >= (habit.target_value || 1);

              return (
                <div
                  key={habit.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    isComplete
                      ? 'bg-cyan-950/20 border-cyan-800/40'
                      : 'bg-slate-900/40 border-slate-800/60 hover:border-slate-700/60'
                  } ${!habit.is_active ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {isBoolean ? (
                      <button
                        onClick={() => handleToggleBoolean(habit.id)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          isComplete
                            ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-500'
                        }`}
                      >
                        {isComplete ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>
                    ) : (
                      <div className="w-6 h-6 rounded-lg bg-indigo-950/60 border border-indigo-700/50 flex items-center justify-center text-xs font-bold text-indigo-400">
                        #
                      </div>
                    )}

                    <div>
                      <p className={`text-sm font-semibold ${isComplete ? 'text-cyan-200' : 'text-slate-200'}`}>
                        {habit.name}
                        {!habit.is_active && (
                          <span className="ml-2 text-[10px] text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">
                            Archived
                          </span>
                        )}
                      </p>
                      {habit.type === 'counter' && (
                        <p className="text-xs text-slate-400">
                          Target: <span className="font-semibold text-slate-300">{habit.target_value}</span> · Logged:{' '}
                          <span className={isComplete ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>
                            {currentVal}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Counter controls or Edit menu */}
                  <div className="flex items-center gap-2">
                    {habit.type === 'counter' && (
                      <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/50">
                        <button
                          onClick={() => handleUpdateCounter(habit.id, -1)}
                          disabled={currentVal <= 0}
                          className="w-7 h-7 rounded-lg bg-slate-700/60 hover:bg-slate-600/80 disabled:opacity-30 text-white flex items-center justify-center cursor-pointer transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center font-bold text-sm text-white">{currentVal}</span>
                        <button
                          onClick={() => handleUpdateCounter(habit.id, 1)}
                          className="w-7 h-7 rounded-lg bg-cyan-600/60 hover:bg-cyan-500/80 text-white flex items-center justify-center cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Manage actions */}
                    <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
                      <button
                        onClick={() => handleOpenEdit(habit)}
                        title="Edit habit"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleArchive(habit.id, habit.is_active)}
                        title={habit.is_active ? 'Archive habit' : 'Unarchive habit'}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-950/20 transition-colors cursor-pointer"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(habit.id)}
                        title="Delete habit"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {activeHabits.length === 0 && (
              <div className="py-12 text-center text-slate-500 text-sm">
                No habits defined. Click "Add New Habit" to create one.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: WEEKLY GRID */}
      {viewMode === 'weekly' && (
        <div className="bg-[#0d131f]/80 border border-slate-800/80 rounded-3xl p-5 shadow-xl overflow-x-auto">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>
                Weekly Overview: {format(weekDays[0], 'MMM d')} – {format(weekDays[6], 'MMM d, yyyy')}
              </span>
            </h2>
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
              <span>Overall Week: {weeklyStats.overall}%</span>
            </div>
          </div>

          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-800/80 text-xs font-semibold text-slate-400">
                <th className="py-2.5 px-3">Habit</th>
                {weekDays.map((d) => {
                  const isSel = format(d, 'yyyy-MM-dd') === selectedDate;
                  return (
                    <th
                      key={d.toISOString()}
                      onClick={() => setSelectedDate(format(d, 'yyyy-MM-dd'))}
                      className={`py-2.5 px-2 text-center cursor-pointer transition-colors ${
                        isSel ? 'text-cyan-400 bg-cyan-950/20 rounded-t-xl font-bold' : 'hover:text-slate-200'
                      }`}
                    >
                      <div>{format(d, 'EEE')}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{format(d, 'M/d')}</div>
                    </th>
                  );
                })}
                <th className="py-2.5 px-3 text-right">Completion %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {weeklyStats.habitStats.map(({ habit, pct }) => {
                return (
                  <tr key={habit.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-3 font-semibold text-sm text-slate-200">{habit.name}</td>
                    {weekDays.map((d) => {
                      const dateStr = format(d, 'yyyy-MM-dd');
                      const val = logMap.get(`${habit.id}_${dateStr}`) || 0;
                      const target = habit.type === 'counter' ? (habit.target_value || 1) : 1;
                      const isComplete = val >= target;
                      const isPartial = val > 0 && val < target;

                      return (
                        <td key={dateStr} className="py-2.5 px-2 text-center">
                          <button
                            onClick={() => {
                              setSelectedDate(dateStr);
                              if (habit.type === 'boolean') {
                                handleToggleBoolean(habit.id);
                              } else {
                                handleUpdateCounter(habit.id, 1);
                              }
                            }}
                            title={`${habit.name} on ${dateStr}: ${val}/${target}`}
                            className={`w-8 h-8 mx-auto rounded-xl flex items-center justify-center text-xs font-bold transition-transform hover:scale-110 cursor-pointer ${
                              isComplete
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                                : isPartial
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : 'bg-slate-800/40 text-slate-600 border border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {habit.type === 'boolean' ? (isComplete ? '✓' : '–') : val}
                          </button>
                        </td>
                      );
                    })}
                    <td className="py-3 px-3 text-right font-bold text-sm">
                      <span
                        className={
                          pct >= 80 ? 'text-cyan-400' : pct >= 50 ? 'text-amber-400' : 'text-slate-500'
                        }
                      >
                        {pct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 3: MONTHLY HEATMAP */}
      {viewMode === 'monthly' && (
        <div className="bg-[#0d131f]/80 border border-slate-800/80 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              <span>Monthly Heatmap ({format(parseISO(selectedDate + 'T12:00:00'), 'MMMM yyyy')})</span>
            </h2>
            <span className="text-xs font-semibold text-cyan-400">Total Monthly: {monthlyStats.overall}%</span>
          </div>

          <div className="space-y-4">
            {monthlyStats.habitStats.map(({ habit, pct }) => (
              <div key={habit.id} className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{habit.name}</span>
                  <span className="font-bold text-cyan-400">{pct}%</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {monthDays.map((d) => {
                    const dateStr = format(d, 'yyyy-MM-dd');
                    const val = logMap.get(`${habit.id}_${dateStr}`) || 0;
                    const target = habit.type === 'counter' ? (habit.target_value || 1) : 1;
                    const ratio = Math.min(1, val / target);

                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDate(dateStr)}
                        title={`${format(d, 'MMM d')}: ${val}/${target}`}
                        className={`w-5 h-5 rounded-md transition-all cursor-pointer ${
                          ratio >= 1
                            ? 'bg-cyan-400 shadow-sm shadow-cyan-400/40'
                            : ratio > 0
                            ? 'bg-cyan-700/60'
                            : 'bg-slate-800/60 hover:bg-slate-700/80'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0d131f] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <span>{editingHabit ? 'Edit Habit' : 'New Habit'}</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHabit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Habit Name
                </label>
                <input
                  type="text"
                  required
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  placeholder="e.g. Fajr Prayer or Read 10 pages"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Habit Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHabitType('boolean')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      habitType === 'boolean'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    Checkbox (Done/Not Done)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHabitType('counter')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      habitType === 'counter'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    Counter (Numeric Target)
                  </button>
                </div>
              </div>

              {habitType === 'counter' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Target Value (e.g. 5 comments)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={targetValue}
                    onChange={(e) => setTargetValue(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  {editingHabit ? 'Save Changes' : 'Create Habit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}