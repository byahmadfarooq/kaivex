'use client';

import React from 'react';
import { Coffee, X } from 'lucide-react';

interface LogNapModalProps {
  isOpen: boolean;
  onClose: () => void;
  napStartTime: string;
  setNapStartTime: (val: string) => void;
  napEndTime: string;
  setNapEndTime: (val: string) => void;
  napNotes: string;
  setNapNotes: (val: string) => void;
  onSaveNap: (e: React.FormEvent) => void;
}

export default function LogNapModal({
  isOpen,
  onClose,
  napStartTime,
  setNapStartTime,
  napEndTime,
  setNapEndTime,
  napNotes,
  setNapNotes,
  onSaveNap,
}: LogNapModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#111622] border border-[#E2DDD5] dark:border-[#1E2738] shadow-2xl transition-colors rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2DDD5] dark:border-[#1E2738]">
          <h3 className="text-lg font-bold text-[#1C1917] dark:text-[#F8FAFC] flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-400" />
            <span>Log Daytime Nap</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-[#78716C] dark:text-[#94A3B8] hover:text-[#1C1917] dark:text-[#F8FAFC]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSaveNap} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] dark:text-[#94A3B8] mb-1.5">
                Start Time
              </label>
              <input
                type="time"
                required
                value={napStartTime}
                onChange={(e) => setNapStartTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#F5F2EB] dark:bg-[#090C11] border border-[#E2DDD5] dark:border-[#1E2738] text-[#1C1917] dark:text-[#F8FAFC] text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] dark:text-[#94A3B8] mb-1.5">
                End Time
              </label>
              <input
                type="time"
                required
                value={napEndTime}
                onChange={(e) => setNapEndTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#F5F2EB] dark:bg-[#090C11] border border-[#E2DDD5] dark:border-[#1E2738] text-[#1C1917] dark:text-[#F8FAFC] text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] dark:text-[#94A3B8] mb-1.5">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={napNotes}
              onChange={(e) => setNapNotes(e.target.value)}
              placeholder="Power nap, post-lunch recovery..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#F5F2EB] dark:bg-[#090C11] border border-[#E2DDD5] dark:border-[#1E2738] text-[#1C1917] dark:text-[#F8FAFC] text-sm placeholder-slate-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2DDD5] dark:border-[#1E2738]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#78716C] dark:text-[#94A3B8] hover:text-[#1C1917] dark:text-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-[#1E826C] dark:bg-[#2DD4BF] text-slate-950 font-bold shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              Save Nap
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}