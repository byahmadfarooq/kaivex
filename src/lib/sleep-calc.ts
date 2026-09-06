import { NapEntry, SleepQualityBreakdown, SleepSettings } from '../types';

/**
 * Parses "HH:mm" into minutes since midnight (0 - 1439)
 */
export function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Extracts minutes from midnight (0 - 1439) from an ISO timestamp or Date object
 */
export function dateToMinutes(dateInput: string | Date): number {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return d.getHours() * 60 + d.getMinutes();
}

/**
 * Computes shortest circular difference in minutes on a 24-hour clock (1440 mins)
 */
export function circularMinuteDiff(minA: number, minB: number): number {
  const diff = Math.abs(minA - minB);
  return Math.min(diff, 1440 - diff);
}

export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

/**
 * Computes target duration in minutes from target bedtime to target wake time.
 * E.g. "22:00" to "05:00" -> 420 minutes (7 hours).
 */
export function getTargetDurationMinutes(bedtimeStr: string, wakeTimeStr: string): number {
  const bedMin = timeStringToMinutes(bedtimeStr);
  const wakeMin = timeStringToMinutes(wakeTimeStr);
  let duration = wakeMin - bedMin;
  if (duration <= 0) {
    duration += 1440;
  }
  return duration;
}

/**
 * Evaluates the full sleep quality score and returns an itemized breakdown.
 * Formula per Kaivex TRD Section 4:
 * - duration_score = clamp(100 - max(0, abs(duration - target) - grace) * penalty_factor, 0, 100)
 * - bedtime_score = clamp(100 - max(0, bedtime_diff - grace) * penalty_factor, 0, 100)
 * - wake_score = clamp(100 - max(0, wake_diff - grace) * penalty_factor, 0, 100)
 * - base_score = weighted sum of the 3
 * - nap_penalty = nap_over_threshold * penalty_per_minute * late_multiplier
 * - quality_score = clamp(base_score - nap_penalty, 0, 100)
 */
export function calculateSleepQuality(
  sleepTime: string | Date,
  wakeTime: string | Date,
  settings: SleepSettings,
  naps: NapEntry[] = []
): SleepQualityBreakdown {
  const sleepDate = typeof sleepTime === 'string' ? new Date(sleepTime) : sleepTime;
  const wakeDate = typeof wakeTime === 'string' ? new Date(wakeTime) : wakeTime;

  // Actual duration in minutes
  const durationMinutes = Math.max(0, Math.round((wakeDate.getTime() - sleepDate.getTime()) / (1000 * 60)));

  // Target duration from settings
  const targetDurationMinutes = getTargetDurationMinutes(settings.target_bedtime, settings.target_wake_time);

  // Minutes from midnight
  const actualBedMinutes = dateToMinutes(sleepDate);
  const actualWakeMinutes = dateToMinutes(wakeDate);

  const targetBedMinutes = timeStringToMinutes(settings.target_bedtime);
  const targetWakeMinutes = timeStringToMinutes(settings.target_wake_time);

  // Circular time differences
  const bedtimeDiffMinutes = circularMinuteDiff(actualBedMinutes, targetBedMinutes);
  const wakeDiffMinutes = circularMinuteDiff(actualWakeMinutes, targetWakeMinutes);

  // Grace window: 15 minutes
  const GRACE_MINUTES = 15;
  const penaltyFactor = Number(settings.penalty_factor) || 1.5;

  const effectiveDurationDiff = Math.max(0, Math.abs(durationMinutes - targetDurationMinutes) - GRACE_MINUTES);
  const effectiveBedtimeDiff = Math.max(0, bedtimeDiffMinutes - GRACE_MINUTES);
  const effectiveWakeDiff = Math.max(0, wakeDiffMinutes - GRACE_MINUTES);

  const durationScore = clamp(100 - effectiveDurationDiff * penaltyFactor, 0, 100);
  const bedtimeScore = clamp(100 - effectiveBedtimeDiff * penaltyFactor, 0, 100);
  const wakeScore = clamp(100 - effectiveWakeDiff * penaltyFactor, 0, 100);

  // Normalized weights
  const wDur = Number(settings.weight_duration) || 0.40;
  const wBed = Number(settings.weight_bedtime) || 0.30;
  const wWake = Number(settings.weight_wake) || 0.30;
  const totalWeight = wDur + wBed + wWake || 1;

  const baseScore = (durationScore * wDur + bedtimeScore * wBed + wakeScore * wWake) / totalWeight;

  // --- Nap Penalty Calculation ---
  const totalNapMinutes = naps.reduce((acc, n) => acc + (Number(n.duration_minutes) || 0), 0);
  const napThreshold = Number(settings.nap_threshold_minutes) || 60;
  const napOverThreshold = Math.max(0, totalNapMinutes - napThreshold);

  // Late cutoff check (e.g. 16:00 / 4:00 PM)
  const cutoffMinutes = timeStringToMinutes(settings.nap_late_cutoff || '16:00');
  let isLateNap = false;
  for (const nap of naps) {
    const napStartMin = dateToMinutes(nap.start_time);
    if (napStartMin >= cutoffMinutes) {
      isLateNap = true;
      break;
    }
  }

  const lateNapMultiplier = isLateNap ? (Number(settings.late_nap_penalty_factor) || 1.5) : 1.0;
  const napPenaltyPerMinute = Number(settings.nap_penalty_per_minute) || 0.5;
  const napPenalty = napOverThreshold * napPenaltyPerMinute * lateNapMultiplier;

  const finalQualityScore = Math.round(clamp(baseScore - napPenalty, 0, 100) * 10) / 10;

  return {
    duration_minutes: durationMinutes,
    target_duration_minutes: targetDurationMinutes,
    duration_score: Math.round(durationScore * 10) / 10,
    bedtime_diff_minutes: bedtimeDiffMinutes,
    bedtime_score: Math.round(bedtimeScore * 10) / 10,
    wake_diff_minutes: wakeDiffMinutes,
    wake_score: Math.round(wakeScore * 10) / 10,
    base_score: Math.round(baseScore * 10) / 10,
    total_nap_minutes: totalNapMinutes,
    nap_over_threshold: napOverThreshold,
    is_late_nap: isLateNap,
    late_nap_multiplier: lateNapMultiplier,
    nap_penalty: Math.round(napPenalty * 10) / 10,
    final_quality_score: finalQualityScore,
  };
}