'use client';

import React from 'react';
import { Settings, X, Sliders } from 'lucide-react';
import { SleepSettings } from '@/types';

interface SleepSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  editSettings: SleepSettings | null;
  setEditSettings: React.Dispatch<React.SetStateAction<SleepSettings | null>>;
  onSave: (e: React.FormEvent) => void;
}

export default function SleepSettingsModal({
  isOpen,
  onClose,
  editSettings,
  setEditSettings,
  onSave,
}: SleepSettingsModalProps) {
  if (!isOpen || !editSettings) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-[#CFC3AB]/60 dark:border-[#1D2830]">
          <h3 className="font-display text-lg font-bold text-[#14181B] dark:text-[#E7ECEC] flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#2E9C82] dark:text-[#8FE0CE]" />
            <span>Sleep Scoring Parameters</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#6B655F] dark:text-[#98A6AD] hover:text-[#14181B] dark:hover:text-[#E7ECEC]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4 text-xs font-sans">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1">
                Target Bedtime
              </label>
              <input
                type="time"
                value={editSettings.target_bedtime}
                onChange={(e) => setEditSettings({ ...editSettings, target_bedtime: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] font-mono text-sm focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1">
                Target Wake Time
              </label>
              <input
                type="time"
                value={editSettings.target_wake_time}
                onChange={(e) => setEditSettings({ ...editSettings, target_wake_time: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] font-mono text-sm focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1">
                Nap Threshold (min)
              </label>
              <input
                type="number"
                value={editSettings.nap_threshold_minutes}
                onChange={(e) => setEditSettings({ ...editSettings, nap_threshold_minutes: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] font-mono text-sm focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1">
                Nap Penalty Rate (% / min)
              </label>
              <input
                type="number"
                step="0.1"
                value={editSettings.nap_penalty_per_minute}
                onChange={(e) => setEditSettings({ ...editSettings, nap_penalty_per_minute: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] font-mono text-sm focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
              />
            </div>
          </div>

          <div className="border-t border-[#CFC3AB]/60 dark:border-[#1D2830] pt-3">
            <h4 className="font-bold text-[#14181B] dark:text-[#E7ECEC] mb-2 font-display">Score Weights (Must Sum to 1.0)</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-[#6B655F] dark:text-[#98A6AD] mb-1">Duration Weight</label>
                <input
                  type="number"
                  step="0.05"
                  value={editSettings.weight_duration}
                  onChange={(e) => setEditSettings({ ...editSettings, weight_duration: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] font-mono text-xs focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#6B655F] dark:text-[#98A6AD] mb-1">Bedtime Weight</label>
                <input
                  type="number"
                  step="0.05"
                  value={editSettings.weight_bedtime}
                  onChange={(e) => setEditSettings({ ...editSettings, weight_bedtime: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] font-mono text-xs focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#6B655F] dark:text-[#98A6AD] mb-1">Wake Weight</label>
                <input
                  type="number"
                  step="0.05"
                  value={editSettings.weight_wake}
                  onChange={(e) => setEditSettings({ ...editSettings, weight_wake: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] font-mono text-xs focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
                />
              </div>
            </div>
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
              Save Parameters
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
