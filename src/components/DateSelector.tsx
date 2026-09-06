'use client';

import React from 'react';
import { useDate } from '@/context/DateContext';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, History } from 'lucide-react';
import { format, parseISO, isToday as checkIsToday, differenceInDays } from 'date-fns';

export default function DateSelector() {
  const { selectedDate, setSelectedDate, goToPreviousDay, goToNextDay, goToToday, isToday } = useDate();

  const parsedDate = parseISO(selectedDate + 'T12:00:00');
  const daysDiff = differenceInDays(new Date(), parsedDate);

  let diffText = '';
  if (isToday) {
    diffText = 'Today';
  } else if (daysDiff === 1) {
    diffText = 'Yesterday';
  } else if (daysDiff > 1) {
    diffText = `${daysDiff} days ago`;
  } else if (daysDiff < 0) {
    diffText = `In ${Math.abs(daysDiff)} days`;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0d131f]/90 border border-slate-800/80 px-4 py-2.5 rounded-2xl shadow-lg backdrop-blur-md">
      <div className="flex items-center gap-2">
        <button
          onClick={goToPreviousDay}
          title="Previous Day"
          className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/40"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 px-2">
          <div className="relative flex items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
            />
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-100 hover:text-cyan-400 transition-colors cursor-pointer">
              <CalendarIcon className="w-4 h-4 text-cyan-400" />
              <span>{format(parsedDate, 'EEEE, MMM d, yyyy')}</span>
            </div>
          </div>

          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
              isToday
                ? 'bg-cyan-950/60 text-cyan-400 border-cyan-800/60'
                : 'bg-amber-950/60 text-amber-400 border-amber-800/60'
            }`}
          >
            {diffText}
          </span>
        </div>

        <button
          onClick={goToNextDay}
          title="Next Day"
          className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/40"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {!isToday && (
          <button
            onClick={goToToday}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer"
          >
            <History className="w-3.5 h-3.5" />
            <span>Jump to Today</span>
          </button>
        )}
      </div>
    </div>
  );
}