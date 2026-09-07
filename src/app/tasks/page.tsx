'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDate } from '@/context/DateContext';
import TaskCard from '@/components/tasks/TaskCard';
import AddTaskModal from '@/components/tasks/AddTaskModal';
import { getTasks, saveTask, deleteTask, toggleTaskDone } from '@/lib/storage';
import { Task, DayOfWeek, TaskPriority } from '@/types';
import { DAYS_OF_WEEK } from '@/lib/constants';
import {
  Kanban,
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Filter,
} from 'lucide-react';
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  parseISO,
} from 'date-fns';

export default function TasksPage() {
  const { selectedDate, setSelectedDate } = useDate();

  // Current viewed week is centered on selectedDate
  const currentMonday = useMemo(() => {
    const center = parseISO(selectedDate + 'T12:00:00');
    return startOfWeek(center, { weekStartsOn: 1 }); // Monday
  }, [selectedDate]);

  const weekStartDateStr = format(currentMonday, 'yyyy-MM-dd');
  const weekEndDate = endOfWeek(currentMonday, { weekStartsOn: 1 });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalDefaultDay, setModalDefaultDay] = useState<DayOfWeek>('Monday');
  const [hideCompleted, setHideCompleted] = useState(false);

  // Load tasks for current week
  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const fetched = await getTasks(weekStartDateStr);
      setTasks(fetched);
    } catch (err) {
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [weekStartDateStr]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Navigate weeks
  const handlePrevWeek = () => {
    const prev = subWeeks(currentMonday, 1);
    setSelectedDate(format(prev, 'yyyy-MM-dd'));
  };

  const handleNextWeek = () => {
    const next = addWeeks(currentMonday, 1);
    setSelectedDate(format(next, 'yyyy-MM-dd'));
  };

  const handleJumpToToday = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  };

  // Toggle task done
  const handleToggleDone = async (task: Task) => {
    await toggleTaskDone(task.id, !task.is_done);
    loadTasks();
  };

  // Delete task
  const handleDeleteTask = async (task: Task) => {
    if (confirm(`Delete task "${task.title}"?`)) {
      await deleteTask(task.id);
      loadTasks();
    }
  };

  // Move task to a different day
  const handleMoveDay = async (task: Task, newDay: DayOfWeek) => {
    const dayIndex = DAYS_OF_WEEK.indexOf(newDay);
    const newDate = format(addDays(currentMonday, dayIndex), 'yyyy-MM-dd');

    await saveTask({
      ...task,
      day_of_week: newDay,
      date: newDate,
    });
    loadTasks();
  };

  // Open add modal for specific day
  const handleOpenAddForDay = (day: DayOfWeek) => {
    setEditingTask(null);
    setModalDefaultDay(day);
    setShowAddModal(true);
  };

  // Open edit modal for a task
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setModalDefaultDay(task.day_of_week);
    setShowAddModal(true);
  };

  // Save new or edited task
  const handleSaveTask = async (taskData: {
    id?: string;
    title: string;
    notes?: string | null;
    priority?: TaskPriority | null;
    day_of_week: DayOfWeek;
  }) => {
    const dayIndex = DAYS_OF_WEEK.indexOf(taskData.day_of_week);
    const taskDate = format(addDays(currentMonday, dayIndex), 'yyyy-MM-dd');

    if (taskData.id) {
      const existing = tasks.find((t) => t.id === taskData.id);
      await saveTask({
        ...existing,
        id: taskData.id,
        title: taskData.title,
        notes: taskData.notes || null,
        priority: taskData.priority || null,
        day_of_week: taskData.day_of_week,
        week_start_date: weekStartDateStr,
        date: taskDate,
      });
    } else {
      await saveTask({
        title: taskData.title,
        notes: taskData.notes || null,
        priority: taskData.priority || null,
        day_of_week: taskData.day_of_week,
        week_start_date: weekStartDateStr,
        date: taskDate,
      });
    }

    setShowAddModal(false);
    setEditingTask(null);
    loadTasks();
  };

  // Group tasks by day
  const tasksByDay = useMemo(() => {
    const grouped: Record<DayOfWeek, Task[]> = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };

    tasks.forEach((t) => {
      if (grouped[t.day_of_week]) {
        if (!hideCompleted || !t.is_done) {
          grouped[t.day_of_week].push(t);
        }
      }
    });

    return grouped;
  }, [tasks, hideCompleted]);

  // Overall week stats
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.is_done).length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#14181B] dark:text-[#E7ECEC] flex items-center gap-2.5">
            <Kanban className="w-6 h-6 text-[#2E9C82] dark:text-[#8FE0CE]" />
            <span>Weekly Operations Matrix</span>
          </h1>
          <p className="text-xs text-[#6B655F] dark:text-[#98A6AD] mt-0.5 font-sans">
            7-day execution board with priority tags and workflow rebalancing.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setHideCompleted(!hideCompleted)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              hideCompleted
                ? 'bg-[#2E9C82]/15 border-[#2E9C82] text-[#2E9C82] dark:text-[#8FE0CE]'
                : 'bg-[#EBE3D3] dark:bg-[#0B0F14] border-[#CFC3AB] dark:border-[#1D2830] text-[#6B655F] dark:text-[#98A6AD] hover:text-[#14181B] dark:hover:text-[#E7ECEC]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{hideCompleted ? 'Showing Incomplete' : 'Hide Done'}</span>
          </button>

          <button
            onClick={() => {
              setEditingTask(null);
              setModalDefaultDay('Monday');
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#D9551F] hover:bg-[#B84214] dark:bg-[#FF7A47] dark:hover:bg-[#FF9066] text-white dark:text-[#0B0F14] shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Week Navigator Card */}
      <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-4 shadow-sm dark:shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="p-2 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#6B655F] dark:text-[#98A6AD] hover:text-[#14181B] dark:hover:text-[#E7ECEC] cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="px-3 py-1.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] flex items-center gap-2 text-xs font-bold text-[#14181B] dark:text-[#E7ECEC] font-mono">
            <Calendar className="w-4 h-4 text-[#D9551F] dark:text-[#FF7A47]" />
            <span>
              {format(currentMonday, 'MMM d')} - {format(weekEndDate, 'MMM d, yyyy')}
            </span>
          </div>

          <button
            onClick={handleNextWeek}
            className="p-2 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#6B655F] dark:text-[#98A6AD] hover:text-[#14181B] dark:hover:text-[#E7ECEC] cursor-pointer transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleJumpToToday}
            className="text-xs px-3 py-1.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#6B655F] dark:text-[#98A6AD] hover:text-[#14181B] dark:hover:text-[#E7ECEC] font-semibold cursor-pointer transition-colors"
          >
            Current Week
          </button>
        </div>

        {/* Progress summary */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-[#6B655F] dark:text-[#98A6AD]">
            <CheckCircle2 className="w-4 h-4 text-[#2E9C82] dark:text-[#8FE0CE]" />
            <span>
              {completedCount} of {totalCount} completed ({completionRate}%)
            </span>
          </div>
          <div className="w-28 bg-[#EBE3D3] dark:bg-[#0B0F14] h-2 rounded-full overflow-hidden border border-[#CFC3AB]/50 dark:border-[#1D2830]">
            <div
              className="bg-[#2E9C82] dark:bg-[#8FE0CE] h-full rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* 7-Day Kanban Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 items-start">
        {DAYS_OF_WEEK.map((day, idx) => {
          const dayDate = addDays(currentMonday, idx);
          const dayDateStr = format(dayDate, 'yyyy-MM-dd');
          const isToday = dayDateStr === format(new Date(), 'yyyy-MM-dd');
          const dayTasks = tasksByDay[day];

          return (
            <div
              key={day}
              className={`flex flex-col rounded-3xl p-3.5 border transition-all min-h-[420px] ${
                isToday
                  ? 'bg-[#E2DAC8] dark:bg-[#121A21] border-[#2E9C82] dark:border-[#8FE0CE] shadow-md'
                  : 'bg-[#E2DAC8]/60 dark:bg-[#121A21]/70 border-[#CFC3AB] dark:border-[#1D2830]'
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#CFC3AB]/60 dark:border-[#1D2830]">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-display text-sm font-bold text-[#14181B] dark:text-[#E7ECEC]">{day}</span>
                    {isToday && (
                      <span className="w-2 h-2 rounded-full bg-[#2E9C82] dark:bg-[#8FE0CE] animate-pulse" />
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-[#6B655F] dark:text-[#98A6AD]">
                    {format(dayDate, 'MMM d')}
                  </span>
                </div>

                <button
                  onClick={() => handleOpenAddForDay(day)}
                  className="p-1 rounded-lg text-[#6B655F] dark:text-[#98A6AD] hover:text-[#14181B] dark:hover:text-[#E7ECEC] hover:bg-[#CFC3AB]/40 dark:hover:bg-[#1D2830] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tasks in this column */}
              <div className="flex-1 space-y-2">
                {dayTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleDone={handleToggleDone}
                    onDelete={handleDeleteTask}
                    onMoveDay={handleMoveDay}
                    onEdit={handleEditTask}
                  />
                ))}

                {dayTasks.length === 0 && (
                  <div className="h-28 flex items-center justify-center border border-dashed border-[#CFC3AB]/80 dark:border-[#1D2830] rounded-2xl text-[11px] text-[#6B655F] dark:text-[#98A6AD] font-sans">
                    No tasks planned
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Task Modal */}
      <AddTaskModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingTask(null);
        }}
        defaultDay={modalDefaultDay}
        taskToEdit={editingTask}
        onSave={handleSaveTask}
      />
    </div>
  );
}
