'use client';

import React from 'react';
import { Coffee, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { NapEntry, SleepQualityBreakdown, SleepSettings } from '@/types';
import { format, parseISO } from 'date-fns';

interface NapsListProps {
  selectedDate: string;
  naps: NapEntry[];
  totalNapMins: number;
  settings: SleepSettings | null;
  breakdown: SleepQualityBreakdown | null;
  onOpenAddNap: () => void;
  onDeleteNap: (id: string) => void;
}

export default function NapsList({
  selectedDate,
  naps,
  totalNapMins,
  settings,
  breakdown,
  onOpenAddNap,
  onDeleteNap,
}: NapsListProps) {
  const threshold = settings?.nap_threshold_minutes || 45;
  const isOverThreshold = totalNapMins > threshold;

  return (
    <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors">
      <div className="flex items-center justify-between pb-3 border-b border-[#CFC3AB]/60 dark:border-[#1D2830]">
        <div>
          <h2 className="font-display text-base font-bold text-[#14181B] dark:text-[#E7ECEC] flex items-center gap-2">
            <Coffee className="w-5 h-5 text-[#D9551F] dark:text-[#FF7A47]" />
            <span>Daytime Naps ({format(parseISO(selectedDate + 'T12:00:00'), 'MMM d')})</span>
          </h2>
          <p className="text-xs text-[#6B655F] dark:text-[#98A6AD] mt-0.5 font-sans">
            Naps over {threshold} mins penalize tonight's quality score.
          </p>
        </div>

        <button
          onClick={onOpenAddNap}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] hover:border-[#D9551F] dark:hover:border-[#FF7A47] text-[#14181B] dark:text-[#E7ECEC] transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[#D9551F] dark:text-[#FF7A47]" />
          <span>Add Nap</span>
        </button>
      </div>

      {isOverThreshold && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Total nap time ({totalNapMins}m) exceeds {threshold}m threshold. Applied -{breakdown?.nap_penalty || 0}% score penalty.</span>
        </div>
      )}

      <div className="space-y-2">
        {naps.map((nap) => {
          const startD = new Date(nap.start_time);
          const endD = new Date(nap.end_time);
          return (
            <div
              key={nap.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] transition-all"
            >
              <div>
                <div className="flex items-center gap-2 font-mono text-sm font-bold text-[#14181B] dark:text-[#E7ECEC]">
                  <span>{format(startD, 'HH:mm')} - {format(endD, 'HH:mm')}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#2E9C82]/10 dark:bg-[#8FE0CE]/10 text-[#2E9C82] dark:text-[#8FE0CE] border border-[#2E9C82]/20 font-mono">
                    {nap.duration_minutes} mins
                  </span>
                </div>
                {nap.notes && (
                  <p className="text-xs text-[#6B655F] dark:text-[#98A6AD] mt-0.5 font-sans italic">"{nap.notes}"</p>
                )}
              </div>

              <button
                onClick={() => onDeleteNap(nap.id)}
                className="p-1.5 rounded-lg text-[#6B655F] dark:text-[#98A6AD] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}

        {naps.length === 0 && (
          <div className="py-6 text-center text-[#6B655F] dark:text-[#98A6AD] text-xs font-sans">
            No daytime naps logged for this date.
          </div>
        )}
      </div>
    </div>
  );
}
