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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-6 shadow-2xl space-y-4 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-[#CFC3AB]/60 dark:border-[#1D2830]">
          <h3 className="font-display text-lg font-bold text-[#14181B] dark:text-[#E7ECEC] flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#D9551F] dark:text-[#FF7A47]" />
            <span>{editingRun ? 'Edit Run Record' : 'Record Running Session'}</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#6B655F] dark:text-[#98A6AD] hover:text-[#14181B] dark:hover:text-[#E7ECEC]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          <div>
            <label className="block font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#D9551F] dark:text-[#FF7A47]" />
              Date (Universal Backdating)
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] font-mono text-sm focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1.5 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-[#2E9C82] dark:text-[#8FE0CE]" />
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
                className="w-full px-4 py-2.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] font-mono text-sm focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#2E9C82] dark:text-[#8FE0CE]" />
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
                className="w-full px-4 py-2.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] font-mono text-sm focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1.5">
              Calculated Pace (min/km)
            </label>
            <input
              type="text"
              required
              value={pace}
              onChange={(e) => setPace(e.target.value)}
              placeholder="5:30"
              className="w-full px-4 py-2.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#2E9C82] dark:text-[#8FE0CE] font-mono text-sm font-bold focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#6B655F] dark:text-[#98A6AD]" />
              Notes (Route, Heart Rate, Feeling)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Zone 2 aerobic base, crisp morning air, steady cadence"
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
              {editingRun ? 'Save Changes' : 'Record Run'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
