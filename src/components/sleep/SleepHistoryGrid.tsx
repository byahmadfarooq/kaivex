'use client';

import React from 'react';
import { TrendingUp } from 'lucide-react';
import { SleepEntry } from '@/types';
import { format, parseISO } from 'date-fns';

interface SleepHistoryGridProps {
  history: SleepEntry[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export default function SleepHistoryGrid({
  history,
  selectedDate,
  onSelectDate,
}: SleepHistoryGridProps) {
  return (
    <div className="bg-white dark:bg-[#111622] border border-[#E2DDD5] dark:border-[#1E2738] shadow-sm dark:shadow-xl transition-colors rounded-3xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#E2DDD5] dark:border-[#1E2738]">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#78716C] dark:text-[#94A3B8] flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#1E826C] dark:text-[#2DD4BF]" />
          <span>Recent Sleep History</span>
        </h2>
        <span className="text-xs text-[#78716C] dark:text-[#64748B]">Click any card to load & backdate</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
        {history.map((entry) => {
          const isSelected = entry.date === selectedDate;
          const hours = (entry.duration_minutes / 60).toFixed(1);
          return (
            <button
              key={entry.id}
              onClick={() => onSelectDate(entry.date)}
              className={`p-3 rounded-2xl border transition-all text-center cursor-pointer ${
                isSelected
                  ? 'bg-cyan-950/30 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                  : 'bg-[#F5F2EB]/40 dark:bg-[#090C11]/40 border-[#E2DDD5] dark:border-[#1E2738] hover:border-slate-700'
              }`}
            >
              <div className="text-[11px] font-medium text-[#78716C] dark:text-[#94A3B8]">
                {format(parseISO(entry.date + 'T12:00:00'), 'EEE, MMM d')}
              </div>
              <div className="text-lg font-bold text-[#1C1917] dark:text-[#F8FAFC] my-1">{hours} hrs</div>
              <div
                className={`text-xs font-semibold ${
                  entry.quality_score >= 80
                    ? 'text-emerald-400'
                    : entry.quality_score >= 60
                    ? 'text-[#1E826C] dark:text-[#2DD4BF]'
                    : 'text-amber-400'
                }`}
              >
                {entry.quality_score}%
              </div>
            </button>
          );
        })}
        {history.length === 0 && (
          <div className="col-span-full py-6 text-center text-[#78716C] dark:text-[#64748B] text-xs">
            No historical sleep entries logged yet.
          </div>
        )}
      </div>
    </div>
  );
}