'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDate } from '@/context/DateContext';
import DateSelector from '@/components/DateSelector';
import LogRunModal from '@/components/running/LogRunModal';
import { getRuns, saveRun, deleteRun, getHabits, saveHabitLog } from '@/lib/storage';
import { Run } from '@/types';
import {
  Activity,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  Gauge,
  Flame,
  Award,
  Sparkles,
} from 'lucide-react';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
} from 'date-fns';

export default function RunningPage() {
  const { selectedDate, setSelectedDate } = useDate();
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingRun, setEditingRun] = useState<Run | null>(null);

  // Load runs
  const loadRuns = useCallback(async () => {
    setLoading(true);
    try {
      const fetched = await getRuns();
      setRuns(fetched);
    } catch (err) {
      console.error('Error loading runs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  // Save run & check off "Run" habit if exists
  const handleSaveRun = async (runData: Omit<Run, 'id'>) => {
    const saved = await saveRun(editingRun ? { ...runData, id: editingRun.id } : runData);

    // Auto-check the Run habit for this date
    try {
      const habits = await getHabits();
      const runHabit = habits.find((h) => h.name.toLowerCase() === 'run');
      if (runHabit) {
        await saveHabitLog(runHabit.id, runData.date, 1);
      }
    } catch (err) {
      console.warn('Auto-check run habit error:', err);
    }

    setEditingRun(null);
    loadRuns();
  };

  const handleDeleteRun = async (id: string) => {
    if (confirm('Delete this run entry?')) {
      await deleteRun(id);
      loadRuns();
    }
  };

  // Run on currently selected date
  const runOnSelectedDate = useMemo(() => {
    return runs.find((r) => r.date === selectedDate) || null;
  }, [runs, selectedDate]);

  // Weekly & Monthly calculations
  const stats = useMemo(() => {
    const center = parseISO(selectedDate + 'T12:00:00');
    const wStart = format(startOfWeek(center, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const wEnd = format(endOfWeek(center, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const mStart = format(startOfMonth(center), 'yyyy-MM-dd');
    const mEnd = format(endOfMonth(center), 'yyyy-MM-dd');

    const weekRuns = runs.filter((r) => r.date >= wStart && r.date <= wEnd);
    const monthRuns = runs.filter((r) => r.date >= mStart && r.date <= mEnd);

    const weekKm = weekRuns.reduce((acc, r) => acc + Number(r.distance_km), 0);
    const monthKm = monthRuns.reduce((acc, r) => acc + Number(r.distance_km), 0);
    const totalRuns = runs.length;

    // Calculate average pace across all runs
    let totalDur = 0;
    let totalDist = 0;
    runs.forEach((r) => {
      totalDur += Number(r.duration_minutes);
      totalDist += Number(r.distance_km);
    });

    let avgPaceStr = '—';
    if (totalDist > 0) {
      const paceDec = totalDur / totalDist;
      const pMin = Math.floor(paceDec);
      const pSec = Math.round((paceDec - pMin) * 60);
      avgPaceStr = `${pMin}:${pSec < 10 ? '0' : ''}${pSec}`;
    }

    return {
      weekKm: Math.round(weekKm * 10) / 10,
      monthKm: Math.round(monthKm * 10) / 10,
      weekCount: weekRuns.length,
      monthCount: monthRuns.length,
      totalRuns,
      avgPaceStr,
    };
  }, [runs, selectedDate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-emerald-400" />
            <span>Running & Aerobic Tracker</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Log distances, times, and paces. Manual entry with reserved schema for future sync.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingRun(null);
            setShowLogModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Run</span>
        </button>
      </div>

      <DateSelector />

      {/* Running Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0d131f]/80 border border-slate-800/80 rounded-3xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Weekly Mileage</p>
            <p className="text-3xl font-extrabold text-white mt-1">
              {stats.weekKm} <span className="text-sm font-semibold text-slate-500">km</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">{stats.weekCount} runs this week</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Flame className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="bg-[#0d131f]/80 border border-slate-800/80 rounded-3xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Monthly Volume</p>
            <p className="text-3xl font-extrabold text-white mt-1">
              {stats.monthKm} <span className="text-sm font-semibold text-slate-500">km</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">{stats.monthCount} runs this month</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Award className="w-5 h-5 text-cyan-400" />
          </div>
        </div>

        <div className="bg-[#0d131f]/80 border border-slate-800/80 rounded-3xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Average Pace</p>
            <p className="text-3xl font-extrabold text-white mt-1">
              {stats.avgPaceStr} <span className="text-sm font-semibold text-slate-500">/km</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">All-time aerobic pace</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Gauge className="w-5 h-5 text-indigo-400" />
          </div>
        </div>

        <div className="bg-[#0d131f]/80 border border-slate-800/80 rounded-3xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Runs</p>
            <p className="text-3xl font-extrabold text-white mt-1">{stats.totalRuns}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Recorded sessions</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Selected Day Run Card */}
      <div className="bg-[#0d131f]/80 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span>Run on {format(parseISO(selectedDate + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}</span>
          </h2>
          {runOnSelectedDate && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 font-semibold">
              Completed
            </span>
          )}
        </div>

        {runOnSelectedDate ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider">Distance</span>
                <p className="text-2xl font-bold text-white">{runOnSelectedDate.distance_km} km</p>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider">Duration</span>
                <p className="text-2xl font-bold text-white">{runOnSelectedDate.duration_minutes} min</p>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider">Pace</span>
                <p className="text-2xl font-bold text-emerald-400">{runOnSelectedDate.pace} /km</p>
              </div>
            </div>

            {runOnSelectedDate.notes && (
              <p className="text-xs text-slate-400 italic max-w-sm">"{runOnSelectedDate.notes}"</p>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingRun(runOnSelectedDate);
                  setShowLogModal(true);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteRun(runOnSelectedDate.id)}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-slate-700/60"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center space-y-3">
            <p className="text-sm text-slate-400">No run logged for this date.</p>
            <button
              onClick={() => {
                setEditingRun(null);
                setShowLogModal(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-900/40 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Run for this Day</span>
            </button>
          </div>
        )}
      </div>

      {/* Run Log History */}
      <div className="bg-[#0d131f]/80 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Running History</span>
          </h2>
          <span className="text-xs text-slate-500">{runs.length} total entries</span>
        </div>

        <div className="space-y-2">
          {runs.map((run) => (
            <div
              key={run.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/80 transition-all gap-3"
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedDate(run.date)}
                  className="w-12 text-center p-1.5 rounded-xl bg-slate-800/80 text-xs font-bold text-slate-300 hover:text-cyan-400 hover:bg-cyan-950/40 transition-colors"
                >
                  {format(parseISO(run.date + 'T12:00:00'), 'MMM d')}
                </button>

                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold text-white">{run.distance_km} km</span>
                    <span className="text-xs text-slate-400">({run.duration_minutes} mins)</span>
                    <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                      {run.pace} /km
                    </span>
                  </div>
                  {run.notes && <p className="text-xs text-slate-400 mt-0.5">{run.notes}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => {
                    setEditingRun(run);
                    setShowLogModal(true);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteRun(run.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {runs.length === 0 && (
            <div className="py-8 text-center text-slate-500 text-xs">
              No runs recorded yet. Click "Record New Run" above to start your log.
            </div>
          )}
        </div>
      </div>

      {/* Log Modal */}
      <LogRunModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        defaultDate={selectedDate}
        onSave={handleSaveRun}
        editingRun={editingRun}
      />
    </div>
  );
}