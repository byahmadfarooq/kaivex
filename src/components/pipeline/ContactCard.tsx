'use client';

import React, { useState } from 'react';
import { PipelineContact, PipelineStage } from '@/types';
import { Building, Mail, Phone, Calendar, ArrowRight, Edit2, Trash2, Globe } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ContactCardProps {
  contact: PipelineContact;
  allStages: PipelineStage[];
  onEdit: (contact: PipelineContact) => void;
  onDelete: (id: string) => void;
  onMoveStage: (contact: PipelineContact, stageId: string) => void;
}

export default function ContactCard({
  contact,
  allStages,
  onEdit,
  onDelete,
  onMoveStage,
}: ContactCardProps) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  return (
    <div className="p-3.5 rounded-2xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] shadow-sm hover:border-[#D9551F] dark:hover:border-[#FF7A47] transition-all space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-display font-bold text-sm text-[#14181B] dark:text-[#E7ECEC]">
            {contact.name}
          </h4>
          {contact.linkedin_url && (
            <a
              href={contact.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-[#2E9C82] dark:text-[#8FE0CE] hover:underline font-mono"
            >
              <Globe className="w-3 h-3" />
              <span>LinkedIn Profile</span>
            </a>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(contact)}
            className="p-1 rounded-lg text-[#6B655F] dark:text-[#98A6AD] hover:text-[#14181B] dark:hover:text-[#E7ECEC] transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(contact.id)}
            className="p-1 rounded-lg text-[#6B655F] dark:text-[#98A6AD] hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {contact.notes && (
        <p className="text-xs text-[#6B655F] dark:text-[#98A6AD] italic bg-[#E2DAC8] dark:bg-[#121A21] p-2 rounded-xl border border-[#CFC3AB]/50 dark:border-[#1D2830] font-sans">
          "{contact.notes}"
        </p>
      )}

      {/* Move Stage Selector */}
      <div className="relative pt-2 border-t border-[#CFC3AB]/50 dark:border-[#1D2830] flex items-center justify-between text-[11px]">
        {contact.last_contact_date ? (
          <span className="font-mono text-[#6B655F] dark:text-[#98A6AD]">
            Contact: {format(parseISO(contact.last_contact_date + 'T12:00:00'), 'MMM d')}
          </span>
        ) : (
          <span className="text-[#6B655F] dark:text-[#98A6AD]">No date set</span>
        )}

        <div className="relative">
          <button
            onClick={() => setShowMoveMenu(!showMoveMenu)}
            className="flex items-center gap-1 text-[#6B655F] dark:text-[#98A6AD] hover:text-[#14181B] dark:hover:text-[#E7ECEC] font-semibold"
          >
            <span>Move Stage</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          {showMoveMenu && (
            <div className="absolute right-0 bottom-6 z-20 w-36 bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-xl shadow-xl py-1">
              {allStages.filter((s) => s.id !== contact.current_stage_id).map((targetStage) => (
                <button
                  key={targetStage.id}
                  onClick={() => {
                    onMoveStage(contact, targetStage.id);
                    setShowMoveMenu(false);
                  }}
                  className="w-full text-left px-3 py-1 text-xs text-[#14181B] dark:text-[#E7ECEC] hover:bg-[#D9551F] hover:text-white dark:hover:bg-[#FF7A47] dark:hover:text-[#0B0F14] transition-colors"
                >
                  {targetStage.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
