'use client';

import React, { useState, useEffect } from 'react';
import { Activity, X, Calendar, Gauge, Clock, FileText } from 'lucide-react';
import { Run } from '@/types';
import { DEFAULT_USER_ID } from '@/lib/constants';

interface LogRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate: string;
  onSave: (runData: Omit<Run, 'id'>) => void;
  editingRun?: Run | null;
}

export default function LogRunModal({
  isOpen,
  onClose,
  defaultDate,
  onSave,
  editingRun,
}: LogRunModalProps) {
  const [date, setDate] = useState(defaultDate);
  const [distanceKm, setDistanceKm] = useState('5.0');
  const [durationMinutes, setDurationMinutes] = useState('27.5');
  const [pace, setPace] = useState('5:30');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingRun) {
      setDate(editingRun.date);
      setDistanceKm(editingRun.distance_km.toString());
      setDurationMinutes(editingRun.duration_minutes.toString());
      setPace(editingRun.pace);
      setNotes(editingRun.notes || '');
    } else {
      setDate(defaultDate);
      setDistanceKm('5.0');
      setDurationMinutes('27.5');
      setPace('5:30');
      setNotes('');
    }
  }, [editingRun, defaultDate, isOpen]);

  // Automatically calculate pace when distance or duration changes
  const handleCalculatePace = (distStr: string, durStr: string) => {
    const dist = parseFloat(distStr);
    const dur = parseFloat(durStr);
    if (dist > 0 && dur > 0) {
      const paceDecimal = dur / dist; // minutes per km
      const paceMin = Math.floor(paceDecimal);
      const paceSec = Math.round((paceDecimal - paceMin) * 60);
      const formatted = `${paceMin}:${paceSec < 10 ? '0' : ''}${paceSec}`;
      setPace(formatted);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dist = parseFloat(distanceKm);
    const dur = parseFloat(durationMinutes);
    if (isNaN(dist) || isNaN(dur)) return;

    onSave({
      user_id: DEFAULT_USER_ID,
      date,
      distance_km: dist,
      duration_minutes: dur,
      pace,
      source: 'manual',
      strava_activity_id: null,
      notes: notes.trim() || null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-[#111622] border border-[#E2DDD5] dark:border-[#1E2738] rounded-3xl p-6 shadow-2xl space-y-4 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2DDD5] dark:border-[#1E2738]">
          <h3 className="text-lg font-bold text-[#1C1917] dark:text-[#F8FAFC] flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#1E826C] dark:text-[#2DD4BF]" />
            <span>{editingRun ? 'Edit Run Record' : 'Log Running Session'}</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#78716C] hover:text-[#1C1917] dark:hover:text-[#F8FAFC]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wide text-[#78716C] dark:text-[#94A3B8] mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#1E826C] dark:text-[#2DD4BF]" />
              Date (Universal Backdating)
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#F5F2EB] dark:bg-[#090C11] border border-[#E2DDD5] dark:border-[#1E2738] text-[#1C1917] dark:text-[#F8FAFC] font-mono text-sm focus:outline-none focus:border-[#1E826C] dark:focus:border-[#2DD4BF]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wide text-[#78716C] dark:text-[#94A3B8] mb-1.5 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-[#1E826C] dark:text-[#2DD4BF]" />
                Distance (km)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                required
                value={distanceKm}
                onChange={(e) => {
                  setDistanceKm(e.target.value);
                  handleCalculatePace(e.target.value, durationMinutes);
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-[#F5F2EB] dark:bg-[#090C11] border border-[#E2DDD5] dark:border-[#1E2738] text-[#1C1917] dark:text-[#F8FAFC] font-mono text-sm focus:outline-none focus:border-[#1E826C] dark:focus:border-[#2DD4BF]"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wide text-[#78716C] dark:text-[#94A3B8] mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#1E826C] dark:text-[#2DD4BF]" />
                Duration (minutes)
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                required
                value={durationMinutes}
                onChange={(e) => {
                  setDurationMinutes(e.target.value);
                  handleCalculatePace(distanceKm, e.target.value);
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-[#F5F2EB] dark:bg-[#090C11] border border-[#E2DDD5] dark:border-[#1E2738] text-[#1C1917] dark:text-[#F8FAFC] font-mono text-sm focus:outline-none focus:border-[#1E826C] dark:focus:border-[#2DD4BF]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wide text-[#78716C] dark:text-[#94A3B8] mb-1.5">
              Calculated Pace (min/km)
            </label>
            <input
              type="text"
              required
              value={pace}
              onChange={(e) => setPace(e.target.value)}
              placeholder="5:30"
              className="w-full px-4 py-2.5 rounded-xl bg-[#F5F2EB] dark:bg-[#090C11] border border-[#E2DDD5] dark:border-[#1E2738] text-[#1E826C] dark:text-[#2DD4BF] font-mono text-sm font-bold focus:outline-none focus:border-[#1E826C] dark:focus:border-[#2DD4BF]"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wide text-[#78716C] dark:text-[#94A3B8] mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#78716C] dark:text-[#94A3B8]" />
              Notes (Route, Heart Rate, Feeling)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Zone 2 aerobic base, cool morning breeze, felt strong"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-[#F5F2EB] dark:bg-[#090C11] border border-[#E2DDD5] dark:border-[#1E2738] text-[#1C1917] dark:text-[#F8FAFC] placeholder-[#78716C]/50 focus:outline-none focus:border-[#1E826C] dark:focus:border-[#2DD4BF] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2DDD5] dark:border-[#1E2738]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-bold text-[#78716C] hover:text-[#1C1917] dark:hover:text-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-bold bg-[#1E826C] hover:bg-[#176655] dark:bg-[#2DD4BF] dark:hover:bg-[#14B8A6] text-white dark:text-[#090C11] shadow transition-all cursor-pointer"
            >
              {editingRun ? 'Save Changes' : 'Record Run'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
