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
    <div className="bg-white dark:bg-[#111622] border border-[#E2DDD5] dark:border-[#1E2738] shadow-sm dark:shadow-xl transition-colors rounded-3xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#E2DDD5] dark:border-[#1E2738]">
        <h2 className="text-base font-bold text-[#1C1917] dark:text-[#F8FAFC] flex items-center gap-2">
          <Moon className="w-5 h-5 text-indigo-400" />
          <span>Main Night Sleep ({format(parseISO(selectedDate + 'T12:00:00'), 'MMM d')})</span>
        </h2>
        {sleepEntry && (
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Logged
          </span>
        )}
      </div>

      <form onSubmit={handleSaveSleep} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] dark:text-[#94A3B8] mb-1.5">
              Sleep Time (Night Of)
            </label>
            <input
              type="time"
              required
              value={bedtimeTime}
              onChange={(e) => setBedtimeTime(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#F5F2EB] dark:bg-[#090C11] border border-[#E2DDD5] dark:border-[#1E2738] text-[#1C1917] dark:text-[#F8FAFC] font-mono text-lg focus:outline-none focus:border-[#1E826C] dark:focus:border-[#2DD4BF]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] dark:text-[#94A3B8] mb-1.5">
              Wake Time (Morning)
            </label>
            <input
              type="time"
              required
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#F5F2EB] dark:bg-[#090C11] border border-[#E2DDD5] dark:border-[#1E2738] text-[#1C1917] dark:text-[#F8FAFC] font-mono text-lg focus:outline-none focus:border-[#1E826C] dark:focus:border-[#2DD4BF]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] dark:text-[#94A3B8] mb-1.5">
            Sleep Notes / Quality Factors (Optional)
          </label>
          <textarea
            value={sleepNotes}
            onChange={(e) => setSleepNotes(e.target.value)}
            placeholder="e.g. Took magnesium, room temp was cool, felt refreshed"
            rows={2}
            className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F2EB] dark:bg-[#090C11] border border-[#E2DDD5] dark:border-[#1E2738] text-[#1C1917] dark:text-[#F8FAFC] placeholder-slate-500 text-sm focus:outline-none focus:border-[#1E826C] dark:focus:border-[#2DD4BF]"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-[#78716C] dark:text-[#94A3B8]">
            Live calculated score:{' '}
            <span className="font-bold text-[#1E826C] dark:text-[#2DD4BF]">{breakdown?.final_quality_score}%</span>
          </div>
          <button
            type="submit"
            disabled={savingSleep}
            className="px-6 py-2.5 rounded-2xl bg-cyan-500 hover:bg-[#1E826C] dark:bg-[#2DD4BF] active:scale-95 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {savingSleep ? 'Saving...' : sleepEntry ? 'Update Sleep Entry' : 'Save Sleep Entry'}
          </button>
        </div>
      </form>
    </div>
  );
}