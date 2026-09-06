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
  const score = breakdown?.final_quality_score || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Quality Score */}
      <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD]">Quality Score</span>
          <div className="w-7 h-7 rounded-lg bg-[#2E9C82]/10 dark:bg-[#8FE0CE]/10 border border-[#2E9C82]/20 dark:border-[#8FE0CE]/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#2E9C82] dark:text-[#8FE0CE]" />
          </div>
        </div>

        <div className="my-2">
          <div className="flex items-baseline gap-1">
            <span
              className={`font-mono text-4xl font-extrabold ${
                score >= 80
                  ? 'text-[#2E9C82] dark:text-[#8FE0CE]'
                  : score >= 60
                  ? 'text-[#D9551F] dark:text-[#FF7A47]'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {breakdown ? breakdown.final_quality_score : '--'}
            </span>
            <span className="text-sm font-semibold text-[#6B655F] dark:text-[#98A6AD] font-mono">%</span>
          </div>
          <p className="text-xs text-[#6B655F] dark:text-[#98A6AD] mt-1 font-sans">
            {sleepEntry ? 'Saved & Evaluated' : 'Calculated Live Preview'}
          </p>
        </div>

        <div className="text-[11px] text-[#6B655F] dark:text-[#98A6AD] pt-2 border-t border-[#CFC3AB]/60 dark:border-[#1D2830] font-mono">
          Target: {settings?.target_bedtime || '22:00'} → {settings?.target_wake_time || '05:00'} ({settings ? Math.round((breakdown?.target_duration_minutes || 420) / 60) : 7} hrs)
        </div>
      </div>

      {/* Duration Score */}
      <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD]">Duration Score</span>
          <Clock className="w-4 h-4 text-[#2E9C82] dark:text-[#8FE0CE]" />
        </div>

        <div className="my-2">
          <div className="font-mono text-2xl font-bold text-[#14181B] dark:text-[#E7ECEC]">
            {breakdown ? Math.floor(breakdown.duration_minutes / 60) : 0}h {breakdown ? breakdown.duration_minutes % 60 : 0}m
          </div>
          <p className="text-xs text-[#2E9C82] dark:text-[#8FE0CE] font-semibold mt-0.5 font-mono">
            Score: {breakdown?.duration_score ?? 0}% ({Math.round((settings?.weight_duration || 0.4) * 100)}% weight)
          </p>
        </div>

        <div className="w-full bg-[#EBE3D3] dark:bg-[#0B0F14] h-1.5 rounded-full overflow-hidden border border-[#CFC3AB]/40 dark:border-[#1D2830]">
          <div
            className="bg-[#2E9C82] dark:bg-[#8FE0CE] h-full rounded-full transition-all"
            style={{ width: `${breakdown?.duration_score || 0}%` }}
          />
        </div>
      </div>

      {/* Circadian Timing */}
      <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD]">Circadian Timing</span>
          <Sun className="w-4 h-4 text-[#D9551F] dark:text-[#FF7A47]" />
        </div>

        <div className="my-2 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#6B655F] dark:text-[#98A6AD]">Bedtime Score:</span>
            <span className="font-bold text-[#14181B] dark:text-[#E7ECEC]">{breakdown?.bedtime_score ?? 0}%</span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#6B655F] dark:text-[#98A6AD]">Wake Score:</span>
            <span className="font-bold text-[#14181B] dark:text-[#E7ECEC]">{breakdown?.wake_score ?? 0}%</span>
          </div>
        </div>

        <div className="text-[11px] text-[#6B655F] dark:text-[#98A6AD] pt-2 border-t border-[#CFC3AB]/60 dark:border-[#1D2830] font-mono">
          Alignment: {Math.round(((breakdown?.bedtime_score || 0) + (breakdown?.wake_score || 0)) / 2)}% average
        </div>
      </div>

      {/* Nap Penalty / Factor */}
      <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD]">Nap Factor</span>
          <Coffee className="w-4 h-4 text-[#D9551F] dark:text-[#FF7A47]" />
        </div>

        <div className="my-2">
          <div className="font-mono text-2xl font-bold text-[#14181B] dark:text-[#E7ECEC]">
            {totalNapMins} mins
          </div>
          <p className="text-xs text-[#D9551F] dark:text-[#FF7A47] font-semibold mt-0.5 font-mono">
            Penalty: -{breakdown?.nap_penalty || 0}%
          </p>
        </div>

        <div className="text-[11px] text-[#6B655F] dark:text-[#98A6AD] pt-2 border-t border-[#CFC3AB]/60 dark:border-[#1D2830] font-sans">
          {totalNapMins > (settings?.nap_threshold_minutes || 45) ? 'Exceeds threshold' : 'Within threshold (clean)'}
        </div>
      </div>
    </div>
  );
}
