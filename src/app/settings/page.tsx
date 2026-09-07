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
  Sparkles,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import {
  getSleepSettings,
  saveSleepSettings,
  loadSampleData,
  clearAllSampleData,
} from '@/lib/storage';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { SleepSettings } from '@/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SleepSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Sample data controls state
  const [sampleLoading, setSampleLoading] = useState(false);
  const [sampleStatus, setSampleStatus] = useState<{ success: boolean; message: string } | null>(null);

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

  const handleLoadSample = async () => {
    if (!confirm('Populate 14 days of realistic sample data across Habits, Sleep, Runs, Pipeline, and Tasks?')) {
      return;
    }
    setSampleLoading(true);
    setSampleStatus(null);
    try {
      const result = await loadSampleData();
      setSampleStatus(result);
      setTimeout(() => setSampleStatus(null), 6000);
    } catch (err: any) {
      setSampleStatus({ success: false, message: err.message || 'Error loading sample data' });
    } finally {
      setSampleLoading(false);
    }
  };

  const handleClearSample = async () => {
    if (!confirm('Clear all sample/test data and restore clean slate? This will reset logs, sleep history, runs, pipeline contacts, and tasks.')) {
      return;
    }
    setSampleLoading(true);
    setSampleStatus(null);
    try {
      const result = await clearAllSampleData();
      setSampleStatus(result);
      setTimeout(() => setSampleStatus(null), 6000);
    } catch (err: any) {
      setSampleStatus({ success: false, message: err.message || 'Error clearing sample data' });
    } finally {
      setSampleLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CFC3AB] dark:border-[#1D2830]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#14181B] dark:text-[#E7ECEC] flex items-center gap-3">
            <SettingsIcon className="w-7 h-7 text-[#D9551F] dark:text-[#FF7A47]" />
            <span>System Settings & Data Controls</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#6B655F] dark:text-[#98A6AD] mt-1 font-mono">
            Kaivex Systems • Dual-Surface Engine • Configuration & Data Storage
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E2DAC8] dark:bg-[#121A21] hover:bg-[#D6CDBC] dark:hover:bg-[#1D2830] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] text-xs font-semibold cursor-pointer disabled:opacity-50 transition-all self-start sm:self-auto shadow-sm"
        >
          <Download className="w-4 h-4 text-[#D9551F] dark:text-[#FF7A47]" />
          <span>{exporting ? 'Exporting...' : 'Export Complete JSON'}</span>
        </button>
      </div>

      {/* 1. SAMPLE / PREVIEW DATA CONTROLS (NEW FEATURE) */}
      <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-6 shadow-sm space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#CFC3AB] dark:border-[#1D2830] gap-2">
          <div>
            <h2 className="text-base font-display font-bold text-[#14181B] dark:text-[#E7ECEC] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D9551F] dark:text-[#FF7A47]" />
              <span>Preview / Sample Data Controls</span>
            </h2>
            <p className="text-xs text-[#6B655F] dark:text-[#98A6AD] mt-0.5">
              Instantly test the system with full realistic data, then wipe clean with one click when done.
            </p>
          </div>
          <span className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-[#EBE3D3] dark:bg-[#17222C] text-[#6B655F] dark:text-[#98A6AD] border border-[#CFC3AB] dark:border-[#1D2830] self-start sm:self-auto">
            Test & Validation Mode
          </span>
        </div>

        <p className="text-xs text-[#4A4540] dark:text-[#C2C9CA] leading-relaxed">
          Click <strong className="text-[#14181B] dark:text-[#E7ECEC]">Load Sample Data</strong> to populate 14 days of realistic logs for all 9 habits, 14 days of sleep entries, 6 running logs, 6 pipeline deals across all 5 stages, and weekly Kanban tasks. When you finish checking the system, click <strong className="text-rose-600 dark:text-rose-400">Clear All Sample Data</strong> to restore a pristine clean slate.
        </p>

        {sampleStatus && (
          <div
            className={`p-3.5 rounded-2xl border text-xs flex items-center gap-3 animate-fadeIn ${
              sampleStatus.success
                ? 'bg-emerald-500/10 border-emerald-600/30 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-500/10 border-rose-600/30 text-rose-800 dark:text-rose-300'
            }`}
          >
            {sampleStatus.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span className="font-semibold">{sampleStatus.message}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleLoadSample}
            disabled={sampleLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#D9551F] hover:bg-[#C24816] dark:bg-[#FF7A47] dark:hover:bg-[#FF8E61] text-white dark:text-[#0B0F14] font-bold text-xs shadow-md shadow-[#D9551F]/20 cursor-pointer disabled:opacity-50 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>{sampleLoading ? 'Processing...' : 'Load Sample Data (Preview System)'}</span>
          </button>

          <button
            type="button"
            onClick={handleClearSample}
            disabled={sampleLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-700 dark:text-rose-400 border border-rose-500/30 font-bold text-xs cursor-pointer disabled:opacity-50 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>{sampleLoading ? 'Processing...' : 'Clear All Sample Data (Restore Clean Slate)'}</span>
          </button>
        </div>
      </div>

      {/* 2. SLEEP ALGORITHM WEIGHTS */}
      {settings && (
        <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-6 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-[#CFC3AB] dark:border-[#1D2830]">
            <div>
              <h2 className="text-base font-display font-bold text-[#14181B] dark:text-[#E7ECEC] flex items-center gap-2">
                <Moon className="w-5 h-5 text-[#2E9C82] dark:text-[#8FE0CE]" />
                <span>Sleep Algorithm Constants (Section 2 TRD)</span>
              </h2>
              <p className="text-xs text-[#6B655F] dark:text-[#98A6AD] mt-0.5">
                Configure duration targets, bedtime/wake targets, and penalty factors.
              </p>
            </div>

            {saveSuccess && (
              <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Saved successfully!</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold uppercase text-[#6B655F] dark:text-[#98A6AD] mb-1.5 font-mono">
                  Target Bedtime (Default 22:00 / 10 PM)
                </label>
                <input
                  type="time"
                  value={settings.target_bedtime}
                  onChange={(e) =>
                    setSettings({ ...settings, target_bedtime: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] font-mono focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-[#6B655F] dark:text-[#98A6AD] mb-1.5 font-mono">
                  Target Wake Time (Default 05:00 / 5 AM)
                </label>
                <input
                  type="time"
                  value={settings.target_wake_time}
                  onChange={(e) =>
                    setSettings({ ...settings, target_wake_time: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] font-mono focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold uppercase text-[#6B655F] dark:text-[#98A6AD] mb-1.5 font-mono">
                  Weight: Duration (0.40)
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
                  className="w-full px-4 py-2.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] font-mono focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-[#6B655F] dark:text-[#98A6AD] mb-1.5 font-mono">
                  Weight: Bedtime (0.30)
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
                  className="w-full px-4 py-2.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] font-mono focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-[#6B655F] dark:text-[#98A6AD] mb-1.5 font-mono">
                  Weight: Wake Time (0.30)
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
                  className="w-full px-4 py-2.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] font-mono focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold uppercase text-[#6B655F] dark:text-[#98A6AD] mb-1.5 font-mono">
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
                  className="w-full px-4 py-2.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] font-mono focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-[#6B655F] dark:text-[#98A6AD] mb-1.5 font-mono">
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
                  className="w-full px-4 py-2.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] font-mono focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#D9551F] hover:bg-[#C24816] dark:bg-[#FF7A47] dark:hover:bg-[#FF8E61] text-white dark:text-[#0B0F14] font-bold text-xs shadow-md cursor-pointer disabled:opacity-50 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving Settings...' : 'Save Algorithm Constants'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3 & 4. CLOUD DATABASE & SECURITY (2-Column Grid on Wide Screens) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. SUPABASE CLOUD DATABASE CONNECTION */}
        <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-6 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-[#CFC3AB] dark:border-[#1D2830]">
            <div>
              <h2 className="text-base font-display font-bold text-[#14181B] dark:text-[#E7ECEC] flex items-center gap-2">
                <Database className="w-5 h-5 text-[#2E9C82] dark:text-[#8FE0CE]" />
                <span>PostgreSQL Cloud Database</span>
              </h2>
              <p className="text-xs text-[#6B655F] dark:text-[#98A6AD] mt-0.5 font-mono">
                Target: <code className="text-[#4A4540] dark:text-[#E7ECEC]">https://hxswtcmnnpmiyzunfarv.supabase.co</code>
              </p>
            </div>

            <button
              onClick={checkSupabase}
              disabled={dbChecking}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EBE3D3] dark:bg-[#17222C] hover:bg-[#D6CDBC] dark:hover:bg-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] text-xs font-semibold cursor-pointer disabled:opacity-50 border border-[#CFC3AB] dark:border-[#1D2830]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${dbChecking ? 'animate-spin' : ''}`} />
              <span>Test Connection</span>
            </button>
          </div>

          {dbStatus && (
            <div
              className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                dbStatus.connected
                  ? 'bg-emerald-500/10 border-emerald-600/30 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-500/10 border-amber-600/30 text-amber-800 dark:text-amber-300'
              }`}
            >
              {dbStatus.connected ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              )}
              <div className="space-y-1">
                <p className="font-semibold">{dbStatus.message}</p>
                <p className="text-[#6B655F] dark:text-[#98A6AD] text-[11px] font-mono">
                  File <code className="text-[#14181B] dark:text-[#E7ECEC]">supabase/schema.sql</code> is prepared with all tables, constraints, indexes, and initial seeds.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 4. PIN AUTH & SECURITY */}
        <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-6 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-[#CFC3AB] dark:border-[#1D2830]">
            <div>
              <h2 className="text-base font-display font-bold text-[#14181B] dark:text-[#E7ECEC] flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Authentication & Session Security</span>
              </h2>
              <p className="text-xs text-[#6B655F] dark:text-[#98A6AD] mt-0.5">
                PIN-only gate per TRD Section 7.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-[#4A4540] dark:text-[#C2C9CA]">
            <p>
              • System is secured with PIN <strong className="text-[#14181B] dark:text-[#E7ECEC] font-mono">6842</strong>.
            </p>
            <p>
              • Access generates a signed, encrypted <code className="font-mono text-[#D9551F] dark:text-[#FF7A47]">httpOnly</code> session cookie valid for 30 days on trusted devices.
            </p>
            <p>
              • Zero third-party telemetry, zero external login dependencies. Fast, offline-first.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
