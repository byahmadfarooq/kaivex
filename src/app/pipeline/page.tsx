'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDate } from '@/context/DateContext';
import ContactCard from '@/components/pipeline/ContactCard';
import ContactModal from '@/components/pipeline/ContactModal';
import StagesModal from '@/components/pipeline/StagesModal';
import {
  getPipelineStages,
  getPipelineContacts,
  savePipelineContact,
  deletePipelineContact,
  savePipelineStage,
  deletePipelineStage,
} from '@/lib/storage';
import { PipelineContact, PipelineStage } from '@/types';
import { Users, Plus, Settings2, Search, Sparkles, Building, PhoneCall } from 'lucide-react';

export default function PipelinePage() {
  const { selectedDate } = useDate();
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [contacts, setContacts] = useState<PipelineContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showContactModal, setShowContactModal] = useState(false);
  const [showStagesModal, setShowStagesModal] = useState(false);
  const [editingContact, setEditingContact] = useState<PipelineContact | null>(null);
  const [defaultStageId, setDefaultStageId] = useState<string>('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedStages, fetchedContacts] = await Promise.all([
        getPipelineStages(),
        getPipelineContacts(),
      ]);
      setStages(fetchedStages);
      setContacts(fetchedContacts);
      if (fetchedStages.length > 0 && !defaultStageId) {
        setDefaultStageId(fetchedStages[0].id);
      }
    } catch (err) {
      console.error('Error loading pipeline:', err);
    } finally {
      setLoading(false);
    }
  }, [defaultStageId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter contacts by search
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.notes && c.notes.toLowerCase().includes(q))
    );
  }, [contacts, searchQuery]);

  // Move Contact to another stage
  const handleMoveStage = async (contactId: string, targetStageId: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return;

    const updated = {
      ...contact,
      current_stage_id: targetStageId,
    };

    setContacts((prev) => prev.map((c) => (c.id === contactId ? updated : c)));
    await savePipelineContact(updated);
  };

  // Save Contact
  const handleSaveContact = async (contactData: Partial<PipelineContact> & { name: string; current_stage_id: string }) => {
    await savePipelineContact(contactData);
    setEditingContact(null);
    loadData();
  };

  // Delete Contact
  const handleDeleteContact = async (id: string) => {
    if (confirm('Remove this contact from the pipeline?')) {
      await deletePipelineContact(id);
      loadData();
    }
  };

  // Save / Reorder Stage
  const handleSaveStage = async (stage: Partial<PipelineStage> & { name: string }) => {
    await savePipelineStage(stage);
    loadData();
  };

  // Delete Stage
  const handleDeleteStage = async (id: string) => {
    if (confirm('Delete this stage? Any leads in this stage will be removed.')) {
      await deletePipelineStage(id);
      loadData();
    }
  };

  const handleOpenAdd = (stageId: string) => {
    setDefaultStageId(stageId);
    setEditingContact(null);
    setShowContactModal(true);
  };

  const handleOpenEdit = (contact: PipelineContact) => {
    setEditingContact(contact);
    setDefaultStageId(contact.current_stage_id);
    setShowContactModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1C1917] dark:text-[#F8FAFC] flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#1E826C] dark:text-[#2DD4BF]" />
            <span>LinkedIn Lead Pipeline</span>
          </h1>
          <p className="text-xs text-[#78716C] dark:text-[#94A3B8] mt-0.5">
            Lightweight CRM for relationship management and deal progression.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStagesModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#F5F2EB] dark:bg-[#090C11] border border-[#E2DDD5] dark:border-[#1E2738]/60 hover:border-slate-600 text-[#57534E] dark:text-[#94A3B8] hover:text-[#1C1917] dark:text-[#F8FAFC] text-xs font-semibold transition-all cursor-pointer"
          >
            <Settings2 className="w-4 h-4 text-[#1E826C] dark:text-[#2DD4BF]" />
            <span>Stages</span>
          </button>

          <button
            onClick={() => handleOpenAdd(stages[0]?.id || '')}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#1E826C] hover:bg-[#176655] dark:bg-[#2DD4BF] dark:hover:bg-[#14B8A6] text-white dark:text-[#090C11] font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Metric Strip & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111622] border border-[#E2DDD5] dark:border-[#1E2738] shadow-sm dark:shadow-xl transition-colors p-4 rounded-3xl">
        <div className="flex items-center gap-6 text-xs">
          <div>
            <span className="text-[#78716C] dark:text-[#94A3B8]">Total Leads: </span>
            <span className="font-bold text-[#1C1917] dark:text-[#F8FAFC] text-sm">{contacts.length}</span>
          </div>
          <div>
            <span className="text-[#78716C] dark:text-[#94A3B8]">Active Stages: </span>
            <span className="font-bold text-[#1E826C] dark:text-[#2DD4BF] text-sm">{stages.length}</span>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#78716C] dark:text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads or notes..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F5F2EB] dark:bg-[#090C11] border border-[#E2DDD5] dark:border-[#1E2738] text-[#1C1917] dark:text-[#F8FAFC] text-xs placeholder-slate-500 focus:outline-none focus:border-[#1E826C] dark:focus:border-[#2DD4BF]"
          />
        </div>
      </div>

      {/* Pipeline Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
        {stages.map((stage) => {
          const stageContacts = filteredContacts.filter((c) => c.current_stage_id === stage.id);

          return (
            <div
              key={stage.id}
              className="bg-[#F5F2EB]/90 dark:bg-[#0D121D] border-[#E2DDD5] dark:border-[#1E2738] rounded-3xl p-3.5 flex flex-col min-h-[520px] shadow-lg"
            >
              {/* Stage Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E2DDD5] dark:border-[#1E2738] mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
                    {stage.name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E2DDD5] dark:bg-[#1E2738] text-[#57534E] dark:text-[#94A3B8] font-semibold">
                    {stageContacts.length}
                  </span>
                </div>

                <button
                  onClick={() => handleOpenAdd(stage.id)}
                  title={`Add lead to ${stage.name}`}
                  className="p-1 rounded-lg bg-[#E2DDD5] dark:bg-[#1E2738]/60 hover:bg-slate-700 text-[#78716C] dark:text-[#94A3B8] hover:text-[#1C1917] dark:text-[#F8FAFC] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Contact Cards */}
              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {stageContacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    stages={stages}
                    onEdit={handleOpenEdit}
                    onDelete={handleDeleteContact}
                    onMoveStage={handleMoveStage}
                  />
                ))}

                {stageContacts.length === 0 && (
                  <div
                    onClick={() => handleOpenAdd(stage.id)}
                    className="h-28 rounded-2xl border border-dashed border-[#E2DDD5] dark:border-[#1E2738] hover:border-slate-700 flex flex-col items-center justify-center text-slate-600 hover:text-[#78716C] dark:text-[#94A3B8] transition-colors cursor-pointer text-center p-3"
                  >
                    <Plus className="w-4 h-4 mb-1 opacity-50" />
                    <span className="text-[11px]">Add lead</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        stages={stages}
        defaultStageId={defaultStageId}
        defaultDate={selectedDate}
        editingContact={editingContact}
        onSave={handleSaveContact}
      />

      <StagesModal
        isOpen={showStagesModal}
        onClose={() => setShowStagesModal(false)}
        stages={stages}
        onSaveStage={handleSaveStage}
        onDeleteStage={handleDeleteStage}
      />
    </div>
  );
}