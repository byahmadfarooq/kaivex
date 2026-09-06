'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDate } from '@/context/DateContext';
import DateSelector from '@/components/DateSelector';
import SleepScoreBanner from '@/components/sleep/SleepScoreBanner';
import MainSleepForm from '@/components/sleep/MainSleepForm';
import NapsList from '@/components/sleep/NapsList';
import SleepHistoryGrid from '@/components/sleep/SleepHistoryGrid';
import SleepSettingsModal from '@/components/sleep/SleepSettingsModal';
import LogNapModal from '@/components/sleep/LogNapModal';
import {
  getSleepEntry,
  getNaps,
  getSleepSettings,
  saveSleepEntry,
  saveNap,
  deleteNap,
  saveSleepSettings,
  getSleepHistory,
} from '@/lib/storage';
import { calculateSleepQuality } from '@/lib/sleep-calc';
import { NapEntry, SleepEntry, SleepQualityBreakdown, SleepSettings } from '@/types';
import { Moon, Settings as SettingsIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function SleepPage() {
  const { selectedDate, setSelectedDate } = useDate();
  const [sleepEntry, setSleepEntry] = useState<SleepEntry | null>(null);
  const [naps, setNaps] = useState<NapEntry[]>([]);
  const [settings, setSettings] = useState<SleepSettings | null>(null);
  const [history, setHistory] = useState<SleepEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Main sleep form states
  const [bedtimeTime, setBedtimeTime] = useState('22:00');
  const [wakeTime, setWakeTime] = useState('05:00');
  const [sleepNotes, setSleepNotes] = useState('');
  const [savingSleep, setSavingSleep] = useState(false);

  // Nap form states
  const [showNapModal, setShowNapModal] = useState(false);
  const [napStartTime, setNapStartTime] = useState('13:30');
  const [napEndTime, setNapEndTime] = useState('14:15');
  const [napNotes, setNapNotes] = useState('');

  // Settings modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editSettings, setEditSettings] = useState<SleepSettings | null>(null);

  // Load sleep data for the selectedDate
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedSettings, fetchedSleep, fetchedNaps, fetchedHistory] = await Promise.all([
        getSleepSettings(),
        getSleepEntry(selectedDate),
        getNaps(selectedDate),
        getSleepHistory(14),
      ]);

      setSettings(fetchedSettings);
      setEditSettings(fetchedSettings);
      setSleepEntry(fetchedSleep);
      setNaps(fetchedNaps);
      setHistory(fetchedHistory);

      if (fetchedSleep) {
        const sleepD = new Date(fetchedSleep.sleep_time);
        const wakeD = new Date(fetchedSleep.wake_time);
        setBedtimeTime(format(sleepD, 'HH:mm'));
        setWakeTime(format(wakeD, 'HH:mm'));
        setSleepNotes(fetchedSleep.notes || '');
      } else {
        setBedtimeTime(fetchedSettings.target_bedtime || '22:00');
        setWakeTime(fetchedSettings.target_wake_time || '05:00');
        setSleepNotes('');
      }
    } catch (err) {
      console.error('Error loading sleep data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime quality breakdown calculation
  const breakdown: SleepQualityBreakdown | null = useMemo(() => {
    if (!settings) return null;
    const sleepIso = `${selectedDate}T${bedtimeTime}:00`;
    let wakeDate = selectedDate;
    if (wakeTime <= bedtimeTime) {
      const nextDay = new Date(parseISO(selectedDate + 'T12:00:00').getTime() + 24 * 60 * 60 * 1000);
      wakeDate = format(nextDay, 'yyyy-MM-dd');
    }
    const wakeIso = `${wakeDate}T${wakeTime}:00`;

    return calculateSleepQuality(sleepIso, wakeIso, settings, naps);
  }, [settings, selectedDate, bedtimeTime, wakeTime, naps]);

  // Save Main Sleep Entry
  const handleSaveSleep = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSleep(true);
    try {
      const sleepIso = `${selectedDate}T${bedtimeTime}:00`;
      let wakeDate = selectedDate;
      if (wakeTime <= bedtimeTime) {
        const nextDay = new Date(parseISO(selectedDate + 'T12:00:00').getTime() + 24 * 60 * 60 * 1000);
        wakeDate = format(nextDay, 'yyyy-MM-dd');
      }
      const wakeIso = `${wakeDate}T${wakeTime}:00`;

      const saved = await saveSleepEntry({
        id: sleepEntry?.id,
        user_id: settings?.user_id || '00000000-0000-0000-0000-000000000001',
        date: selectedDate,
        sleep_time: sleepIso,
        wake_time: wakeIso,
        notes: sleepNotes,
      });
      setSleepEntry(saved);
      loadData();
    } catch (err) {
      console.error('Error saving sleep entry:', err);
    } finally {
      setSavingSleep(false);
    }
  };

  // Save Nap
  const handleSaveNap = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const startIso = `${selectedDate}T${napStartTime}:00`;
      const endIso = `${selectedDate}T${napEndTime}:00`;
      await saveNap({
        date: selectedDate,
        start_time: startIso,
        end_time: endIso,
        notes: napNotes,
      });
      setShowNapModal(false);
      setNapNotes('');
      loadData();
    } catch (err) {
      console.error('Error saving nap:', err);
    }
  };

  // Delete Nap
  const handleDeleteNap = async (napId: string) => {
    await deleteNap(napId, selectedDate);
    loadData();
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSettings) return;
    await saveSleepSettings(editSettings);
    setShowSettingsModal(false);
    loadData();
  };

  const totalNapMins = naps.reduce((acc, n) => acc + (Number(n.duration_minutes) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1C1917] dark:text-[#F8FAFC] flex items-center gap-2.5">
            <Moon className="w-6 h-6 text-indigo-400" />
            <span>Sleep & Recovery Tracker</span>
          </h1>
          <p className="text-xs text-[#78716C] dark:text-[#94A3B8] mt-0.5">
            Night sleep quality algorithm with circadian alignment and nap penalty heuristic.
          </p>
        </div>

        <button
          onClick={() => setShowSettingsModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F5F2EB] dark:bg-[#090C11] border border-[#E2DDD5] dark:border-[#1E2738]/60 hover:border-slate-600 text-slate-300 hover:text-[#1C1917] dark:text-[#F8FAFC] transition-all cursor-pointer w-fit"
        >
          <SettingsIcon className="w-4 h-4 text-[#1E826C] dark:text-[#2DD4BF]" />
          <span>Algorithm Settings</span>
        </button>
      </div>

      <DateSelector />

      {/* Sleep Score Banner */}
      <SleepScoreBanner
        breakdown={breakdown}
        settings={settings}
        sleepEntry={sleepEntry}
        totalNapMins={totalNapMins}
      />

      {/* Main Sleep Form & Naps Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MainSleepForm
          selectedDate={selectedDate}
          sleepEntry={sleepEntry}
          bedtimeTime={bedtimeTime}
          setBedtimeTime={setBedtimeTime}
          wakeTime={wakeTime}
          setWakeTime={setWakeTime}
          sleepNotes={sleepNotes}
          setSleepNotes={setSleepNotes}
          savingSleep={savingSleep}
          handleSaveSleep={handleSaveSleep}
          breakdown={breakdown}
        />

        <NapsList
          selectedDate={selectedDate}
          naps={naps}
          totalNapMins={totalNapMins}
          settings={settings}
          breakdown={breakdown}
          onOpenAddNap={() => setShowNapModal(true)}
          onDeleteNap={handleDeleteNap}
        />
      </div>

      {/* Sleep History & Trend Preview */}
      <SleepHistoryGrid
        history={history}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {/* Modals */}
      <LogNapModal
        isOpen={showNapModal}
        onClose={() => setShowNapModal(false)}
        napStartTime={napStartTime}
        setNapStartTime={setNapStartTime}
        napEndTime={napEndTime}
        setNapEndTime={setNapEndTime}
        napNotes={napNotes}
        setNapNotes={setNapNotes}
        onSaveNap={handleSaveNap}
      />

      <SleepSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        editSettings={editSettings}
        setEditSettings={setEditSettings}
        onSave={handleSaveSettings}
      />
    </div>
  );
}