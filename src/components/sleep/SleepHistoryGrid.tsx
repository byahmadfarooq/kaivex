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
    <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors">
      <div className="flex items-center justify-between pb-3 border-b border-[#CFC3AB]/60 dark:border-[#1D2830]">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#2E9C82] dark:text-[#8FE0CE]" />
          <span>Recent Sleep Cadence (Last 14 Days)</span>
        </h2>
        <span className="text-xs text-[#6B655F] dark:text-[#98A6AD] font-sans">Click card to jump to date</span>
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
                  ? 'bg-[#2E9C82]/20 border-[#2E9C82] dark:border-[#8FE0CE] shadow-sm'
                  : 'bg-[#EBE3D3] dark:bg-[#0B0F14] border-[#CFC3AB] dark:border-[#1D2830] hover:border-[#D9551F] dark:hover:border-[#FF7A47]'
              }`}
            >
              <span className="block text-[11px] font-bold text-[#6B655F] dark:text-[#98A6AD] uppercase font-mono">
                {format(parseISO(entry.date + 'T12:00:00'), 'EEE, MMM d')}
              </span>
              <div className="my-1">
                <span className="font-mono text-lg font-bold text-[#14181B] dark:text-[#E7ECEC]">
                  {hours}
                </span>
                <span className="text-[10px] text-[#6B655F] dark:text-[#98A6AD] ml-0.5">hrs</span>
              </div>
              <div
                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                  (entry.quality_score || 0) >= 80
                    ? 'bg-[#2E9C82]/15 text-[#2E9C82] dark:text-[#8FE0CE]'
                    : (entry.quality_score || 0) >= 60
                    ? 'bg-[#D9551F]/15 text-[#D9551F] dark:text-[#FF7A47]'
                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                }`}
              >
                Score: {entry.quality_score ?? '--'}%
              </div>
            </button>
          );
        })}

        {history.length === 0 && (
          <div className="col-span-full py-6 text-center text-xs text-[#6B655F] dark:text-[#98A6AD] font-sans">
            No sleep history recorded yet. Log tonight's sleep to populate the cadence grid.
          </div>
        )}
      </div>
    </div>
  );
}
