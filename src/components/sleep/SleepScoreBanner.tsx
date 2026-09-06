'use client';

import React from 'react';
import { Sparkles, Clock, Sun, Coffee } from 'lucide-react';
import { SleepQualityBreakdown, SleepSettings, SleepEntry } from '@/types';

interface SleepScoreBannerProps {
  breakdown: SleepQualityBreakdown | null;
  settings: SleepSettings | null;
  sleepEntry: SleepEntry | null;
  totalNapMins: number;
}

export default function SleepScoreBanner({
  breakdown,
  settings,
  sleepEntry,
  totalNapMins,
}: SleepScoreBannerProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Quality Score */}
      <div className="bg-white dark:bg-[#111622] border border-[#E2DDD5] dark:border-[#1E2738] shadow-sm dark:shadow-xl transition-colors rounded-3xl p-5 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#78716C] dark:text-[#94A3B8]">Quality Score</span>
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
        </div>

        <div className="my-2">
          <div className="flex items-baseline gap-1">
            <span
              className={`text-4xl font-extrabold ${
                (breakdown?.final_quality_score || 0) >= 80
                  ? 'text-emerald-400'
                  : (breakdown?.final_quality_score || 0) >= 60
                  ? 'text-[#1E826C] dark:text-[#2DD4BF]'
                  : 'text-amber-400'
              }`}
            >
              {breakdown ? breakdown.final_quality_score : '—'}
            </span>
            <span className="text-sm font-semibold text-[#78716C] dark:text-[#64748B]">%</span>
          </div>
          <p className="text-xs text-[#78716C] dark:text-[#94A3B8] mt-1">
            {sleepEntry ? 'Saved & Evaluated' : 'Calculated Live Preview'}
          </p>
        </div>

        <div className="text-[11px] text-[#78716C] dark:text-[#64748B] pt-2 border-t border-[#E2DDD5] dark:border-[#1E2738]">
          Target: {settings?.target_bedtime} → {settings?.target_wake_time} ({settings ? Math.round((breakdown?.target_duration_minutes || 420) / 60) : 7} hrs)
        </div>
      </div>

      {/* Duration Score */}
      <div className="bg-white dark:bg-[#111622] border border-[#E2DDD5] dark:border-[#1E2738] shadow-sm dark:shadow-xl transition-colors rounded-3xl p-5 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#78716C] dark:text-[#94A3B8]">Duration Score</span>
          <Clock className="w-4 h-4 text-[#1E826C] dark:text-[#2DD4BF]" />
        </div>

        <div className="my-2">
          <div className="text-2xl font-bold text-[#1C1917] dark:text-[#F8FAFC]">
            {breakdown ? Math.floor(breakdown.duration_minutes / 60) : 0}h {breakdown ? breakdown.duration_minutes % 60 : 0}m
          </div>
          <p className="text-xs text-[#1E826C] dark:text-[#2DD4BF] font-semibold mt-0.5">
            Score: {breakdown?.duration_score}% ({Math.round((settings?.weight_duration || 0.4) * 100)}% weight)
          </p>
        </div>

        <div className="w-full bg-[#E2DDD5] dark:bg-[#1E2738] h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#1E826C] dark:bg-[#2DD4BF] h-full rounded-full transition-all"
            style={{ width: `${breakdown?.duration_score || 0}%` }}
          />
        </div>
      </div>

      {/* Circadian Timing */}
      <div className="bg-white dark:bg-[#111622] border border-[#E2DDD5] dark:border-[#1E2738] shadow-sm dark:shadow-xl transition-colors rounded-3xl p-5 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#78716C] dark:text-[#94A3B8]">Circadian Timing</span>
          <Sun className="w-4 h-4 text-amber-400" />
        </div>

        <div className="my-2 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#78716C] dark:text-[#94A3B8]">Bedtime Score:</span>
            <span className="font-bold text-[#1C1917] dark:text-[#F8FAFC]">{breakdown?.bedtime_score}%</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#78716C] dark:text-[#94A3B8]">Wake Score:</span>
            <span className="font-bold text-[#1C1917] dark:text-[#F8FAFC]">{breakdown?.wake_score}%</span>
          </div>
        </div>

        <div className="text-[11px] text-[#78716C] dark:text-[#64748B] pt-2 border-t border-[#E2DDD5] dark:border-[#1E2738]">
          Bedtime diff: {breakdown?.bedtime_diff_minutes}m · Wake diff: {breakdown?.wake_diff_minutes}m
        </div>
      </div>

      {/* Nap Penalty */}
      <div className="bg-white dark:bg-[#111622] border border-[#E2DDD5] dark:border-[#1E2738] shadow-sm dark:shadow-xl transition-colors rounded-3xl p-5 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#78716C] dark:text-[#94A3B8]">Nap Penalty</span>
          <Coffee className="w-4 h-4 text-rose-400" />
        </div>

        <div className="my-2">
          <div className="text-2xl font-bold text-[#1C1917] dark:text-[#F8FAFC]">
            {breakdown && breakdown.nap_penalty > 0 ? (
              <span className="text-rose-400">-{breakdown.nap_penalty} pts</span>
            ) : (
              <span className="text-emerald-400">0 pts (No penalty)</span>
            )}
          </div>
          <p className="text-xs text-[#78716C] dark:text-[#94A3B8] mt-0.5">
            Day's total naps: <span className="text-[#1C1917] dark:text-[#F8FAFC] font-semibold">{totalNapMins} mins</span>
          </p>
        </div>

        <div className="text-[11px] text-[#78716C] dark:text-[#64748B] pt-2 border-t border-[#E2DDD5] dark:border-[#1E2738]">
          Threshold: {settings?.nap_threshold_minutes}m {breakdown?.is_late_nap ? '· Late nap multiplier 1.5x' : ''}
        </div>
      </div>
    </div>
  );
}