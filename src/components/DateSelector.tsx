'use client';

import React from 'react';
import { useDate } from '@/context/DateContext';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, History } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';

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
    <div className="flex flex-wrap items-center justify-between gap-3 bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] px-4 py-3 rounded-2xl shadow-sm transition-colors">
      <div className="flex items-center gap-2">
        <button
          onClick={goToPreviousDay}
          title="Previous Day"
          className="p-2 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] hover:bg-[#D6CDBC] dark:hover:bg-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] transition-colors cursor-pointer border border-[#CFC3AB] dark:border-[#1D2830]"
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
            <div className="flex items-center gap-2 text-sm font-bold text-[#14181B] dark:text-[#E7ECEC] hover:text-[#D9551F] dark:hover:text-[#FF7A47] transition-colors cursor-pointer font-display">
              <CalendarIcon className="w-4 h-4 text-[#D9551F] dark:text-[#FF7A47]" />
              <span>{format(parsedDate, 'EEEE, MMM d, yyyy')}</span>
            </div>
          </div>

          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-bold border font-mono ${
              isToday
                ? 'bg-[#2E9C82]/15 text-[#2E9C82] dark:text-[#8FE0CE] border-[#2E9C82]/30 dark:border-[#8FE0CE]/30'
                : 'bg-[#D9551F]/15 text-[#D9551F] dark:text-[#FF7A47] border-[#D9551F]/30 dark:border-[#FF7A47]/30'
            }`}
          >
            {diffText}
          </span>
        </div>

        <button
          onClick={goToNextDay}
          title="Next Day"
          className="p-2 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] hover:bg-[#D6CDBC] dark:hover:bg-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] transition-colors cursor-pointer border border-[#CFC3AB] dark:border-[#1D2830]"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {!isToday && (
          <button
            onClick={goToToday}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-[#2E9C82]/15 hover:bg-[#2E9C82]/25 text-[#2E9C82] dark:text-[#8FE0CE] border border-[#2E9C82]/30 dark:border-[#8FE0CE]/30 transition-all cursor-pointer font-mono"
          >
            <History className="w-3.5 h-3.5" />
            <span>Jump to Today</span>
          </button>
        )}
      </div>
    </div>
  );
}
