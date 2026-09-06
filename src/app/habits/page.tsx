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

  // Toggle boolean habit
  const handleToggleBoolean = async (habitId: string) => {
    const currentVal = logMap.get(`${habitId}_${selectedDate}`) || 0;
    const nextVal = currentVal > 0 ? 0 : 1;

    setLogs((prev) => {
      const filtered = prev.filter((l) => !(l.habit_id === habitId && l.date === selectedDate));
      return [...filtered, { id: crypto.randomUUID(), habit_id: habitId, date: selectedDate, value: nextVal }];
    });

    await saveHabitLog(habitId, selectedDate, nextVal);
  };

  // Update counter habit
  const handleUpdateCounter = async (habitId: string, delta: number) => {
    const currentVal = logMap.get(`${habitId}_${selectedDate}`) || 0;
    const nextVal = Math.max(0, currentVal + delta);

    setLogs((prev) => {
      const filtered = prev.filter((l) => !(l.habit_id === habitId && l.date === selectedDate));
      return [...filtered, { id: crypto.randomUUID(), habit_id: habitId, date: selectedDate, value: nextVal }];
    });

    await saveHabitLog(habitId, selectedDate, nextVal);
  };

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingHabit(null);
    setHabitName('');
    setHabitType('boolean');
    setTargetValue(5);
    setShowAddModal(true);
  };

  // Open modal for edit
  const handleOpenEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setHabitName(habit.name);
    setHabitType(habit.type);
    setTargetValue(habit.target_value || 5);
    setShowAddModal(true);
  };

  // Save new / edited habit
  const handleSaveHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;

    await saveHabit({
      id: editingHabit ? editingHabit.id : undefined,
      name: habitName.trim(),
      type: habitType,
      target_value: habitType === 'counter' ? targetValue : 1,
    });

    setShowAddModal(false);
    loadData();
  };

  // Archive / unarchive habit
  const handleArchive = async (id: string, currentStatus: boolean) => {
    await archiveHabit(id, !currentStatus);
    loadData();
  };

  // Delete habit
  const handleDelete = async (id: string) => {
    if (confirm('Delete this habit and its associated logs? (Other modules remain completely safe)')) {
      await deleteHabit(id);
      loadData();
    }
  };

  // Calculation for Daily View
  const dailyMetrics = useMemo(() => {
    if (activeHabits.length === 0) return { completedCount: 0, total: 0, percentage: 0 };
    let totalScore = 0;
    let completedCount = 0;

    activeHabits.forEach((habit) => {
      const val = logMap.get(`${habit.id}_${selectedDate}`) || 0;
      if (habit.type === 'boolean') {
        if (val > 0) {
          totalScore += 1;
          completedCount += 1;
        }
      } else {
        const target = habit.target_value || 1;
        totalScore += Math.min(1, val / target);
        if (val >= target) completedCount += 1;
      }
    });

    const percentage = Math.round((totalScore / activeHabits.length) * 100);
    return { completedCount, total: activeHabits.length, percentage };
  }, [activeHabits, logMap, selectedDate]);

  // Calculation for Weekly View
  const centerDate = useMemo(() => parseISO(selectedDate + 'T12:00:00'), [selectedDate]);
  const weekStart = useMemo(() => startOfWeek(centerDate, { weekStartsOn: 1 }), [centerDate]);
  const weekEnd = useMemo(() => endOfWeek(centerDate, { weekStartsOn: 1 }), [centerDate]);
  const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart, weekEnd]);

  const weeklyStats = useMemo(() => {
    const habitStats = activeHabits.map((habit) => {
      let daysDone = 0;
      weekDays.forEach((d) => {
        const dateStr = format(d, 'yyyy-MM-dd');
        const val = logMap.get(`${habit.id}_${dateStr}`) || 0;
        const target = habit.type === 'counter' ? (habit.target_value || 1) : 1;
        if (val >= target) daysDone += 1;
      });
      return {
        habit,
        daysDone,
        pct: Math.round((daysDone / 7) * 100),
      };
    });

    const totalPossible = activeHabits.length * 7;
    const totalDone = habitStats.reduce((acc, h) => acc + h.daysDone, 0);
    const overall = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;

    return { habitStats, overall };
  }, [activeHabits, weekDays, logMap]);

  // Calculation for Monthly View
  const monthStart = useMemo(() => startOfMonth(centerDate), [centerDate]);
  const monthEnd = useMemo(() => endOfMonth(centerDate), [centerDate]);
  const monthDays = useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [monthStart, monthEnd]);

  const monthlyStats = useMemo(() => {
    const daysInMonth = monthDays.length;
    const habitStats = activeHabits.map((habit) => {
      let daysDone = 0;
      monthDays.forEach((d) => {
        const dateStr = format(d, 'yyyy-MM-dd');
        const val = logMap.get(`${habit.id}_${dateStr}`) || 0;
        const target = habit.type === 'counter' ? (habit.target_value || 1) : 1;
        if (val >= target) daysDone += 1;
      });
      return {
        habit,
        daysDone,
        pct: Math.round((daysDone / daysInMonth) * 100),
      };
    });

    const totalPossible = activeHabits.length * daysInMonth;
    const totalDone = habitStats.reduce((acc, h) => acc + h.daysDone, 0);
    const overall = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;

    return { habitStats, overall };
  }, [activeHabits, monthDays, logMap]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#14181B] dark:text-[#E7ECEC] flex items-center gap-3">
            <CheckSquare className="w-7 h-7 text-[#D9551F] dark:text-[#FF7A47]" />
            <span>Habit Tracking System</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#6B655F] dark:text-[#98A6AD] mt-1 font-mono">
            {activeHabits.length} habits active • Daily, Weekly, and Monthly Execution
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#E2DAC8] dark:bg-[#121A21] p-1 rounded-2xl border border-[#CFC3AB] dark:border-[#1D2830]">
          <button
            onClick={() => setViewMode('daily')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'daily'
                ? 'bg-[#EBE3D3] dark:bg-[#17222C] text-[#D9551F] dark:text-[#FF7A47] font-bold border border-[#B5A88F] dark:border-[#2B3A46] shadow-sm'
                : 'text-[#6B655F] dark:text-[#98A6AD] hover:text-[#14181B] dark:hover:text-[#E7ECEC]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Daily</span>
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'weekly'
                ? 'bg-[#EBE3D3] dark:bg-[#17222C] text-[#D9551F] dark:text-[#FF7A47] font-bold border border-[#B5A88F] dark:border-[#2B3A46] shadow-sm'
                : 'text-[#6B655F] dark:text-[#98A6AD] hover:text-[#14181B] dark:hover:text-[#E7ECEC]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Weekly</span>
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'monthly'
                ? 'bg-[#EBE3D3] dark:bg-[#17222C] text-[#D9551F] dark:text-[#FF7A47] font-bold border border-[#B5A88F] dark:border-[#2B3A46] shadow-sm'
                : 'text-[#6B655F] dark:text-[#98A6AD] hover:text-[#14181B] dark:hover:text-[#E7ECEC]'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Monthly</span>
          </button>
        </div>
      </div>

      <DateSelector />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-[#6B655F] dark:text-[#98A6AD] font-mono">
              {viewMode === 'daily' ? 'Daily Completion Rate' : viewMode === 'weekly' ? 'Weekly Rate' : 'Monthly Rate'}
            </p>
            <p className="text-2xl font-bold text-[#14181B] dark:text-[#E7ECEC] mt-0.5 font-mono">
              {viewMode === 'daily'
                ? `${dailyMetrics.percentage}%`
                : viewMode === 'weekly'
                ? `${weeklyStats.overall}%`
                : `${monthlyStats.overall}%`}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#D9551F]/15 dark:bg-[#FF7A47]/20 border border-[#D9551F]/30 dark:border-[#FF7A47]/40 flex items-center justify-center">
            <Percent className="w-5 h-5 text-[#D9551F] dark:text-[#FF7A47]" />
          </div>
        </div>

        <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-[#6B655F] dark:text-[#98A6AD] font-mono">Habits Completed Today</p>
            <p className="text-2xl font-bold text-[#14181B] dark:text-[#E7ECEC] mt-0.5 font-mono">
              {dailyMetrics.completedCount}{' '}
              <span className="text-sm font-normal text-[#6B655F] dark:text-[#98A6AD]">/ {dailyMetrics.total}</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#2E9C82]/15 dark:bg-[#8FE0CE]/20 border border-[#2E9C82]/30 dark:border-[#8FE0CE]/40 flex items-center justify-center">
            <CheckSquare className="w-5 h-5 text-[#2E9C82] dark:text-[#8FE0CE]" />
          </div>
        </div>

        <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-[#6B655F] dark:text-[#98A6AD] font-mono">Manage Habits</p>
            <button
              onClick={handleOpenAdd}
              className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#D9551F] dark:text-[#FF7A47] hover:underline transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Habit</span>
            </button>
          </div>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition-all ${
              showArchived
                ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40'
                : 'bg-[#EBE3D3] dark:bg-[#17222C] text-[#6B655F] dark:text-[#98A6AD] border-[#CFC3AB] dark:border-[#1D2830]'
            }`}
          >
            {showArchived ? 'Hide Archived' : 'Show Archived'}
          </button>
        </div>
      </div>

      {viewMode === 'daily' && (
        <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-5 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-[#CFC3AB] dark:border-[#1D2830]">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] flex items-center gap-2 font-mono">
              <Calendar className="w-4 h-4 text-[#D9551F] dark:text-[#FF7A47]" />
              <span>Routines for {format(parseISO(selectedDate + 'T12:00:00'), 'EEEE, MMM d')}</span>
            </h2>
            <span className="text-xs text-[#6B655F] dark:text-[#98A6AD] font-mono">Click to toggle or update counter</span>
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
                      ? 'bg-[#2E9C82]/10 dark:bg-[#8FE0CE]/10 border-[#2E9C82]/30 dark:border-[#8FE0CE]/30'
                      : 'bg-[#EBE3D3] dark:bg-[#0B0F14] border-[#CFC3AB] dark:border-[#1D2830] hover:border-[#B5A88F]'
                  } ${!habit.is_active ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {isBoolean ? (
                      <button
                        onClick={() => handleToggleBoolean(habit.id)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          isComplete
                            ? 'bg-[#2E9C82] dark:bg-[#8FE0CE] text-white dark:text-[#0B0F14] shadow-sm'
                            : 'bg-[#DDD5C3] dark:bg-[#17222C] text-[#6B655F] dark:text-[#98A6AD]'
                        }`}
                      >
                        {isComplete ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>
                    ) : (
                      <div className="w-6 h-6 rounded-lg bg-[#D9551F]/20 dark:bg-[#FF7A47]/20 border border-[#D9551F]/40 dark:border-[#FF7A47]/40 flex items-center justify-center text-xs font-bold text-[#D9551F] dark:text-[#FF7A47] font-mono">
                        #
                      </div>
                    )}

                    <div>
                      <p className={`text-sm font-semibold ${isComplete ? 'text-[#14181B] dark:text-[#E7ECEC]' : 'text-[#4A4540] dark:text-[#C2C9CA]'}`}>
                        {habit.name}
                        {!habit.is_active && (
                          <span className="ml-2 text-[10px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 font-mono">
                            Archived
                          </span>
                        )}
                      </p>
                      {habit.type === 'counter' && (
                        <p className="text-xs text-[#6B655F] dark:text-[#98A6AD] font-mono">
                          Target: <span className="font-semibold text-[#14181B] dark:text-[#E7ECEC]">{habit.target_value}</span> • Logged:{' '}
                          <span className={isComplete ? 'text-[#2E9C82] dark:text-[#8FE0CE] font-semibold' : 'text-[#14181B] dark:text-[#E7ECEC]'}>
                            {currentVal}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {habit.type === 'counter' && (
                      <div className="flex items-center gap-1.5 bg-[#DDD5C3] dark:bg-[#17222C] p-1 rounded-xl border border-[#CFC3AB] dark:border-[#1D2830]">
                        <button
                          onClick={() => handleUpdateCounter(habit.id, -1)}
                          disabled={currentVal <= 0}
                          className="w-7 h-7 rounded-lg bg-[#EBE3D3] dark:bg-[#0B0F14] hover:bg-[#D6CDBC] dark:hover:bg-[#1E2B37] disabled:opacity-30 text-[#14181B] dark:text-[#E7ECEC] flex items-center justify-center cursor-pointer transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center font-bold text-sm text-[#14181B] dark:text-[#E7ECEC] font-mono">{currentVal}</span>
                        <button
                          onClick={() => handleUpdateCounter(habit.id, 1)}
                          className="w-7 h-7 rounded-lg bg-[#D9551F] hover:bg-[#C24816] dark:bg-[#FF7A47] dark:hover:bg-[#FF8E61] text-white dark:text-[#0B0F14] flex items-center justify-center cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-1 pl-2 border-l border-[#CFC3AB] dark:border-[#1D2830]">
                      <button
                        onClick={() => handleOpenEdit(habit)}
                        title="Edit habit"
                        className="p-1.5 rounded-lg text-[#6B655F] dark:text-[#98A6AD] hover:text-[#14181B] dark:hover:text-[#E7ECEC] hover:bg-[#DDD5C3] dark:hover:bg-[#17222C] transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleArchive(habit.id, habit.is_active)}
                        title={habit.is_active ? 'Archive habit' : 'Unarchive habit'}
                        className="p-1.5 rounded-lg text-[#6B655F] dark:text-[#98A6AD] hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(habit.id)}
                        title="Delete habit"
                        className="p-1.5 rounded-lg text-[#6B655F] dark:text-[#98A6AD] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {activeHabits.length === 0 && (
              <div className="py-12 text-center text-[#6B655F] dark:text-[#98A6AD] text-sm font-mono">
                No habits defined. Click "Add New Habit" or load sample data in Settings.
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === 'weekly' && (
        <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-5 shadow-sm overflow-x-auto transition-colors">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#CFC3AB] dark:border-[#1D2830]">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] flex items-center gap-2 font-mono">
              <Layers className="w-4 h-4 text-[#D9551F] dark:text-[#FF7A47]" />
              <span>
                Weekly Overview: {format(weekDays[0], 'MMM d')} – {format(weekDays[6], 'MMM d, yyyy')}
              </span>
            </h2>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#D9551F] dark:text-[#FF7A47] font-mono">
              <span>Overall Week: {weeklyStats.overall}%</span>
            </div>
          </div>

          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-[#CFC3AB] dark:border-[#1D2830] text-xs font-semibold text-[#6B655F] dark:text-[#98A6AD] font-mono">
                <th className="py-2.5 px-3">Habit</th>
                {weekDays.map((d) => {
                  const isSel = format(d, 'yyyy-MM-dd') === selectedDate;
                  return (
                    <th
                      key={d.toISOString()}
                      onClick={() => setSelectedDate(format(d, 'yyyy-MM-dd'))}
                      className={`py-2.5 px-2 text-center cursor-pointer transition-colors ${
                        isSel ? 'text-[#D9551F] dark:text-[#FF7A47] bg-[#D9551F]/10 dark:bg-[#FF7A47]/10 rounded-t-xl font-bold' : 'hover:text-[#14181B] dark:hover:text-[#E7ECEC]'
                      }`}
                    >
                      <div>{format(d, 'EEE')}</div>
                      <div className="text-[10px] text-[#6B655F] dark:text-[#98A6AD] font-normal">{format(d, 'M/d')}</div>
                    </th>
                  );
                })}
                <th className="py-2.5 px-3 text-right">Completion %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CFC3AB]/50 dark:divide-[#1D2830]/50">
              {weeklyStats.habitStats.map(({ habit, pct }) => {
                return (
                  <tr key={habit.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-semibold text-sm text-[#14181B] dark:text-[#E7ECEC]">{habit.name}</td>
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
                            className={`w-8 h-8 mx-auto rounded-xl flex items-center justify-center text-xs font-bold transition-transform hover:scale-110 cursor-pointer font-mono ${
                              isComplete
                                ? 'bg-[#2E9C82]/20 text-[#2E9C82] dark:text-[#8FE0CE] border border-[#2E9C82]/50'
                                : isPartial
                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40'
                                : 'bg-[#EBE3D3] dark:bg-[#0B0F14] text-[#6B655F] dark:text-[#98A6AD] border border-[#CFC3AB] dark:border-[#1D2830]'
                            }`}
                          >
                            {habit.type === 'boolean' ? (isComplete ? '✓' : '—') : val}
                          </button>
                        </td>
                      );
                    })}
                    <td className="py-3 px-3 text-right font-bold text-sm font-mono">
                      <span
                        className={
                          pct >= 80 ? 'text-[#2E9C82] dark:text-[#8FE0CE]' : pct >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-[#6B655F] dark:text-[#98A6AD]'
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

      {viewMode === 'monthly' && (
        <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-5 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-[#CFC3AB] dark:border-[#1D2830]">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] flex items-center gap-2 font-mono">
              <BarChart2 className="w-4 h-4 text-[#D9551F] dark:text-[#FF7A47]" />
              <span>Monthly Heatmap ({format(parseISO(selectedDate + 'T12:00:00'), 'MMMM yyyy')})</span>
            </h2>
            <span className="text-xs font-semibold text-[#D9551F] dark:text-[#FF7A47] font-mono">Total Monthly: {monthlyStats.overall}%</span>
          </div>

          <div className="space-y-4">
            {monthlyStats.habitStats.map(({ habit, pct }) => (
              <div key={habit.id} className="p-3.5 rounded-2xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#14181B] dark:text-[#E7ECEC]">{habit.name}</span>
                  <span className="font-bold text-[#D9551F] dark:text-[#FF7A47] font-mono">{pct}%</span>
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
                            ? 'bg-[#2E9C82] dark:bg-[#8FE0CE] shadow-sm'
                            : ratio > 0
                            ? 'bg-[#2E9C82]/50 dark:bg-[#8FE0CE]/50'
                            : 'bg-[#DDD5C3] dark:bg-[#17222C]'
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

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-6 shadow-2xl space-y-4 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-[#CFC3AB] dark:border-[#1D2830]">
              <h3 className="text-lg font-display font-bold text-[#14181B] dark:text-[#E7ECEC] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D9551F] dark:text-[#FF7A47]" />
                <span>{editingHabit ? 'Edit Habit' : 'New Habit'}</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-[#6B655F] dark:text-[#98A6AD] hover:text-[#14181B] dark:hover:text-[#E7ECEC]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHabit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1.5 font-mono">
                  Habit Name
                </label>
                <input
                  type="text"
                  required
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  placeholder="e.g. Fajr Prayer or Read 10 pages"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] placeholder-[#6B655F]/60 focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1.5 font-mono">
                  Habit Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHabitType('boolean')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      habitType === 'boolean'
                        ? 'bg-[#D9551F]/15 dark:bg-[#FF7A47]/20 text-[#D9551F] dark:text-[#FF7A47] border-[#D9551F]/40 dark:border-[#FF7A47]/40 font-bold'
                        : 'bg-[#EBE3D3] dark:bg-[#0B0F14] text-[#6B655F] dark:text-[#98A6AD] border-[#CFC3AB] dark:border-[#1D2830]'
                    }`}
                  >
                    Checkbox (Done / Not)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHabitType('counter')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      habitType === 'counter'
                        ? 'bg-[#D9551F]/15 dark:bg-[#FF7A47]/20 text-[#D9551F] dark:text-[#FF7A47] border-[#D9551F]/40 dark:border-[#FF7A47]/40 font-bold'
                        : 'bg-[#EBE3D3] dark:bg-[#0B0F14] text-[#6B655F] dark:text-[#98A6AD] border-[#CFC3AB] dark:border-[#1D2830]'
                    }`}
                  >
                    Numeric Counter
                  </button>
                </div>
              </div>

              {habitType === 'counter' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1.5 font-mono">
                    Daily Target Value
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={targetValue}
                    onChange={(e) => setTargetValue(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47] text-sm font-mono"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#CFC3AB] dark:border-[#1D2830]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B655F] dark:text-[#98A6AD] hover:text-[#14181B] dark:hover:text-[#E7ECEC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#D9551F] hover:bg-[#C24816] dark:bg-[#FF7A47] dark:hover:bg-[#FF8E61] text-white dark:text-[#0B0F14] shadow transition-all cursor-pointer"
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
