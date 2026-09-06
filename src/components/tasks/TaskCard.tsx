'use client';

import React, { useState } from 'react';
import { Task, DayOfWeek } from '@/types';
import { DAYS_OF_WEEK } from '@/lib/constants';
import { Check, Trash2, ArrowRight, MoreHorizontal, AlertCircle } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onToggleDone: (task: Task) => void;
  onDelete: (task: Task) => void;
  onMoveDay: (task: Task, newDay: DayOfWeek) => void;
}

export default function TaskCard({
  task,
  onToggleDone,
  onDelete,
  onMoveDay,
}: TaskCardProps) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const priorityColor = () => {
    switch (task.priority) {
      case 'high':
        return 'border-l-4 border-l-[#D9551F] dark:border-l-[#FF7A47]';
      case 'medium':
        return 'border-l-4 border-l-amber-500';
      case 'low':
        return 'border-l-4 border-l-[#2E9C82] dark:border-l-[#8FE0CE]';
      default:
        return 'border-l-4 border-l-[#CFC3AB] dark:border-l-[#1D2830]';
    }
  };

  return (
    <div
      className={`p-3 rounded-2xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] shadow-sm transition-all ${priorityColor()} ${
        task.is_done ? 'opacity-60 line-through' : 'hover:border-[#D9551F] dark:hover:border-[#FF7A47]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <button
            onClick={() => onToggleDone(task)}
            className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              task.is_done
                ? 'bg-[#2E9C82] border-[#2E9C82] text-white dark:text-[#0B0F14]'
                : 'border-[#CFC3AB] dark:border-[#6B655F] hover:border-[#2E9C82]'
            }`}
          >
            {task.is_done && <Check className="w-3 h-3 stroke-[3]" />}
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#14181B] dark:text-[#E7ECEC] break-words font-sans">
              {task.title}
            </p>
            {task.notes && (
              <p className="text-[11px] text-[#6B655F] dark:text-[#98A6AD] mt-1 line-clamp-2 font-sans">
                {task.notes}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => onDelete(task)}
          className="p-1 rounded-lg text-[#6B655F] dark:text-[#98A6AD] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Footer / Move Day */}
      <div className="mt-2.5 pt-2 border-t border-[#CFC3AB]/50 dark:border-[#1D2830] flex items-center justify-between text-[10px]">
        {task.priority && (
          <span className="font-mono uppercase font-bold text-[#6B655F] dark:text-[#98A6AD]">
            {task.priority}
          </span>
        )}

        <div className="relative ml-auto">
          <button
            onClick={() => setShowMoveMenu(!showMoveMenu)}
            className="flex items-center gap-1 text-[#6B655F] dark:text-[#98A6AD] hover:text-[#14181B] dark:hover:text-[#E7ECEC] font-semibold"
          >
            <span>Move</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </button>

          {showMoveMenu && (
            <div className="absolute right-0 bottom-6 z-20 w-28 bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-xl shadow-xl py-1">
              {DAYS_OF_WEEK.filter((d) => d !== task.day_of_week).map((targetDay) => (
                <button
                  key={targetDay}
                  onClick={() => {
                    onMoveDay(task, targetDay);
                    setShowMoveMenu(false);
                  }}
                  className="w-full text-left px-3 py-1 text-[11px] text-[#14181B] dark:text-[#E7ECEC] hover:bg-[#D9551F] hover:text-white dark:hover:bg-[#FF7A47] dark:hover:text-[#0B0F14] transition-colors"
                >
                  {targetDay}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
