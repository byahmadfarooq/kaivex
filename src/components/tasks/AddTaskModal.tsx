'use client';

import React, { useState } from 'react';
import { Kanban, X, Calendar, Flag } from 'lucide-react';
import { Task, DayOfWeek, TaskPriority } from '@/types';
import { DAYS_OF_WEEK } from '@/lib/constants';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDay?: DayOfWeek;
  taskToEdit?: Task | null;
  onSave: (data: {
    id?: string;
    title: string;
    notes?: string | null;
    priority?: TaskPriority | null;
    day_of_week: DayOfWeek;
  }) => void;
}

function TaskModalForm({
  onClose,
  defaultDay = 'Monday',
  taskToEdit,
  onSave,
}: Omit<AddTaskModalProps, 'isOpen'>) {
  const [title, setTitle] = useState(taskToEdit?.title || '');
  const [notes, setNotes] = useState(taskToEdit?.notes || '');
  const [priority, setPriority] = useState<TaskPriority>(taskToEdit?.priority || 'medium');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(taskToEdit?.day_of_week || defaultDay);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: taskToEdit?.id,
      title: title.trim(),
      notes: notes.trim() || null,
      priority,
      day_of_week: dayOfWeek,
    });
  };

  return (
    <div className="w-full max-w-md bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-6 shadow-2xl space-y-4 transition-colors">
      <div className="flex items-center justify-between pb-3 border-b border-[#CFC3AB]/60 dark:border-[#1D2830]">
        <h3 className="font-display text-lg font-bold text-[#14181B] dark:text-[#E7ECEC] flex items-center gap-2">
          <Kanban className="w-5 h-5 text-[#2E9C82] dark:text-[#8FE0CE]" />
          <span>{taskToEdit ? 'Edit Operation Task' : 'Create Operation Task'}</span>
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
          <label className="block font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1.5">
            Task Title
          </label>
          <input
            type="text"
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Refactor API routes, Review quarterly metrics"
            className="w-full px-4 py-2.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] font-sans text-sm focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#2E9C82] dark:text-[#8FE0CE]" />
              Target Day
            </label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] font-sans text-xs focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
            >
              {DAYS_OF_WEEK.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1.5 flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5 text-[#D9551F] dark:text-[#FF7A47]" />
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] font-sans text-xs focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1.5">
            Description & Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Provide context, links, or execution checklists"
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
            {taskToEdit ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AddTaskModal({
  isOpen,
  onClose,
  defaultDay = 'Monday',
  taskToEdit,
  onSave,
}: AddTaskModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <TaskModalForm
        key={taskToEdit?.id || defaultDay}
        onClose={onClose}
        defaultDay={defaultDay}
        taskToEdit={taskToEdit}
        onSave={onSave}
      />
    </div>
  );
}
