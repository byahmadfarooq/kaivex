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
  CheckCircle2,
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
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

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
    try {
      await saveRun(editingRun ? { ...runData, id: editingRun.id } : runData);

      // Auto-check the Run habit for this date if one exists
      try {
        const habits = await getHabits();
        const runHabit = habits.find((h) => h.name.toLowerCase().includes('run'));
        if (runHabit) {
          await saveHabitLog(runHabit.id, runData.date, 1);
        }
      } catch (habitErr) {
        console.warn('Auto-check run habit error:', habitErr);
      }

      setEditingRun(null);
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 3500);
      await loadRuns();
    } catch (err) {
      console.error('Failed to save run:', err);
      alert('Error saving run session. Please try again.');
    }
  };

  const handleDeleteRun = async (id: string) => {
    if (confirm('Delete this recorded run session?')) {
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

    let avgPaceStr = '--:--';
    if (totalDist > 0) {
      const paceDec = totalDur / totalDist;
      const pMin = Math.floor(paceDec);
      const pSec = Math.round((paceDec - pMin) * 60);
      avgPaceStr = `${pMin}:${pSec < 10 ? '0' : ''}${pSec}`;
    }

    return {
      weekKm: weekKm.toFixed(1),
      monthKm: monthKm.toFixed(1),
      totalRuns,
      avgPaceStr,
    };
  }, [runs, selectedDate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#14181B] dark:text-[#E7ECEC] flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-[#D9551F] dark:text-[#FF7A47]" />
            <span>Endurance & Running Log</span>
          </h1>
          <p className="text-xs text-[#6B655F] dark:text-[#98A6AD] mt-0.5 font-sans">
            Distance, duration, cadence, and pace metrics with automatic habit cross-checking.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingRun(null);
            setShowLogModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold bg-[#D9551F] hover:bg-[#B84214] dark:bg-[#FF7A47] dark:hover:bg-[#FF9066] text-white dark:text-[#0B0F14] shadow-sm transition-all cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Run</span>
        </button>
      </div>

      {saveSuccessNotice && (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-[#2E9C82]/15 border border-[#2E9C82]/30 text-[#2E9C82] dark:text-[#8FE0CE] text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Run session recorded successfully and synced with habit tracker!</span>
        </div>
      )}

      <DateSelector />

      {/* Aggregate Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-5 shadow-sm dark:shadow-xl flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD]">This Week</p>
            <p className="font-mono text-3xl font-extrabold text-[#14181B] dark:text-[#E7ECEC] mt-1">{stats.weekKm} <span className="text-sm font-sans font-medium text-[#6B655F] dark:text-[#98A6AD]">km</span></p>
            <p className="text-[11px] text-[#6B655F] dark:text-[#98A6AD] mt-0.5 font-sans">Monday - Sunday</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#D9551F]/10 dark:bg-[#FF7A47]/10 border border-[#D9551F]/20 dark:border-[#FF7A47]/20 flex items-center justify-center">
            <Flame className="w-5 h-5 text-[#D9551F] dark:text-[#FF7A47]" />
          </div>
        </div>

        <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-5 shadow-sm dark:shadow-xl flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD]">This Month</p>
            <p className="font-mono text-3xl font-extrabold text-[#14181B] dark:text-[#E7ECEC] mt-1">{stats.monthKm} <span className="text-sm font-sans font-medium text-[#6B655F] dark:text-[#98A6AD]">km</span></p>
            <p className="text-[11px] text-[#6B655F] dark:text-[#98A6AD] mt-0.5 font-sans">Total monthly volume</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#2E9C82]/10 dark:bg-[#8FE0CE]/10 border border-[#2E9C82]/20 dark:border-[#8FE0CE]/20 flex items-center justify-center">
            <Award className="w-5 h-5 text-[#2E9C82] dark:text-[#8FE0CE]" />
          </div>
        </div>

        <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-5 shadow-sm dark:shadow-xl flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD]">Average Pace</p>
            <p className="font-mono text-3xl font-extrabold text-[#2E9C82] dark:text-[#8FE0CE] mt-1">{stats.avgPaceStr}</p>
            <p className="text-[11px] text-[#6B655F] dark:text-[#98A6AD] mt-0.5 font-sans">min / km overall</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#2E9C82]/10 dark:bg-[#8FE0CE]/10 border border-[#2E9C82]/20 dark:border-[#8FE0CE]/20 flex items-center justify-center">
            <Gauge className="w-5 h-5 text-[#2E9C82] dark:text-[#8FE0CE]" />
          </div>
        </div>

        <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-5 shadow-sm dark:shadow-xl flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD]">Total Runs</p>
            <p className="font-mono text-3xl font-extrabold text-[#14181B] dark:text-[#E7ECEC] mt-1">{stats.totalRuns}</p>
            <p className="text-[11px] text-[#6B655F] dark:text-[#98A6AD] mt-0.5 font-sans">Recorded sessions</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#D9551F]/10 dark:bg-[#FF7A47]/10 border border-[#D9551F]/20 dark:border-[#FF7A47]/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#D9551F] dark:text-[#FF7A47]" />
          </div>
        </div>
      </div>

      {/* Selected Day Run Card */}
      <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-6 shadow-sm dark:shadow-xl space-y-3 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-[#CFC3AB]/60 dark:border-[#1D2830]">
          <h2 className="font-display text-base font-bold text-[#14181B] dark:text-[#E7ECEC] flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#D9551F] dark:text-[#FF7A47]" />
            <span>Run on {format(parseISO(selectedDate + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}</span>
          </h2>
          {runOnSelectedDate && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#2E9C82]/15 text-[#2E9C82] dark:text-[#8FE0CE] border border-[#2E9C82]/30 font-semibold font-mono">
              Completed
            </span>
          )}
        </div>

        {runOnSelectedDate ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830]">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-xs text-[#6B655F] dark:text-[#98A6AD] uppercase tracking-wider font-sans">Distance</span>
                <p className="font-mono text-2xl font-bold text-[#14181B] dark:text-[#E7ECEC]">{runOnSelectedDate.distance_km} km</p>
              </div>
              <div>
                <span className="text-xs text-[#6B655F] dark:text-[#98A6AD] uppercase tracking-wider font-sans">Duration</span>
                <p className="font-mono text-2xl font-bold text-[#14181B] dark:text-[#E7ECEC]">{runOnSelectedDate.duration_minutes} min</p>
              </div>
              <div>
                <span className="text-xs text-[#6B655F] dark:text-[#98A6AD] uppercase tracking-wider font-sans">Pace</span>
                <p className="font-mono text-2xl font-bold text-[#2E9C82] dark:text-[#8FE0CE]">{runOnSelectedDate.pace} /km</p>
              </div>
            </div>

            {runOnSelectedDate.notes && (
              <p className="text-xs text-[#6B655F] dark:text-[#98A6AD] italic max-w-sm font-sans">"{runOnSelectedDate.notes}"</p>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingRun(runOnSelectedDate);
                  setShowLogModal(true);
                }}
                className="p-2 rounded-xl text-[#6B655F] dark:text-[#98A6AD] hover:text-[#14181B] dark:hover:text-[#E7ECEC] hover:bg-[#CFC3AB]/30 dark:hover:bg-[#1D2830] border border-[#CFC3AB] dark:border-[#1D2830] transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteRun(runOnSelectedDate.id)}
                className="p-2 rounded-xl text-[#6B655F] dark:text-[#98A6AD] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 border border-[#CFC3AB] dark:border-[#1D2830] transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center space-y-3">
            <p className="text-sm text-[#6B655F] dark:text-[#98A6AD] font-sans">No run logged for this date.</p>
            <button
              onClick={() => {
                setEditingRun(null);
                setShowLogModal(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] hover:bg-[#CFC3AB]/40 dark:hover:bg-[#1D2830] text-[#D9551F] dark:text-[#FF7A47] border border-[#CFC3AB] dark:border-[#1D2830] cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Run for this Day</span>
            </button>
          </div>
        )}
      </div>

      {/* Run Log History */}
      <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-[#CFC3AB]/60 dark:border-[#1D2830]">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#2E9C82] dark:text-[#8FE0CE]" />
            <span>Running History</span>
          </h2>
          <span className="text-xs text-[#6B655F] dark:text-[#98A6AD] font-mono">{runs.length} total entries</span>
        </div>

        <div className="space-y-2">
          {runs.map((run) => (
            <div
              key={run.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] hover:border-[#D9551F] dark:hover:border-[#FF7A47] transition-all gap-3"
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedDate(run.date)}
                  className="w-16 text-center p-1.5 rounded-xl bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] text-xs font-bold text-[#14181B] dark:text-[#E7ECEC] hover:text-[#D9551F] dark:hover:text-[#FF7A47] transition-colors font-mono cursor-pointer"
                >
                  {format(parseISO(run.date + 'T12:00:00'), 'MMM d')}
                </button>

                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-bold text-[#14181B] dark:text-[#E7ECEC]">{run.distance_km} km</span>
                    <span className="text-xs text-[#6B655F] dark:text-[#98A6AD] font-mono">({run.duration_minutes} mins)</span>
                    <span className="text-xs font-mono font-semibold text-[#2E9C82] dark:text-[#8FE0CE] bg-[#2E9C82]/10 dark:bg-[#8FE0CE]/10 px-2 py-0.5 rounded border border-[#2E9C82]/20">
                      {run.pace} /km
                    </span>
                  </div>
                  {run.notes && <p className="text-xs text-[#6B655F] dark:text-[#98A6AD] mt-0.5 font-sans italic">"{run.notes}"</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => {
                    setEditingRun(run);
                    setShowLogModal(true);
                  }}
                  className="p-1.5 rounded-lg text-[#6B655F] dark:text-[#98A6AD] hover:text-[#14181B] dark:hover:text-[#E7ECEC] transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteRun(run.id)}
                  className="p-1.5 rounded-lg text-[#6B655F] dark:text-[#98A6AD] hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {runs.length === 0 && (
            <div className="py-8 text-center text-[#6B655F] dark:text-[#98A6AD] text-xs font-sans">
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
