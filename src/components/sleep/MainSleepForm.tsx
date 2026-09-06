'use client';

import React from 'react';
import { Moon, CheckCircle2 } from 'lucide-react';
import { SleepEntry, SleepQualityBreakdown } from '@/types';
import { format, parseISO } from 'date-fns';

interface MainSleepFormProps {
  selectedDate: string;
  sleepEntry: SleepEntry | null;
  bedtimeTime: string;
  setBedtimeTime: (val: string) => void;
  wakeTime: string;
  setWakeTime: (val: string) => void;
  sleepNotes: string;
  setSleepNotes: (val: string) => void;
  savingSleep: boolean;
  handleSaveSleep: (e: React.FormEvent) => void;
  breakdown: SleepQualityBreakdown | null;
}

export default function MainSleepForm({
  selectedDate,
  sleepEntry,
  bedtimeTime,
  setBedtimeTime,
  wakeTime,
  setWakeTime,
  sleepNotes,
  setSleepNotes,
  savingSleep,
  handleSaveSleep,
  breakdown,
}: MainSleepFormProps) {
  return (
    <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors">
      <div className="flex items-center justify-between pb-3 border-b border-[#CFC3AB]/60 dark:border-[#1D2830]">
        <h2 className="font-display text-base font-bold text-[#14181B] dark:text-[#E7ECEC] flex items-center gap-2">
          <Moon className="w-5 h-5 text-[#2E9C82] dark:text-[#8FE0CE]" />
          <span>Main Night Sleep ({format(parseISO(selectedDate + 'T12:00:00'), 'MMM d')})</span>
        </h2>
        {sleepEntry && (
          <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-[#2E9C82]/10 dark:bg-[#8FE0CE]/10 text-[#2E9C82] dark:text-[#8FE0CE] border border-[#2E9C82]/30 font-semibold font-mono">
            <CheckCircle2 className="w-3 h-3" />
            <span>Logged</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSaveSleep} className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1.5 font-sans">
              Bedtime
            </label>
            <input
              type="time"
              required
              value={bedtimeTime}
              onChange={(e) => setBedtimeTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] font-mono text-sm focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1.5 font-sans">
              Wake Time
            </label>
            <input
              type="time"
              required
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] font-mono text-sm focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1.5 font-sans">
            Sleep Notes & Observations
          </label>
          <textarea
            value={sleepNotes}
            onChange={(e) => setSleepNotes(e.target.value)}
            placeholder="e.g. Magnesium taken at 21:30, bedroom temp 19C, woke up naturally without alarm"
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] placeholder-[#6B655F]/60 dark:placeholder-[#98A6AD]/50 focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47] resize-none font-sans"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-[#6B655F] dark:text-[#98A6AD] font-mono">
            {breakdown && (
              <span>Duration: {Math.floor(breakdown.duration_minutes / 60)}h {breakdown.duration_minutes % 60}m</span>
            )}
          </div>

          <button
            type="submit"
            disabled={savingSleep}
            className="px-5 py-2.5 rounded-xl font-bold bg-[#D9551F] hover:bg-[#B84214] dark:bg-[#FF7A47] dark:hover:bg-[#FF9066] text-white dark:text-[#0B0F14] shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {savingSleep ? 'Saving...' : sleepEntry ? 'Update Sleep Entry' : 'Save Sleep Entry'}
          </button>
        </div>
      </form>
    </div>
  );
}
