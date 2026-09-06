'use client';

import React from 'react';
import { PipelineContact, PipelineStage } from '@/types';
import { ExternalLink, Edit2, Trash2, ArrowRight, ArrowLeft, Calendar, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ContactCardProps {
  contact: PipelineContact;
  stages: PipelineStage[];
  onEdit: (c: PipelineContact) => void;
  onDelete: (id: string) => void;
  onMoveStage: (contactId: string, targetStageId: string) => void;
}

export default function ContactCard({
  contact,
  stages,
  onEdit,
  onDelete,
  onMoveStage,
}: ContactCardProps) {
  const currentStageIndex = stages.findIndex((s) => s.id === contact.current_stage_id);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentStageIndex > 0) {
      onMoveStage(contact.id, stages[currentStageIndex - 1].id);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentStageIndex < stages.length - 1) {
      onMoveStage(contact.id, stages[currentStageIndex + 1].id);
    }
  };

  return (
    <div className="group bg-white dark:bg-[#111622] border-[#E2DDD5] dark:border-[#1E2738] shadow-sm hover:border-slate-700/80 rounded-2xl p-3.5 shadow-md space-y-2.5 transition-all text-xs">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-bold text-[#1C1917] dark:text-[#F8FAFC] text-sm leading-tight">{contact.name}</h4>
          {contact.linkedin_url && (
            <a
              href={contact.linkedin_url.startsWith('http') ? contact.linkedin_url : `https://${contact.linkedin_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-[#1E826C] dark:text-[#2DD4BF] hover:text-cyan-300 mt-0.5 hover:underline"
            >
              <span>LinkedIn Profile</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(contact)}
            className="p-1 rounded hover:bg-[#E2DDD5] dark:bg-[#1E2738] text-[#78716C] dark:text-[#94A3B8] hover:text-slate-200"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(contact.id)}
            className="p-1 rounded hover:bg-rose-950/30 text-[#78716C] dark:text-[#94A3B8] hover:text-rose-400"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {contact.notes && (
        <p className="text-[11px] text-[#78716C] dark:text-[#94A3B8] bg-[#F5F2EB]/80 dark:bg-[#090C11]/60 p-2.5 rounded-xl border border-[#E2DDD5] dark:border-[#1E2738] line-clamp-3 leading-relaxed">
          {contact.notes}
        </p>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-[#E2DDD5] dark:border-[#1E2738] text-[10px] text-[#78716C] dark:text-[#64748B]">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-[#78716C] dark:text-[#64748B]" />
          <span>
            {contact.last_contact_date
              ? format(parseISO(contact.last_contact_date + 'T12:00:00'), 'MMM d, yyyy')
              : 'No contact date'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {currentStageIndex > 0 && (
            <button
              onClick={handlePrev}
              title={`Move to ${stages[currentStageIndex - 1]?.name}`}
              className="p-1 rounded hover:bg-[#E2DDD5] dark:bg-[#1E2738] text-[#78716C] dark:text-[#94A3B8] hover:text-[#1C1917] dark:text-[#F8FAFC]"
            >
              <ArrowLeft className="w-3 h-3" />
            </button>
          )}

          {currentStageIndex < stages.length - 1 && (
            <button
              onClick={handleNext}
              title={`Move to ${stages[currentStageIndex + 1]?.name}`}
              className="p-1 rounded hover:bg-[#E2DDD5] dark:bg-[#1E2738] text-[#78716C] dark:text-[#94A3B8] hover:text-[#1C1917] dark:text-[#F8FAFC]"
            >
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}