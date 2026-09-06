'use client';

import React, { useState, useEffect } from 'react';
import {
  Download,
  Settings as SettingsIcon,
  Moon,
  Database,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { getSleepSettings, saveSleepSettings } from '@/lib/storage';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { SleepSettings } from '@/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SleepSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Supabase test connection state
  const [dbChecking, setDbChecking] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; message: string } | null>(null);

  useEffect(() => {
    async function init() {
      const s = await getSleepSettings();
      setSettings(s);
      checkSupabase();
    }
    init();
  }, []);

  const checkSupabase = async () => {
    setDbChecking(true);
    if (!isSupabaseConfigured() || !supabase) {
      setDbStatus({
        connected: false,
        message: 'Supabase credentials not yet provided in environment.',
      });
      setDbChecking(false);
      return;
    }

    try {
      const { error } = await supabase.from('users').select('id').limit(1);
      if (!error) {
        setDbStatus({
          connected: true,
          message: 'Connected to Supabase PostgreSQL cloud database successfully.',
        });
      } else if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
        setDbStatus({
          connected: true,
          message: 'Supabase connected! Tables not yet created. Run supabase/schema.sql in the Supabase SQL editor to create them.',
        });
      } else {
        setDbStatus({
          connected: false,
          message: `Supabase error: ${error.message}`,
        });
      }
    } catch (err: any) {
      setDbStatus({
        connected: false,
        message: `Connection failed: ${err?.message || 'Network error'}`,
      });
    } finally {
      setDbChecking(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      await saveSleepSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/export');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const today = new Date().toISOString().split('T')[0];
        a.download = `kaivex-export-${today}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <SettingsIcon className="w-6 h-6 text-cyan-400" />
          <span>System Settings & Data Management</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure sleep scoring algorithms, manage cloud database sync, and export personal data.
        </p>
      </div>

      {/* 1. DATA EXPORT CARD */}
      <div className="bg-[#0d131f]/80 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-cyan-400" />
              <span>Full Data Export</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Download your complete Kaivex personal data across all modules in standard JSON format.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-300 space-y-1">
            <p className="font-semibold text-white">Includes all entities:</p>
            <p className="text-slate-400">
              Habits, Habit Logs, Sleep Entries, Nap Entries, Running Sessions, Pipeline Leads, Tasks, and Settings.
            </p>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? 'Generating JSON...' : 'Download my data'}</span>
          </button>
        </div>
      </div>

      {/* 2. SLEEP ALGORITHM SETTINGS */}
      {settings && (
        <div className="bg-[#0d131f]/80 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Moon className="w-5 h-5 text-indigo-400" />
                <span>Sleep Quality Algorithm Constants</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                TRD Section 4 formula constants stored in sleep_settings (not hardcoded).
              </p>
            </div>

            {saveSuccess && (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Saved
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold uppercase text-slate-400 mb-1.5">
                  Target Bedtime (Default 22:00)
                </label>
                <input
                  type="time"
                  value={settings.target_bedtime}
                  onChange={(e) => setSettings({ ...settings, target_bedtime: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-400 mb-1.5">
                  Target Wake Time (Default 05:00)
                </label>
                <input
                  type="time"
                  value={settings.target_wake_time}
                  onChange={(e) => setSettings({ ...settings, target_wake_time: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold uppercase text-slate-400 mb-1.5">
                  Weight Duration (0.40)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={settings.weight_duration}
                  onChange={(e) =>
                    setSettings({ ...settings, weight_duration: parseFloat(e.target.value) })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-400 mb-1.5">
                  Weight Bedtime (0.30)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={settings.weight_bedtime}
                  onChange={(e) =>
                    setSettings({ ...settings, weight_bedtime: parseFloat(e.target.value) })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-400 mb-1.5">
                  Weight Wake Time (0.30)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={settings.weight_wake}
                  onChange={(e) =>
                    setSettings({ ...settings, weight_wake: parseFloat(e.target.value) })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold uppercase text-slate-400 mb-1.5">
                  Nap Threshold (Minutes, Default 60)
                </label>
                <input
                  type="number"
                  value={settings.nap_threshold_minutes}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      nap_threshold_minutes: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-400 mb-1.5">
                  Nap Penalty Per Minute (Default 0.5)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.nap_penalty_per_minute}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      nap_penalty_per_minute: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold uppercase text-slate-400 mb-1.5">
                  Late Nap Cutoff (Default 16:00 / 4 PM)
                </label>
                <input
                  type="time"
                  value={settings.nap_late_cutoff}
                  onChange={(e) =>
                    setSettings({ ...settings, nap_late_cutoff: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-400 mb-1.5">
                  Late Nap Penalty Multiplier (Default 1.5x)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.late_nap_penalty_factor}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      late_nap_penalty_factor: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving Settings...' : 'Save Algorithm Constants'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. SUPABASE CLOUD DATABASE CONNECTION */}
      <div className="bg-[#0d131f]/80 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              <span>PostgreSQL Cloud Database (Supabase)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Target: <code className="text-slate-300">https://hxswtcmnnpmiyzunfarv.supabase.co</code>
            </p>
          </div>

          <button
            onClick={checkSupabase}
            disabled={dbChecking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${dbChecking ? 'animate-spin' : ''}`} />
            <span>Test Connection</span>
          </button>
        </div>

        {dbStatus && (
          <div
            className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
              dbStatus.connected
                ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
            }`}
          >
            {dbStatus.connected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <div className="space-y-1">
              <p className="font-semibold">{dbStatus.message}</p>
              <p className="text-slate-400 text-[11px]">
                File <code className="text-slate-300">supabase/schema.sql</code> is prepared in this repository with all tables, constraints, indexes, and initial seeds.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4. PIN AUTH & SECURITY */}
      <div className="bg-[#0d131f]/80 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span>Authentication & Session Security</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              PIN-only gate per TRD Section 7.
            </p>
          </div>
        </div>

        <div className="space-y-2 text-xs text-slate-400">
          <p>
            • System is secured with PIN <strong className="text-white">6842</strong>.
          </p>
          <p>
            • Access generates a signed, encrypted <code className="text-slate-300">httpOnly</code> session cookie valid for 30 days on trusted devices.
          </p>
          <p>
            • No passwords, usernames, or third-party auth services required.
          </p>
        </div>
      </div>
    </div>
  );
}