'use client';

import React, { useState, useEffect } from 'react';
import { PipelineContact, PipelineStage } from '@/types';
import { Users, X } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  stages: PipelineStage[];
  defaultStageId: string;
  defaultDate: string;
  editingContact?: PipelineContact | null;
  onSave: (contactData: Partial<PipelineContact> & { name: string; current_stage_id: string }) => void;
}

export default function ContactModal({
  isOpen,
  onClose,
  stages,
  defaultStageId,
  defaultDate,
  editingContact,
  onSave,
}: ContactModalProps) {
  const [name, setName] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [currentStageId, setCurrentStageId] = useState(defaultStageId);
  const [lastContactDate, setLastContactDate] = useState(defaultDate);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingContact) {
      setName(editingContact.name);
      setLinkedinUrl(editingContact.linkedin_url || '');
      setCurrentStageId(editingContact.current_stage_id);
      setLastContactDate(editingContact.last_contact_date || defaultDate);
      setNotes(editingContact.notes || '');
    } else {
      setName('');
      setLinkedinUrl('');
      setCurrentStageId(defaultStageId || (stages[0]?.id ?? ''));
      setLastContactDate(defaultDate);
      setNotes('');
    }
  }, [editingContact, defaultStageId, defaultDate, stages, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: editingContact?.id,
      name: name.trim(),
      linkedin_url: linkedinUrl.trim() || null,
      current_stage_id: currentStageId,
      last_contact_date: lastContactDate || null,
      notes: notes.trim() || null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#111622] border border-[#E2DDD5] dark:border-[#1E2738] shadow-2xl transition-colors rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2DDD5] dark:border-[#1E2738]">
          <h3 className="text-lg font-bold text-[#1C1917] dark:text-[#F8FAFC] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#1E826C] dark:text-[#2DD4BF]" />
            <span>{editingContact ? 'Edit Lead' : 'Add Lead to Pipeline'}</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-[#78716C] dark:text-[#94A3B8] hover:text-[#1C1917] dark:text-[#F8FAFC]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase text-[#78716C] dark:text-[#94A3B8] mb-1.5">
              Contact Name
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah Jenkins or Alex Mercer"
              className="w-full px-4 py-2.5 rounded-xl bg-[#F5F2EB] dark:bg-[#090C11] border border-[#E2DDD5] dark:border-[#1E2738] text-[#1C1917] dark:text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-[#1E826C] dark:focus:border-[#2DD4BF] text-sm"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-[#78716C] dark:text-[#94A3B8] mb-1.5">
              LinkedIn Profile URL
            </label>
            <input
              type="text"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className="w-full px-4 py-2.5 rounded-xl bg-[#F5F2EB] dark:bg-[#090C11] border border-[#E2DDD5] dark:border-[#1E2738] text-[#1C1917] dark:text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-[#1E826C] dark:focus:border-[#2DD4BF] text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase text-[#78716C] dark:text-[#94A3B8] mb-1.5">
                Current Stage
              </label>
              <select
                value={currentStageId}
                onChange={(e) => setCurrentStageId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F5F2EB] dark:bg-[#090C11] border border-[#E2DDD5] dark:border-[#1E2738] text-[#1C1917] dark:text-[#F8FAFC] focus:outline-none focus:border-[#1E826C] dark:focus:border-[#2DD4BF]"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase text-[#78716C] dark:text-[#94A3B8] mb-1.5">
                Last Contact Date
              </label>
              <input
                type="date"
                value={lastContactDate}
                onChange={(e) => setLastContactDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F5F2EB] dark:bg-[#090C11] border border-[#E2DDD5] dark:border-[#1E2738] text-[#1C1917] dark:text-[#F8FAFC] focus:outline-none focus:border-[#1E826C] dark:focus:border-[#2DD4BF]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase text-[#78716C] dark:text-[#94A3B8] mb-1.5">
              Notes & Conversation Context
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Discussed enterprise integration, follow up next Tuesday..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-[#F5F2EB] dark:bg-[#090C11] border border-[#E2DDD5] dark:border-[#1E2738] text-[#1C1917] dark:text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-[#1E826C] dark:focus:border-[#2DD4BF]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2DDD5] dark:border-[#1E2738]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-semibold text-[#78716C] dark:text-[#94A3B8] hover:text-[#1C1917] dark:text-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-semibold bg-[#1E826C] hover:bg-[#176655] dark:bg-[#2DD4BF] dark:hover:bg-[#14B8A6] text-white dark:text-[#090C11] font-bold shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              {editingContact ? 'Save Changes' : 'Add Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}