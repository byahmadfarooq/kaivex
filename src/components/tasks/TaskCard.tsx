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
      className={`group p-3.5 rounded-2xl border transition-all text-xs space-y-2.5 ${
        task.is_done
          ? 'bg-[#F5F2EB]/50 dark:bg-[#090C11]/50 border-[#E2DDD5] dark:border-[#1E2738] opacity-60 hover:opacity-100'
          : 'bg-white dark:bg-[#111622] border-[#E2DDD5] dark:border-[#1E2738] hover:border-[#1E826C]/50 dark:hover:border-[#2DD4BF]/50 shadow-sm dark:shadow-md'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <button
          onClick={() => onToggleDone(task.id, !task.is_done)}
          className={`mt-0.5 shrink-0 transition-colors cursor-pointer ${
            task.is_done
              ? 'text-[#1E826C] dark:text-[#2DD4BF]'
              : 'text-[#78716C] hover:text-[#1C1917] dark:hover:text-[#F8FAFC]'
          }`}
        >
          {task.is_done ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={`font-bold break-words leading-tight ${
              task.is_done
                ? 'line-through text-[#78716C] dark:text-[#64748B]'
                : 'text-[#1C1917] dark:text-[#F8FAFC]'
            }`}
          >
            {task.title}
          </p>
          {task.notes && (
            <p className="text-[11px] text-[#57534E] dark:text-[#94A3B8] mt-1 line-clamp-2 leading-relaxed">
              {task.notes}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1.5 border-t border-[#E2DDD5] dark:border-[#1E2738] text-[10px]">
        {/* Priority Badge */}
        <div>
          {task.priority ? (
            <span
              className={`px-2 py-0.5 rounded-full font-bold border ${
                task.priority === 'high'
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                  : task.priority === 'medium'
                  ? 'bg-[#D95323]/10 text-[#D95323] dark:text-[#F97316] border-[#D95323]/20 dark:border-[#F97316]/20'
                  : 'bg-[#1E826C]/10 text-[#1E826C] dark:text-[#2DD4BF] border-[#1E826C]/20 dark:border-[#2DD4BF]/20'
              }`}
            >
              {task.priority.toUpperCase()}
            </span>
          ) : (
            <span className="text-[#78716C] dark:text-[#64748B]">--</span>
          )}
        </div>

        {/* Move & Delete Actions */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          {currentDayIndex > 0 && (
            <button
              onClick={handlePrevDay}
              title={`Move to ${DAYS_OF_WEEK[currentDayIndex - 1]}`}
              className="p-1 rounded-lg hover:bg-[#F5F2EB] dark:hover:bg-[#090C11] text-[#78716C] hover:text-[#1C1917] dark:hover:text-[#F8FAFC]"
            >
              <ArrowLeft className="w-3 h-3" />
            </button>
          )}

          {currentDayIndex < DAYS_OF_WEEK.length - 1 && (
            <button
              onClick={handleNextDay}
              title={`Move to ${DAYS_OF_WEEK[currentDayIndex + 1]}`}
              className="p-1 rounded-lg hover:bg-[#F5F2EB] dark:hover:bg-[#090C11] text-[#78716C] hover:text-[#1C1917] dark:hover:text-[#F8FAFC]"
            >
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={() => onDelete(task.id)}
            title="Delete task"
            className="p-1 rounded-lg hover:bg-rose-500/10 text-[#78716C] hover:text-rose-500 ml-1"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
