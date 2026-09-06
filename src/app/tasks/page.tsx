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

  // Week navigation
  const handlePrevWeek = () => {
    const prev = subWeeks(currentMonday, 1);
    setSelectedDate(format(prev, 'yyyy-MM-dd'));
  };

  const handleNextWeek = () => {
    const next = addWeeks(currentMonday, 1);
    setSelectedDate(format(next, 'yyyy-MM-dd'));
  };

  const handleThisWeek = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  };

  // Add Task
  const handleCreateTask = async (
    title: string,
    notes: string,
    day: DayOfWeek,
    priority: TaskPriority | null
  ) => {
    const dayIndex = DAYS_OF_WEEK.indexOf(day);
    const concreteDate = format(addDays(currentMonday, dayIndex), 'yyyy-MM-dd');

    const newTask = await saveTask({
      title,
      notes: notes || null,
      day_of_week: day,
      week_start_date: weekStartDateStr,
      date: concreteDate,
      priority,
      is_done: false,
    });

    setTasks((prev) => [...prev, newTask]);
  };

  // Toggle done
  const handleToggleDone = async (id: string, is_done: boolean) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, is_done } : t)));
    await toggleTaskDone(id, is_done);
  };

  // Delete task
  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await deleteTask(id);
  };

  // Move task to another day
  const handleMoveDay = async (taskId: string, targetDay: DayOfWeek) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const targetDayIndex = DAYS_OF_WEEK.indexOf(targetDay);
    const newConcreteDate = format(addDays(currentMonday, targetDayIndex), 'yyyy-MM-dd');

    const updatedTask = {
      ...task,
      day_of_week: targetDay,
      date: newConcreteDate,
    };

    setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
    await saveTask(updatedTask);
  };

  // Open modal with preselected day
  const handleOpenAdd = (day: DayOfWeek) => {
    setModalDefaultDay(day);
    setShowAddModal(true);
  };

  // Weekly Stats
  const completedCount = tasks.filter((t) => t.is_done).length;
  const totalCount = tasks.length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="space-y-6">
      {/* Header with Week Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Kanban className="w-6 h-6 text-cyan-400" />
            <span>Weekly Kanban Board</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Full 7-day Monday through Sunday workflow. Move cards between days with zero friction.
          </p>
        </div>

        {/* Week Switcher Controls */}
        <div className="flex items-center gap-2 bg-[#0d131f]/90 border border-slate-800/80 p-1.5 rounded-2xl shadow-lg">
          <button
            onClick={handlePrevWeek}
            title="Previous Week"
            className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-2 text-xs font-semibold text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {format(currentMonday, 'MMM d')} – {format(weekEndDate, 'MMM d, yyyy')}
            </span>
          </div>

          <button
            onClick={handleNextWeek}
            title="Next Week"
            className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleThisWeek}
            className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 ml-1 transition-all cursor-pointer"
          >
            This Week
          </button>
        </div>
      </div>

      {/* Metric Strip & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0d131f]/80 border border-slate-800/80 p-4 rounded-3xl">
        <div className="flex items-center gap-6 text-xs">
          <div>
            <span className="text-slate-400">Total Tasks: </span>
            <span className="font-bold text-white text-sm">{totalCount}</span>
          </div>
          <div>
            <span className="text-slate-400">Completed: </span>
            <span className="font-bold text-emerald-400 text-sm">{completedCount}</span>
          </div>
          <div>
            <span className="text-slate-400">Progress: </span>
            <span className="font-bold text-cyan-400 text-sm">{completionPct}%</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setHideCompleted(!hideCompleted)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
              hideCompleted
                ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60'
                : 'bg-slate-800/40 text-slate-400 border-slate-700/40 hover:text-slate-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{hideCompleted ? 'Showing Active Only' : 'Show All Tasks'}</span>
          </button>

          <button
            onClick={() => handleOpenAdd('Monday')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* 7-Day Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3.5 items-start">
        {DAYS_OF_WEEK.map((day, idx) => {
          const colDate = addDays(currentMonday, idx);
          const colDateStr = format(colDate, 'yyyy-MM-dd');
          const isTodayCol = colDateStr === todayStr;
          const isSelectedDay = colDateStr === selectedDate;

          const dayTasks = tasks
            .filter((t) => t.day_of_week === day)
            .filter((t) => (hideCompleted ? !t.is_done : true));

          const dayCompleted = tasks.filter((t) => t.day_of_week === day && t.is_done).length;
          const dayTotal = tasks.filter((t) => t.day_of_week === day).length;

          return (
            <div
              key={day}
              className={`rounded-3xl border flex flex-col min-h-[500px] transition-all ${
                isTodayCol
                  ? 'bg-[#0f172a]/95 border-cyan-500/50 shadow-xl shadow-cyan-500/10'
                  : isSelectedDay
                  ? 'bg-[#0e1422]/90 border-slate-700'
                  : 'bg-[#0a0f1a]/80 border-slate-800/80'
              }`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        isTodayCol ? 'text-cyan-400' : 'text-slate-200'
                      }`}
                    >
                      {day}
                    </span>
                    {isTodayCol && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">{format(colDate, 'MMM d')}</span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {dayCompleted}/{dayTotal}
                  </span>
                  <button
                    onClick={() => handleOpenAdd(day)}
                    title={`Add task to ${day}`}
                    className="p-1 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tasks List */}
              <div className="p-2.5 space-y-2 flex-1 overflow-y-auto">
                {dayTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleDone={handleToggleDone}
                    onDelete={handleDeleteTask}
                    onMoveDay={handleMoveDay}
                  />
                ))}

                {dayTasks.length === 0 && (
                  <div
                    onClick={() => handleOpenAdd(day)}
                    className="h-28 rounded-2xl border border-dashed border-slate-800/80 hover:border-slate-700/80 flex flex-col items-center justify-center text-slate-600 hover:text-slate-400 transition-colors cursor-pointer p-3 text-center"
                  >
                    <Plus className="w-4 h-4 mb-1 opacity-50" />
                    <span className="text-[11px]">No tasks</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        defaultDay={modalDefaultDay}
        onSave={handleCreateTask}
      />
    </div>
  );
}