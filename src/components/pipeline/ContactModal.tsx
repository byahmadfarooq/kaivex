'use client';

import React, { useState, useEffect } from 'react';
import { Users, X, Globe, Calendar, FileText } from 'lucide-react';
import { PipelineContact, PipelineStage } from '@/types';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  stages: PipelineStage[];
  defaultStageId: string;
  editingContact: PipelineContact | null;
  onSave: (data: {
    name: string;
    current_stage_id: string;
    linkedin_url?: string | null;
    last_contact_date?: string | null;
    notes?: string | null;
  }) => void;
}

export default function ContactModal({
  isOpen,
  onClose,
  stages,
  defaultStageId,
  editingContact,
  onSave,
}: ContactModalProps) {
  const [name, setName] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [stageId, setStageId] = useState(defaultStageId);
  const [lastContactDate, setLastContactDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingContact) {
      setName(editingContact.name);
      setLinkedinUrl(editingContact.linkedin_url || '');
      setStageId(editingContact.current_stage_id);
      setLastContactDate(editingContact.last_contact_date || '');
      setNotes(editingContact.notes || '');
    } else {
      setName('');
      setLinkedinUrl('');
      setStageId(defaultStageId || (stages[0]?.id ?? ''));
      setLastContactDate('');
      setNotes('');
    }
  }, [editingContact, defaultStageId, stages, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      current_stage_id: stageId,
      linkedin_url: linkedinUrl.trim() || null,
      last_contact_date: lastContactDate || null,
      notes: notes.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-[#CFC3AB]/60 dark:border-[#1D2830]">
          <h3 className="font-display text-lg font-bold text-[#14181B] dark:text-[#E7ECEC] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#2E9C82] dark:text-[#8FE0CE]" />
            <span>{editingContact ? 'Edit Pipeline Contact' : 'Add Pipeline Contact'}</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#6B655F] dark:text-[#98A6AD] hover:text-[#14181B] dark:hover:text-[#E7ECEC]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Marc Andreessen"
                className="w-full px-4 py-2.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1.5">
                Stage
              </label>
              <select
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#2E9C82] dark:text-[#8FE0CE]" />
                LinkedIn URL
              </label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="w-full px-4 py-2.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#D9551F] dark:text-[#FF7A47]" />
                Last Contact Date
              </label>
              <input
                type="date"
                value={lastContactDate}
                onChange={(e) => setLastContactDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] font-mono focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-[#6B655F] dark:text-[#98A6AD] mb-1.5">
              Strategic Notes & Context
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Background, conversation history, key leverage points"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] placeholder-[#6B655F]/60 dark:placeholder-[#98A6AD]/50 focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#CFC3AB]/60 dark:border-[#1D2830]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-bold text-[#6B655F] dark:text-[#98A6AD] hover:text-[#14181B] dark:hover:text-[#E7ECEC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-bold bg-[#D9551F] hover:bg-[#B84214] dark:bg-[#FF7A47] dark:hover:bg-[#FF9066] text-white dark:text-[#0B0F14] shadow transition-all cursor-pointer"
            >
              {editingContact ? 'Save Changes' : 'Create Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
