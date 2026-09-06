'use client';

import React, { useState, useEffect } from 'react';
import { Activity, X } from 'lucide-react';
import { Run } from '@/types';

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
      user_id: '00000000-0000-0000-0000-000000000001',
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0d131f] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span>{editingRun ? 'Edit Run' : 'Log Running Session'}</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase text-slate-400 mb-1.5">
              Date (Universal Backdating)
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase text-slate-400 mb-1.5">
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
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase text-slate-400 mb-1.5">
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
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase text-slate-400 mb-1.5">
              Calculated Pace (min/km)
            </label>
            <input
              type="text"
              required
              value={pace}
              onChange={(e) => setPace(e.target.value)}
              placeholder="5:30"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-mono text-sm font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-slate-400 mb-1.5">
              Notes (Route, Heart Rate, Elevation, Feeling)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Zone 2 aerobic base, cool morning breeze, felt strong"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              {editingRun ? 'Save Changes' : 'Record Run'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}