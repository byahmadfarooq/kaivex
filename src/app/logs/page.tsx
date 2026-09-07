'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDate } from '@/context/DateContext';
import DateSelector from '@/components/DateSelector';
import {
  getDailyLogs,
  saveDailyLog,
  deleteDailyLog,
  getDailySummary,
  saveDailySummary,
} from '@/lib/storage';
import { DailyLogEntry, DailySummary, LogCategory } from '@/types';
import {
  ListPlus,
  Clock,
  Send,
  Trash2,
  Edit2,
  Copy,
  Check,
  Sparkles,
  Sunrise,
  Activity,
  Flame,
  HeartPulse,
  Coffee,
  BookOpen,
  HelpCircle,
  Star,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Download,
  Filter,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const CATEGORIES: { id: LogCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'wake', label: 'Wake-Up', icon: Sunrise },
  { id: 'focus', label: 'Deep Work', icon: Flame },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'mood', label: 'Mood / Energy', icon: HeartPulse },
  { id: 'meal', label: 'Nutrition', icon: Coffee },
  { id: 'reflection', label: 'Reflection', icon: BookOpen },
  { id: 'general', label: 'General', icon: ListPlus },
];

const MOOD_LEVELS = [
  { val: 1, label: '1 - Low / Drained', color: 'text-rose-500' },
  { val: 2, label: '2 - Sluggish', color: 'text-amber-500' },
  { val: 3, label: '3 - Steady / Neutral', color: 'text-[#6B655F] dark:text-[#98A6AD]' },
  { val: 4, label: '4 - High Energy', color: 'text-[#2E9C82] dark:text-[#8FE0CE]' },
  { val: 5, label: '5 - Peak Flow State', color: 'text-[#D9551F] dark:text-[#FF7A47]' },
];

export default function LogsPage() {
  const { selectedDate } = useDate();

  const [logs, setLogs] = useState<DailyLogEntry[]>([]);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);

  // New Log input state
  const [content, setContent] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState<LogCategory>('general');
  const [moodEnergy, setMoodEnergy] = useState<number | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  // Summary form state
  const [keyWin, setKeyWin] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [dayRating, setDayRating] = useState<number>(5);
  const [savingSummary, setSavingSummary] = useState(false);
  const [copiedDigest, setCopiedDigest] = useState(false);
  const [summarySavedNotice, setSummarySavedNotice] = useState(false);

  // Category filter state
  const [filterCategory, setFilterCategory] = useState<LogCategory | 'all'>('all');

  // Helper to get current local time string "HH:mm"
  const getCurrentTimeStr = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  useEffect(() => {
    setTime(getCurrentTimeStr());
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedLogs, fetchedSummary] = await Promise.all([
        getDailyLogs(selectedDate),
        getDailySummary(selectedDate),
      ]);
      setLogs(fetchedLogs);
      setSummary(fetchedSummary);

      if (fetchedSummary) {
        setKeyWin(fetchedSummary.key_win || '');
        setLessonsLearned(fetchedSummary.lessons_learned || '');
        setDayRating(fetchedSummary.day_rating || 5);
      } else {
        setKeyWin('');
        setLessonsLearned('');
        setDayRating(5);
      }
    } catch (err) {
      console.error('Error loading daily logs:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute active day span (from first log to last log)
  const daySpan = useMemo(() => {
    if (logs.length === 0) return null;
    const sorted = [...logs].sort((a, b) => a.time.localeCompare(b.time));
    const first = sorted[0].time;
    const last = sorted[sorted.length - 1].time;

    const [h1, m1] = first.split(':').map(Number);
    const [h2, m2] = last.split(':').map(Number);
    let diffMins = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diffMins < 0) diffMins += 24 * 60;

    const spanHours = Math.floor(diffMins / 60);
    const spanMins = diffMins % 60;

    return {
      first,
      last,
      duration: `${spanHours}h ${spanMins}m active span`,
    };
  }, [logs]);

  // Handle add / edit log
  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const entryTime = time.trim() || getCurrentTimeStr();

    await saveDailyLog({
      id: editingLogId || undefined,
      user_id: '00000000-0000-0000-0000-000000000001',
      date: selectedDate,
      time: entryTime,
      timestamp: `${selectedDate}T${entryTime}:00.000Z`,
      content: content.trim(),
      category,
      mood_energy: moodEnergy,
    });

    setContent('');
    setTime(getCurrentTimeStr());
    setCategory('general');
    setMoodEnergy(null);
    setEditingLogId(null);
    await loadData();
  };

  const handleEditClick = (log: DailyLogEntry) => {
    setEditingLogId(log.id);
    setContent(log.content);
    setTime(log.time);
    setCategory(log.category);
    setMoodEnergy(log.mood_energy || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (id: string) => {
    if (confirm('Delete this log entry?')) {
      await deleteDailyLog(id);
      loadData();
    }
  };

  // Compile full day text digest with explicit Log 1, Log 2 numbering
  const compiledDigestText = useMemo(() => {
    const lines: string[] = [];
    const dateFormatted = format(parseISO(selectedDate + 'T12:00:00'), 'EEEE, MMMM d, yyyy');
    lines.push(`### Kaivex Daily Executive Digest — ${dateFormatted}`);
    lines.push(`Total Logs: ${logs.length} | ${daySpan ? daySpan.duration : '0h active span'}`);
    lines.push('');
    lines.push('#### Chronological Stream');

    logs.forEach((l, idx) => {
      const moodStr = l.mood_energy ? ` [⚡ Energy: ${l.mood_energy}/5]` : '';
      lines.push(`- **Log ${idx + 1} [${l.time}]** (${l.category.toUpperCase()}): ${l.content}${moodStr}`);
    });

    if (keyWin || lessonsLearned || dayRating) {
      lines.push('');
      lines.push('#### End-of-Day Synthesis');
      if (keyWin) {
        lines.push(`- **Key Win Today:** ${keyWin}`);
      }
      if (lessonsLearned) {
        lines.push(`- **Lessons / Adjustments:** ${lessonsLearned}`);
      }
      if (dayRating) {
        lines.push(`- **Overall Day Rating:** ${'★'.repeat(dayRating)}${'☆'.repeat(5 - dayRating)} (${dayRating} / 5 Stars)`);
      }
    }

    return lines.join('\n');
  }, [selectedDate, logs, daySpan, keyWin, lessonsLearned, dayRating]);

  // Handle Save End-of-Day Summary
  const handleSaveSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSummary(true);
    try {
      await saveDailySummary({
        id: summary?.id,
        user_id: '00000000-0000-0000-0000-000000000001',
        date: selectedDate,
        key_win: keyWin.trim() || null,
        lessons_learned: lessonsLearned.trim() || null,
        day_rating: dayRating,
        compiled_digest: compiledDigestText,
      });

      setSummarySavedNotice(true);
      setTimeout(() => setSummarySavedNotice(false), 3500);
      await loadData();
    } catch (err) {
      console.error('Error saving summary:', err);
    } finally {
      setSavingSummary(false);
    }
  };

  const handleCopyDigest = async () => {
    try {
      await navigator.clipboard.writeText(compiledDigestText);
      setCopiedDigest(true);
      setTimeout(() => setCopiedDigest(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleDownloadDigest = () => {
    const blob = new Blob([compiledDigestText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kaivex-digest-${selectedDate}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const editingLogIndex = editingLogId ? logs.findIndex((l) => l.id === editingLogId) : -1;

  const displayedLogs = useMemo(() => {
    if (filterCategory === 'all') return logs;
    return logs.filter((l) => l.category === filterCategory);
  }, [logs, filterCategory]);

  const getCategoryColor = (cat: LogCategory) => {
    switch (cat) {
      case 'wake':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'focus':
        return 'bg-[#D9551F]/15 text-[#D9551F] dark:text-[#FF7A47] border-[#D9551F]/30';
      case 'activity':
        return 'bg-[#2E9C82]/15 text-[#2E9C82] dark:text-[#8FE0CE] border-[#2E9C82]/30';
      case 'mood':
        return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 'meal':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'reflection':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
      default:
        return 'bg-[#6B655F]/15 text-[#6B655F] dark:text-[#98A6AD] border-[#6B655F]/30';
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#14181B] dark:text-[#E7ECEC] flex items-center gap-3">
            <ListPlus className="w-6 h-6 text-[#D9551F] dark:text-[#FF7A47]" />
            <span>Daily Micro-Logs & Timeline</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#6B655F] dark:text-[#98A6AD] mt-1 font-mono">
            {format(parseISO(selectedDate + 'T12:00:00'), 'EEEE, MMMM d, yyyy')} • Stream & Day Debrief
          </p>
        </div>

        {daySpan && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] text-xs font-mono text-[#6B655F] dark:text-[#98A6AD]">
            <Clock className="w-3.5 h-3.5 text-[#2E9C82] dark:text-[#8FE0CE]" />
            <span>{daySpan.first} → {daySpan.last}</span>
            <span className="font-bold text-[#14181B] dark:text-[#E7ECEC]">({daySpan.duration})</span>
          </div>
        )}
      </div>

      <DateSelector />

      {/* Quick Add Stream Logger Card */}
      <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-6 shadow-sm space-y-4 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-[#CFC3AB]/60 dark:border-[#1D2830]">
          <h2 className="text-sm font-display font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D9551F] dark:text-[#FF7A47]" />
            <span>{editingLogIndex >= 0 ? `Edit Log #${editingLogIndex + 1}` : `Record Log #${logs.length + 1}`}</span>
          </h2>
          {editingLogId && (
            <button
              onClick={() => {
                setEditingLogId(null);
                setContent('');
                setTime(getCurrentTimeStr());
              }}
              className="text-xs text-[#6B655F] dark:text-[#98A6AD] hover:underline font-mono"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSaveLog} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Time Input */}
            <div className="w-full sm:w-28 flex-shrink-0">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1 font-mono">
                Time
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="HH:mm"
                className="w-full px-3 py-2 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] font-mono text-sm focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
              />
            </div>

            {/* Content Input */}
            <div className="flex-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1 font-mono">
                {editingLogIndex >= 0 ? `Edit Content for Log #${editingLogIndex + 1}` : `Log #${logs.length + 1} — What are you doing or feeling?`}
              </label>
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  editingLogIndex >= 0
                    ? 'Update log entry...'
                    : `e.g. Log #${logs.length + 1}: Woke up at 5:00 AM, cold plunge done • Deep work session started • Energy peak`
                }
                className="w-full px-4 py-2 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] text-sm focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
                autoFocus
              />
            </div>

            {/* Submit Button */}
            <div className="self-end">
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#D9551F] hover:bg-[#C24816] dark:bg-[#FF7A47] dark:hover:bg-[#FF8E61] text-white dark:text-[#0B0F14] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <Send className="w-4 h-4" />
                <span>{editingLogIndex >= 0 ? 'Update Log' : `Save Log #${logs.length + 1}`}</span>
              </button>
            </div>
          </div>

          {/* Category & Mood Selectors */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#CFC3AB]/40 dark:border-[#1D2830]/40">
            {/* Category Selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mr-1">
                Category:
              </span>
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#14181B] dark:bg-[#E7ECEC] text-white dark:text-[#0B0F14] border-transparent font-bold shadow-sm'
                        : 'bg-[#EBE3D3] dark:bg-[#0B0F14] text-[#6B655F] dark:text-[#98A6AD] border-[#CFC3AB] dark:border-[#1D2830] hover:text-[#14181B] dark:hover:text-[#E7ECEC]'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Energy / Mood Rating Scale */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mr-1">
                Energy:
              </span>
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setMoodEnergy(moodEnergy === lvl ? null : lvl)}
                  className={`w-7 h-7 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer flex items-center justify-center ${
                    moodEnergy === lvl
                      ? 'bg-[#D9551F] dark:bg-[#FF7A47] text-white dark:text-[#0B0F14] border-transparent scale-105 shadow-sm'
                      : 'bg-[#EBE3D3] dark:bg-[#0B0F14] text-[#6B655F] dark:text-[#98A6AD] border-[#CFC3AB] dark:border-[#1D2830] hover:border-[#D9551F]'
                  }`}
                  title={MOOD_LEVELS[lvl - 1].label}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* Main 2-Column: Left = Stream Timeline | Right = End-of-Day Compiled Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Timeline Stream (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#CFC3AB]/60 dark:border-[#1D2830]">
            <h2 className="text-base font-display font-bold text-[#14181B] dark:text-[#E7ECEC] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#2E9C82] dark:text-[#8FE0CE]" />
              <span>Day Stream Timeline</span>
            </h2>
            <span className="text-xs font-mono text-[#6B655F] dark:text-[#98A6AD]">
              {logs.length} total logs
            </span>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1 rounded-xl font-mono text-xs transition-all cursor-pointer whitespace-nowrap ${
                filterCategory === 'all'
                  ? 'bg-[#14181B] dark:bg-[#E7ECEC] text-white dark:text-[#0B0F14] font-bold shadow-sm'
                  : 'bg-[#EBE3D3] dark:bg-[#0B0F14] text-[#6B655F] dark:text-[#98A6AD] border border-[#CFC3AB] dark:border-[#1D2830]'
              }`}
            >
              All ({logs.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = logs.filter((l) => l.category === cat.id).length;
              if (count === 0 && filterCategory !== cat.id) return null;
              return (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-xl font-mono text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    filterCategory === cat.id
                      ? 'bg-[#D9551F] dark:bg-[#FF7A47] text-white dark:text-[#0B0F14] font-bold shadow-sm'
                      : 'bg-[#EBE3D3] dark:bg-[#0B0F14] text-[#6B655F] dark:text-[#98A6AD] border border-[#CFC3AB] dark:border-[#1D2830]'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className="opacity-70 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Chronological Vertical Timeline */}
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-[2px] before:bg-[#CFC3AB] dark:before:bg-[#1D2830]">
            {displayedLogs.map((log) => {
              const catObj = CATEGORIES.find((c) => c.id === log.category) || CATEGORIES[6];
              const CatIcon = catObj.icon;
              const logNumber = logs.findIndex((l) => l.id === log.id) + 1;

              return (
                <div key={log.id} className="relative group">
                  {/* Timeline node */}
                  <div className="absolute -left-6 top-3.5 w-5 h-5 rounded-full bg-[#E2DAC8] dark:bg-[#121A21] border-2 border-[#D9551F] dark:border-[#FF7A47] flex items-center justify-center z-10 group-hover:scale-125 transition-transform">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#D9551F] dark:bg-[#FF7A47]" />
                  </div>

                  {/* Log Card */}
                  <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] hover:border-[#D9551F] dark:hover:border-[#FF7A47] rounded-2xl p-4 transition-all shadow-sm space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Prominent Log Number Badge */}
                        <span className="px-2.5 py-0.5 rounded-lg bg-[#D9551F]/15 dark:bg-[#FF7A47]/20 border border-[#D9551F]/30 dark:border-[#FF7A47]/30 font-mono text-xs font-bold text-[#D9551F] dark:text-[#FF7A47] tracking-wider">
                          LOG #{logNumber}
                        </span>

                        {/* Time badge */}
                        <span className="px-2 py-0.5 rounded-md bg-[#DDD5C3] dark:bg-[#17222C] font-mono text-xs font-bold text-[#14181B] dark:text-[#E7ECEC]">
                          {log.time}
                        </span>

                        {/* Category badge */}
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${getCategoryColor(log.category)}`}>
                          <CatIcon className="w-3 h-3" />
                          <span>{catObj.label}</span>
                        </span>

                        {/* Mood / Energy */}
                        {log.mood_energy && (
                          <span className="text-[11px] font-mono font-semibold text-[#6B655F] dark:text-[#98A6AD] flex items-center gap-1">
                            <span>⚡ {log.mood_energy}/5</span>
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditClick(log)}
                          className="p-1 rounded-md text-[#6B655F] dark:text-[#98A6AD] hover:text-[#14181B] dark:hover:text-[#E7ECEC] hover:bg-[#CFC3AB]/30 dark:hover:bg-[#1D2830] transition-colors"
                          title={`Edit Log #${logNumber}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(log.id)}
                          className="p-1 rounded-md text-[#6B655F] dark:text-[#98A6AD] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title={`Delete Log #${logNumber}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-[#14181B] dark:text-[#E7ECEC] leading-relaxed font-sans select-text">
                      {log.content}
                    </p>
                  </div>
                </div>
              );
            })}

            {displayedLogs.length === 0 && !loading && (
              <div className="py-12 text-center space-y-2 bg-[#E2DAC8]/50 dark:bg-[#121A21]/50 border border-dashed border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-6 font-mono text-xs text-[#6B655F] dark:text-[#98A6AD]">
                <p>No stream logs matching this view for this date.</p>
                <p className="text-[11px] opacity-70">
                  Use the quick-logger above to post what you are doing, or load sample data in Settings!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: End-of-Day Compiled Summary & Debrief (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-6 shadow-sm space-y-5 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-[#CFC3AB]/60 dark:border-[#1D2830]">
              <h2 className="text-base font-display font-bold text-[#14181B] dark:text-[#E7ECEC] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#D9551F] dark:text-[#FF7A47]" />
                <span>End-of-Day Compiled Summary</span>
              </h2>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleDownloadDigest}
                  title="Download Day Report as Markdown"
                  className="flex items-center gap-1 text-xs font-mono font-semibold px-2.5 py-1 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] hover:text-[#2E9C82] dark:hover:text-[#8FE0CE] transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button
                  onClick={handleCopyDigest}
                  title="Copy entire day digest as Markdown"
                  className="flex items-center gap-1 text-xs font-mono font-semibold px-2.5 py-1 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] hover:text-[#D9551F] dark:hover:text-[#FF7A47] transition-all cursor-pointer"
                >
                  {copiedDigest ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#2E9C82] dark:text-[#8FE0CE]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Auto-Compiled Digest Preview */}
            <div>
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-mono font-bold text-[#6B655F] dark:text-[#98A6AD] mb-1.5">
                <span>Automated Timeline Digest</span>
                <span>{logs.length} events compiled</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] max-h-48 overflow-y-auto space-y-1.5 font-mono text-xs text-[#4A4540] dark:text-[#C2C9CA] select-text">
                {logs.length > 0 ? (
                  logs.map((l, idx) => (
                    <div key={l.id} className="leading-snug flex items-start gap-1">
                      <span className="font-bold text-[#D9551F] dark:text-[#FF7A47] whitespace-nowrap">Log #{idx + 1} [{l.time}]:</span>{' '}
                      <span>{l.content}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-[#6B655F] dark:text-[#98A6AD] italic">
                    Log moments during the day to generate the automated summary.
                  </span>
                )}
              </div>
            </div>

            {/* Daily Synthesis Form */}
            <form onSubmit={handleSaveSummary} className="space-y-4 pt-3 border-t border-[#CFC3AB]/60 dark:border-[#1D2830]">
              {/* Day Rating */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1.5 font-mono">
                  Overall Day Rating (1–5)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setDayRating(star)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        dayRating >= star
                          ? 'bg-[#D9551F]/15 dark:bg-[#FF7A47]/20 border-[#D9551F]/30 dark:border-[#FF7A47]/40 text-[#D9551F] dark:text-[#FF7A47]'
                          : 'bg-[#EBE3D3] dark:bg-[#0B0F14] border-[#CFC3AB] dark:border-[#1D2830] text-[#6B655F] dark:text-[#98A6AD]'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${dayRating >= star ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                  <span className="text-xs font-mono font-bold text-[#14181B] dark:text-[#E7ECEC] ml-2">
                    {dayRating} / 5 Stars
                  </span>
                </div>
              </div>

              {/* Key Win Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1.5 font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#D9551F] dark:text-[#FF7A47]" />
                  <span>Key Win Today</span>
                </label>
                <textarea
                  rows={2}
                  value={keyWin}
                  onChange={(e) => setKeyWin(e.target.value)}
                  placeholder="What was your main achievement or breakthrough today?"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] text-xs focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
                />
              </div>

              {/* Lessons / Adjustments Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1.5 font-mono flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#2E9C82] dark:text-[#8FE0CE]" />
                  <span>Lessons & Tomorrow's Adjustments</span>
                </label>
                <textarea
                  rows={2}
                  value={lessonsLearned}
                  onChange={(e) => setLessonsLearned(e.target.value)}
                  placeholder="What friction occurred, and what one adjustment will you make tomorrow?"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] text-xs focus:outline-none focus:border-[#2E9C82] dark:focus:border-[#8FE0CE]"
                />
              </div>

              {/* Save Summary Button & Notice */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingSummary}
                  className="px-5 py-2.5 rounded-xl bg-[#2E9C82] hover:bg-[#25826C] text-white dark:bg-[#8FE0CE] dark:hover:bg-[#7ED1BF] dark:text-[#0B0F14] font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{savingSummary ? 'Saving Summary...' : 'Save Day Debrief'}</span>
                </button>

                {summarySavedNotice && (
                  <span className="text-xs font-mono text-[#2E9C82] dark:text-[#8FE0CE] flex items-center gap-1 animate-fadeIn font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Summary Saved!</span>
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
