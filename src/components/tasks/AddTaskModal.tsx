'use client';

import React, { useState } from 'react';
import { DayOfWeek, TaskPriority } from '@/types';
import { DAYS_OF_WEEK } from '@/lib/constants';
import { Kanban, X } from 'lucide-react';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDay: DayOfWeek;
  onSave: (title: string, notes: string, day: DayOfWeek, priority: TaskPriority | null) => void;
}

export default function AddTaskModal({
  isOpen,
  onClose,
  defaultDay,
  onSave,
}: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [day, setDay] = useState<DayOfWeek>(defaultDay);
  const [priority, setPriority] = useState<TaskPriority | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(title.trim(), notes.trim(), day, priority);
    setTitle('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#111622] border border-[#E2DDD5] dark:border-[#1E2738] transition-colors rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2DDD5] dark:border-[#1E2738]">
          <h3 className="text-lg font-bold text-[#1C1917] dark:text-[#F8FAFC] flex items-center gap-2">
            <Kanban className="w-5 h-5 text-[#1E826C] dark:text-[#2DD4BF]" />
            <span>Create Task</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-[#78716C] dark:text-[#94A3B8] hover:text-[#1C1917] dark:text-[#F8FAFC]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase text-[#78716C] dark:text-[#94A3B8] mb-1.5">
              Task Title
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Review client contract or Complete 10km run"
              className="w-full px-4 py-2.5 rounded-xl bg-[#F5F2EB] dark:bg-[#090C11] border border-[#E2DDD5] dark:border-[#1E2738] text-[#1C1917] dark:text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-[#1E826C] dark:focus:border-[#2DD4BF] text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase text-[#78716C] dark:text-[#94A3B8] mb-1.5">
                Day Column
              </label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value as DayOfWeek)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F5F2EB] dark:bg-[#090C11] border border-[#E2DDD5] dark:border-[#1E2738] text-[#1C1917] dark:text-[#F8FAFC] focus:outline-none focus:border-[#1E826C] dark:focus:border-[#2DD4BF]"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase text-[#78716C] dark:text-[#94A3B8] mb-1.5">
                Priority
              </label>
              <select
                value={priority || ''}
                onChange={(e) => setPriority((e.target.value as TaskPriority) || null)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F5F2EB] dark:bg-[#090C11] border border-[#E2DDD5] dark:border-[#1E2738] text-[#1C1917] dark:text-[#F8FAFC] focus:outline-none focus:border-[#1E826C] dark:focus:border-[#2DD4BF]"
              >
                <option value="">Normal</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase text-[#78716C] dark:text-[#94A3B8] mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Context, sub-points, or links..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-[#F5F2EB] dark:bg-[#090C11] border border-[#E2DDD5] dark:border-[#1E2738] text-[#1C1917] dark:text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-[#1E826C] dark:focus:border-[#2DD4BF]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2DDD5] dark:border-[#1E2738]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-semibold text-[#78716C] dark:text-[#94A3B8] hover:text-[#1C1917] dark:text-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-semibold bg-[#1E826C] hover:bg-[#176655] dark:bg-[#2DD4BF] dark:hover:bg-[#14B8A6] text-white dark:text-[#090C11] font-bold shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}