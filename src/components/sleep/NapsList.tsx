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
  return (
    <div className="bg-[#0d131f]/80 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-400" />
            <span>Daytime Naps ({format(parseISO(selectedDate + 'T12:00:00'), 'MMM d')})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Total: <span className="font-semibold text-white">{totalNapMins} mins</span> · Threshold: {settings?.nap_threshold_minutes} mins
          </p>
        </div>

        <button
          onClick={onOpenAddNap}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log Nap</span>
        </button>
      </div>

      <div className="space-y-2">
        {naps.map((nap) => {
          const startD = new Date(nap.start_time);
          const endD = new Date(nap.end_time);
          const isLate = startD.getHours() >= 16;

          return (
            <div
              key={nap.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700/60 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
                  {nap.duration_minutes}m
                </div>
                <div>
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    <span>
                      {format(startD, 'hh:mm a')} – {format(endD, 'hh:mm a')}
                    </span>
                    {isLate && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950/50 text-rose-400 border border-rose-800/40 font-semibold">
                        Late Nap (1.5x penalty)
                      </span>
                    )}
                  </div>
                  {nap.notes && <p className="text-xs text-slate-400">{nap.notes}</p>}
                </div>
              </div>

              <button
                onClick={() => onDeleteNap(nap.id)}
                title="Delete nap"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}

        {naps.length === 0 && (
          <div className="py-8 text-center text-slate-500 text-xs">
            No naps logged for this date.
          </div>
        )}
      </div>

      {totalNapMins > (settings?.nap_threshold_minutes || 60) && (
        <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            Total nap duration ({totalNapMins}m) exceeds the {settings?.nap_threshold_minutes}m threshold. A{' '}
            {breakdown?.nap_penalty} point penalty applies to that night's sleep quality score.
          </span>
        </div>
      )}
    </div>
  );
}