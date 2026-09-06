'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';

interface DateContextType {
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  goToToday: () => void;
  isToday: boolean;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

export function DateProvider({ children }: { children: React.ReactNode }) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  useEffect(() => {
    // Check URL param ?date=YYYY-MM-DD on initial mount
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlDate = urlParams.get('date');
      if (urlDate && /^\d{4}-\d{2}-\d{2}$/.test(urlDate)) {
        setSelectedDate(urlDate);
      }
    }
  }, []);

  const goToPreviousDay = () => {
    const current = new Date(selectedDate + 'T12:00:00');
    const prev = subDays(current, 1);
    setSelectedDate(format(prev, 'yyyy-MM-dd'));
  };

  const goToNextDay = () => {
    const current = new Date(selectedDate + 'T12:00:00');
    const next = addDays(current, 1);
    setSelectedDate(format(next, 'yyyy-MM-dd'));
  };

  const goToToday = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');

  return (
    <DateContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        goToPreviousDay,
        goToNextDay,
        goToToday,
        isToday,
      }}
    >
      {children}
    </DateContext.Provider>
  );
}

export function useDate() {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error('useDate must be used within a DateProvider');
  }
  return context;
}