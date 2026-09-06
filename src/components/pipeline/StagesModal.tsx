'use client';

import React, { useState } from 'react';
import { PipelineStage } from '@/types';
import { Settings2, Plus, Trash2, ArrowUp, ArrowDown, X } from 'lucide-react';

interface StagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  stages: PipelineStage[];
  onSaveStage: (stage: Partial<PipelineStage> & { name: string }) => void;
  onDeleteStage: (id: string) => void;
}

export default function StagesModal({
  isOpen,
  onClose,
  stages,
  onSaveStage,
  onDeleteStage,
}: StagesModalProps) {
  const [newStageName, setNewStageName] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageName.trim()) return;
    onSaveStage({
      name: newStageName.trim(),
      order_index: stages.length + 1,
    });
    setNewStageName('');
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= stages.length) return;

    const currentStage = stages[index];
    const targetStage = stages[targetIndex];

    onSaveStage({ ...currentStage, order_index: targetStage.order_index });
    onSaveStage({ ...targetStage, order_index: currentStage.order_index });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#111622] border border-[#E2DDD5] dark:border-[#1E2738] shadow-2xl transition-colors rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2DDD5] dark:border-[#1E2738]">
          <h3 className="text-lg font-bold text-[#1C1917] dark:text-[#F8FAFC] flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-[#1E826C] dark:text-[#2DD4BF]" />
            <span>Manage Pipeline Stages</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-[#78716C] dark:text-[#94A3B8] hover:text-[#1C1917] dark:text-[#F8FAFC]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            required
            value={newStageName}
            onChange={(e) => setNewStageName(e.target.value)}
            placeholder="New stage name (e.g. Negotiation)"
            className="flex-1 px-4 py-2 rounded-xl bg-[#F5F2EB] dark:bg-[#090C11] border border-[#E2DDD5] dark:border-[#1E2738] text-[#1C1917] dark:text-[#F8FAFC] text-xs placeholder-slate-500 focus:outline-none focus:border-[#1E826C] dark:focus:border-[#2DD4BF]"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#1E826C] hover:bg-[#176655] dark:bg-[#2DD4BF] dark:hover:bg-[#14B8A6] text-white dark:text-[#090C11] font-bold text-xs flex items-center gap-1 shadow-md shadow-cyan-500/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {stages.map((stage, idx) => (
            <div
              key={stage.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F2EB]/60 dark:bg-[#090C11]/50 border border-[#E2DDD5] dark:border-[#1E2738] text-xs"
            >
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <span className="w-5 h-5 rounded-lg bg-[#E2DDD5] dark:bg-[#1E2738] flex items-center justify-center text-[10px] text-[#78716C] dark:text-[#94A3B8]">
                  {idx + 1}
                </span>
                <span>{stage.name}</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleMove(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1 rounded hover:bg-[#E2DDD5] dark:bg-[#1E2738] disabled:opacity-30 text-[#78716C] dark:text-[#94A3B8] hover:text-[#1C1917] dark:text-[#F8FAFC]"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleMove(idx, 'down')}
                  disabled={idx === stages.length - 1}
                  className="p-1 rounded hover:bg-[#E2DDD5] dark:bg-[#1E2738] disabled:opacity-30 text-[#78716C] dark:text-[#94A3B8] hover:text-[#1C1917] dark:text-[#F8FAFC]"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteStage(stage.id)}
                  className="p-1 rounded hover:bg-rose-950/30 text-[#78716C] dark:text-[#94A3B8] hover:text-rose-400 ml-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-[#E2DDD5] dark:border-[#1E2738]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#E2DDD5] dark:bg-[#1E2738] hover:bg-slate-700 text-[#57534E] dark:text-[#94A3B8]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}