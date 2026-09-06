'use client';

import React from 'react';
import { Settings as SettingsIcon, X } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0d131f] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-cyan-400" />
            <span>Sleep Quality Algorithm Settings</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase text-slate-400 mb-1">
                Target Bedtime
              </label>
              <input
                type="time"
                value={editSettings.target_bedtime}
                onChange={(e) =>
                  setEditSettings({ ...editSettings, target_bedtime: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase text-slate-400 mb-1">
                Target Wake Time
              </label>
              <input
                type="time"
                value={editSettings.target_wake_time}
                onChange={(e) =>
                  setEditSettings({ ...editSettings, target_wake_time: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold uppercase text-slate-400 mb-1">
                Weight Duration
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={editSettings.weight_duration}
                onChange={(e) =>
                  setEditSettings({ ...editSettings, weight_duration: parseFloat(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase text-slate-400 mb-1">
                Weight Bedtime
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={editSettings.weight_bedtime}
                onChange={(e) =>
                  setEditSettings({ ...editSettings, weight_bedtime: parseFloat(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase text-slate-400 mb-1">
                Weight Wake
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={editSettings.weight_wake}
                onChange={(e) =>
                  setEditSettings({ ...editSettings, weight_wake: parseFloat(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase text-slate-400 mb-1">
                Nap Threshold (Mins)
              </label>
              <input
                type="number"
                value={editSettings.nap_threshold_minutes}
                onChange={(e) =>
                  setEditSettings({
                    ...editSettings,
                    nap_threshold_minutes: parseInt(e.target.value, 10),
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase text-slate-400 mb-1">
                Penalty / Min Over
              </label>
              <input
                type="number"
                step="0.1"
                value={editSettings.nap_penalty_per_minute}
                onChange={(e) =>
                  setEditSettings({
                    ...editSettings,
                    nap_penalty_per_minute: parseFloat(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase text-slate-400 mb-1">
                Late Nap Cutoff
              </label>
              <input
                type="time"
                value={editSettings.nap_late_cutoff}
                onChange={(e) =>
                  setEditSettings({ ...editSettings, nap_late_cutoff: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase text-slate-400 mb-1">
                Late Nap Multiplier
              </label>
              <input
                type="number"
                step="0.1"
                value={editSettings.late_nap_penalty_factor}
                onChange={(e) =>
                  setEditSettings({
                    ...editSettings,
                    late_nap_penalty_factor: parseFloat(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}