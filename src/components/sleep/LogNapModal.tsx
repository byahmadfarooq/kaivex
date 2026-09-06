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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-6 shadow-2xl space-y-4 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-[#CFC3AB]/60 dark:border-[#1D2830]">
          <h3 className="font-display text-lg font-bold text-[#14181B] dark:text-[#E7ECEC] flex items-center gap-2">
            <Coffee className="w-5 h-5 text-[#D9551F] dark:text-[#FF7A47]" />
            <span>Log Daytime Nap</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#6B655F] dark:text-[#98A6AD] hover:text-[#14181B] dark:hover:text-[#E7ECEC]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSaveNap} className="space-y-4 text-xs font-sans">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1.5">
                Start Time
              </label>
              <input
                type="time"
                required
                value={napStartTime}
                onChange={(e) => setNapStartTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] font-mono text-sm focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1.5">
                End Time
              </label>
              <input
                type="time"
                required
                value={napEndTime}
                onChange={(e) => setNapEndTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] font-mono text-sm focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1.5">
              Nap Notes & Environment
            </label>
            <textarea
              value={napNotes}
              onChange={(e) => setNapNotes(e.target.value)}
              placeholder="e.g. 20-min power nap with eye mask, woke up refreshed"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] placeholder-[#6B655F]/60 dark:placeholder-[#98A6AD]/50 focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#CFC3AB]/60 dark:border-[#1D2830]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-bold text-[#6B655F] dark:text-[#98A6AD] hover:text-[#14181B] dark:hover:text-[#E7ECEC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-bold bg-[#D9551F] hover:bg-[#B84214] dark:bg-[#FF7A47] dark:hover:bg-[#FF9066] text-white dark:text-[#0B0F14] shadow transition-all cursor-pointer"
            >
              Save Nap Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
