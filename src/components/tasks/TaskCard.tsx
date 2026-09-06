'use client';

import React from 'react';
import { Task, DayOfWeek } from '@/types';
import { CheckSquare, Square, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { DAYS_OF_WEEK } from '@/lib/constants';

interface TaskCardProps {
  task: Task;
  onToggleDone: (id: string, is_done: boolean) => void;
  onDelete: (id: string) => void;
  onMoveDay: (taskId: string, targetDay: DayOfWeek) => void;
}

export default function TaskCard({
  task,
  onToggleDone,
  onDelete,
  onMoveDay,
}: TaskCardProps) {
  const currentDayIndex = DAYS_OF_WEEK.indexOf(task.day_of_week);

  const handlePrevDay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentDayIndex > 0) {
      onMoveDay(task.id, DAYS_OF_WEEK[currentDayIndex - 1]);
    }
  };

  const handleNextDay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentDayIndex < DAYS_OF_WEEK.length - 1) {
      onMoveDay(task.id, DAYS_OF_WEEK[currentDayIndex + 1]);
    }
  };

  return (
    <div
      className={`group p-3 rounded-2xl border transition-all text-xs space-y-2 ${
        task.is_done
          ? 'bg-slate-900/40 border-slate-800/50 opacity-60 hover:opacity-100'
          : 'bg-[#111827]/90 border-slate-800/80 hover:border-slate-700/80 shadow-md shadow-black/40'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <button
          onClick={() => onToggleDone(task.id, !task.is_done)}
          className={`mt-0.5 shrink-0 transition-colors cursor-pointer ${
            task.is_done ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {task.is_done ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={`font-semibold break-words leading-tight ${
              task.is_done ? 'line-through text-slate-400' : 'text-slate-100'
            }`}
          >
            {task.title}
          </p>
          {task.notes && (
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {task.notes}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
        {/* Priority Badge */}
        <div>
          {task.priority ? (
            <span
              className={`px-1.5 py-0.5 rounded font-medium ${
                task.priority === 'high'
                  ? 'bg-rose-950/60 text-rose-400 border border-rose-800/50'
                  : task.priority === 'medium'
                  ? 'bg-amber-950/60 text-amber-400 border border-amber-800/50'
                  : 'bg-slate-800 text-slate-400 border border-slate-700/50'
              }`}
            >
              {task.priority.toUpperCase()}
            </span>
          ) : (
            <span className="text-slate-600">—</span>
          )}
        </div>

        {/* Move & Delete Actions */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          {currentDayIndex > 0 && (
            <button
              onClick={handlePrevDay}
              title={`Move to ${DAYS_OF_WEEK[currentDayIndex - 1]}`}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            >
              <ArrowLeft className="w-3 h-3" />
            </button>
          )}

          {currentDayIndex < DAYS_OF_WEEK.length - 1 && (
            <button
              onClick={handleNextDay}
              title={`Move to ${DAYS_OF_WEEK[currentDayIndex + 1]}`}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            >
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={() => onDelete(task.id)}
            title="Delete task"
            className="p-1 rounded hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 ml-1"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}