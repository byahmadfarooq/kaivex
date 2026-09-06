'use client';

import React, { useState } from 'react';
import { Settings2, X, Plus, Trash2 } from 'lucide-react';
import { PipelineStage } from '@/types';
import { savePipelineStage, deletePipelineStage } from '@/lib/storage';

interface StagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  stages: PipelineStage[];
  onRefresh: () => void;
}

export default function StagesModal({
  isOpen,
  onClose,
  stages,
  onRefresh,
}: StagesModalProps) {
  const [newStageName, setNewStageName] = useState('');

  if (!isOpen) return null;

  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageName.trim()) return;

    await savePipelineStage({
      name: newStageName.trim(),
      order_index: stages.length,
    });
    setNewStageName('');
    onRefresh();
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete stage "${name}"? Contacts in this stage may need to be reassigned.`)) {
      await deletePipelineStage(id);
      onRefresh();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-6 shadow-2xl space-y-4 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-[#CFC3AB]/60 dark:border-[#1D2830]">
          <h3 className="font-display text-lg font-bold text-[#14181B] dark:text-[#E7ECEC] flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-[#2E9C82] dark:text-[#8FE0CE]" />
            <span>Manage Pipeline Stages</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#6B655F] dark:text-[#98A6AD] hover:text-[#14181B] dark:hover:text-[#E7ECEC]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Stage Form */}
        <form onSubmit={handleAddStage} className="flex gap-2">
          <input
            type="text"
            required
            value={newStageName}
            onChange={(e) => setNewStageName(e.target.value)}
            placeholder="New stage name (e.g. Negotiation)"
            className="flex-1 px-4 py-2 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] text-xs focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#D9551F] hover:bg-[#B84214] dark:bg-[#FF7A47] dark:hover:bg-[#FF9066] text-white dark:text-[#0B0F14] transition-all cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>

        {/* Stages List */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830]"
            >
              <span className="text-xs font-bold text-[#14181B] dark:text-[#E7ECEC]">{stage.name}</span>

              {stages.length > 1 && (
                <button
                  onClick={() => handleDelete(stage.id, stage.name)}
                  className="p-1.5 rounded-lg text-[#6B655F] dark:text-[#98A6AD] hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-3 border-t border-[#CFC3AB]/60 dark:border-[#1D2830]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl font-bold bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] hover:border-[#D9551F] dark:hover:border-[#FF7A47] transition-all cursor-pointer text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
