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
} from '@/lib/storage';
import { PipelineContact, PipelineStage } from '@/types';
import { Users, Plus, Settings2, Search } from 'lucide-react';

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
    } catch (err) {
      console.error('Error loading pipeline:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open add modal
  const handleOpenAdd = (stageId?: string) => {
    setEditingContact(null);
    setDefaultStageId(stageId || (stages[0]?.id ?? ''));
    setShowContactModal(true);
  };

  // Open edit modal
  const handleEditContact = (contact: PipelineContact) => {
    setEditingContact(contact);
    setDefaultStageId(contact.current_stage_id);
    setShowContactModal(true);
  };

  // Save contact
  const handleSaveContact = async (data: {
    name: string;
    current_stage_id: string;
    linkedin_url?: string | null;
    last_contact_date?: string | null;
    notes?: string | null;
  }) => {
    await savePipelineContact({
      ...data,
      id: editingContact?.id,
    });
    setShowContactModal(false);
    loadData();
  };

  // Delete contact
  const handleDeleteContact = async (id: string) => {
    if (confirm('Delete this contact from pipeline?')) {
      await deletePipelineContact(id);
      loadData();
    }
  };

  // Move contact to another stage
  const handleMoveStage = async (contact: PipelineContact, newStageId: string) => {
    await savePipelineContact({
      ...contact,
      current_stage_id: newStageId,
    });
    loadData();
  };

  // Filter contacts by search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.notes && c.notes.toLowerCase().includes(q)) ||
        (c.linkedin_url && c.linkedin_url.toLowerCase().includes(q))
    );
  }, [contacts, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#14181B] dark:text-[#E7ECEC] flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#2E9C82] dark:text-[#8FE0CE]" />
            <span>Executive Pipeline & Network</span>
          </h1>
          <p className="text-xs text-[#6B655F] dark:text-[#98A6AD] mt-0.5 font-sans">
            Client engagements, strategic partnerships, and stage-gate progression.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStagesModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] hover:border-[#D9551F] dark:hover:border-[#FF7A47] text-[#14181B] dark:text-[#E7ECEC] transition-all cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-[#2E9C82] dark:text-[#8FE0CE]" />
            <span>Edit Stages</span>
          </button>

          <button
            onClick={() => handleOpenAdd()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#D9551F] hover:bg-[#B84214] dark:bg-[#FF7A47] dark:hover:bg-[#FF9066] text-white dark:text-[#0B0F14] shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Summary */}
      <div className="bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-4 shadow-sm dark:shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B655F] dark:text-[#98A6AD]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, notes, LinkedIn..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB] dark:border-[#1D2830] text-[#14181B] dark:text-[#E7ECEC] placeholder-[#6B655F]/60 dark:placeholder-[#98A6AD]/50 text-xs focus:outline-none focus:border-[#D9551F] dark:focus:border-[#FF7A47]"
          />
        </div>

        <div className="text-xs font-mono text-[#6B655F] dark:text-[#98A6AD]">
          Total Contacts: <span className="font-bold text-[#14181B] dark:text-[#E7ECEC]">{contacts.length}</span> across{' '}
          <span className="font-bold text-[#14181B] dark:text-[#E7ECEC]">{stages.length}</span> stages
        </div>
      </div>

      {/* Kanban Stages Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 items-start">
        {stages.map((stage) => {
          const stageContacts = filteredContacts.filter((c) => c.current_stage_id === stage.id);

          return (
            <div
              key={stage.id}
              className="w-80 shrink-0 bg-[#E2DAC8] dark:bg-[#121A21] border border-[#CFC3AB] dark:border-[#1D2830] rounded-3xl p-4 flex flex-col min-h-[480px] shadow-sm dark:shadow-xl transition-colors"
            >
              {/* Stage Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#CFC3AB]/60 dark:border-[#1D2830]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D9551F] dark:bg-[#FF7A47]" />
                  <span className="font-display font-bold text-sm text-[#14181B] dark:text-[#E7ECEC]">
                    {stage.name}
                  </span>
                  <span className="text-xs font-mono text-[#6B655F] dark:text-[#98A6AD] px-2 py-0.5 rounded-full bg-[#EBE3D3] dark:bg-[#0B0F14] border border-[#CFC3AB]/60 dark:border-[#1D2830]">
                    {stageContacts.length}
                  </span>
                </div>

                <button
                  onClick={() => handleOpenAdd(stage.id)}
                  className="p-1 rounded-lg text-[#6B655F] dark:text-[#98A6AD] hover:text-[#14181B] dark:hover:text-[#E7ECEC] hover:bg-[#CFC3AB]/40 dark:hover:bg-[#1D2830] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Contact Cards in Stage */}
              <div className="flex-1 space-y-3">
                {stageContacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    allStages={stages}
                    onEdit={handleEditContact}
                    onDelete={handleDeleteContact}
                    onMoveStage={handleMoveStage}
                  />
                ))}

                {stageContacts.length === 0 && (
                  <div className="h-32 flex items-center justify-center border border-dashed border-[#CFC3AB] dark:border-[#1D2830] rounded-2xl text-xs text-[#6B655F] dark:text-[#98A6AD] font-sans">
                    No contacts in this stage
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
        editingContact={editingContact}
        onSave={handleSaveContact}
      />

      <StagesModal
        isOpen={showStagesModal}
        onClose={() => setShowStagesModal(false)}
        stages={stages}
        onRefresh={loadData}
      />
    </div>
  );
}
