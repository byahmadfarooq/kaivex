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
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#111622] border border-[#E2DDD5] dark:border-[#1E2738] px-4 py-3 rounded-2xl shadow-sm dark:shadow-xl transition-colors">
      <div className="flex items-center gap-2">
        <button
          onClick={goToPreviousDay}
          title="Previous Day"
          className="p-2 rounded-xl bg-[#F5F2EB] dark:bg-[#090C11] hover:bg-[#EAE5DC] dark:hover:bg-[#1E2738] text-[#1C1917] dark:text-[#F8FAFC] transition-colors cursor-pointer border border-[#E2DDD5] dark:border-[#1E2738]"
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
            <div className="flex items-center gap-2 text-sm font-bold text-[#1C1917] dark:text-[#F8FAFC] hover:text-[#1E826C] dark:hover:text-[#2DD4BF] transition-colors cursor-pointer">
              <CalendarIcon className="w-4 h-4 text-[#1E826C] dark:text-[#2DD4BF]" />
              <span>{format(parsedDate, 'EEEE, MMM d, yyyy')}</span>
            </div>
          </div>

          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
              isToday
                ? 'bg-[#1E826C]/10 dark:bg-[#2DD4BF]/10 text-[#1E826C] dark:text-[#2DD4BF] border-[#1E826C]/20 dark:border-[#2DD4BF]/20'
                : 'bg-[#D95323]/10 dark:bg-[#F97316]/10 text-[#D95323] dark:text-[#F97316] border-[#D95323]/20 dark:border-[#F97316]/20'
            }`}
          >
            {diffText}
          </span>
        </div>

        <button
          onClick={goToNextDay}
          title="Next Day"
          className="p-2 rounded-xl bg-[#F5F2EB] dark:bg-[#090C11] hover:bg-[#EAE5DC] dark:hover:bg-[#1E2738] text-[#1C1917] dark:text-[#F8FAFC] transition-colors cursor-pointer border border-[#E2DDD5] dark:border-[#1E2738]"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {!isToday && (
          <button
            onClick={goToToday}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-[#1E826C]/10 hover:bg-[#1E826C]/20 dark:bg-[#2DD4BF]/10 dark:hover:bg-[#2DD4BF]/20 text-[#1E826C] dark:text-[#2DD4BF] border border-[#1E826C]/20 dark:border-[#2DD4BF]/20 transition-all cursor-pointer"
          >
            <History className="w-3.5 h-3.5" />
            <span>Jump to Today</span>
          </button>
        )}
      </div>
    </div>
  );
}
