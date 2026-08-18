import React, { useState, useEffect, useCallback } from 'react';
import { supabaseApi } from './supabase';
import { NilDeal } from './types';
import { Shield, Check, X, FileText, Calendar, DollarSign, Info } from 'lucide-react';
import { useToast, useConfirmDialog } from '../ui/overlays';

export default function ComplianceQueue() {
  const [deals, setDeals] = useState<(NilDeal & { athlete_name: string; athlete_email: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { showToast } = useToast();
  const { openConfirm } = useConfirmDialog();

  const fetchPendingDeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pending = await supabaseApi.getPendingDeals();
      setDeals(pending);
    } catch (err) {
      console.error(err);
      setError('Failed to load pending deals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => fetchPendingDeals());
  }, [fetchPendingDeals]);

  // Format cents to dollars
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(cents / 100);
  };

  // Open confirmation modal
  const handleTriggerAction = (deal: NilDeal & { athlete_name: string; athlete_email: string }, action: 'clear' | 'reject') => {
    openConfirm({
      title: action === 'clear' ? 'Clear NIL Disclosure' : 'Reject NIL Disclosure',
      description: action === 'clear'
        ? `Confirm approval of ${deal.company_name} contract for ${deal.athlete_name}. This clears the deal for compliance and notifies the athlete.`
        : `Confirm rejection of ${deal.company_name} contract for ${deal.athlete_name}. The athlete will be notified of the rejection reason.`,
      actionLabel: action === 'clear' ? 'Clear Contract' : 'Reject Contract',
      destructive: action === 'reject',
      requiresReason: action === 'reject',
      reasonPlaceholder: 'e.g. Conflicting category exclusivity, insufficient valuation disclosure...',
      onConfirm: async (reason) => {
        const nextStatus = action === 'clear' ? 'cleared' : 'rejected';
        const metadata = action === 'reject'
          ? { reason: reason || 'No reason provided' }
          : { reason: 'Meets university conference standards and compliance thresholds.' };
        await supabaseApi.updateDealStatus(deal.id, nextStatus, metadata);
        showToast(`Deal ${action === 'clear' ? 'cleared' : 'rejected'} successfully`, 'success');
        fetchPendingDeals();
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded p-4 text-red-400 text-xs font-mono flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Overview Intro Banner */}
      <div className="bg-neutral-900/50 p-4 rounded border border-neutral-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
            <Shield className="w-4 h-4 text-[#C6FF3D]" /> NIL Compliance Queue
          </h2>
          <p className="text-[10px] text-neutral-500 font-mono mt-0.5">Review disclosed athlete brand contracts to prevent violations and maintain conference eligibility rules.</p>
        </div>
        <span className="text-[10px] bg-[#C6FF3D]/10 text-[#C6FF3D] py-1 px-2.5 rounded font-bold uppercase border border-[#C6FF3D]/20 font-mono">
          {deals.length} Pending Audits
        </span>
      </div>

      {/* Compliance Table */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-neutral-500 space-y-2 font-mono">
            <div className="w-5 h-5 animate-spin border border-[#C6FF3D] border-t-transparent rounded-full mx-auto"></div>
            <p className="text-xs">Loading Pending NIL Disclosures...</p>
          </div>
        ) : deals.length === 0 ? (
          <div className="py-12 text-center text-neutral-500 font-mono space-y-1">
            <Shield className="w-10 h-10 text-neutral-700 mx-auto mb-2" />
            <p className="font-bold text-neutral-400 uppercase text-xs">All Clear!</p>
            <p className="text-[10px] text-neutral-500">There are no pending contract disclosures in the audit queue.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/50">
            {deals.map((deal) => (
              <div key={deal.id} className="p-4 hover:bg-neutral-900/20 transition-colors space-y-3">
                {/* Row Header: Athlete & Brand Title */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-2">
                      {deal.company_name} <span className="text-[10px] text-neutral-500 font-normal">with</span> {deal.athlete_name}
                    </h3>
                    <p className="text-[10px] text-[#C6FF3D] mt-0.5 font-mono">{deal.athlete_email}</p>
                  </div>
                  
                  {/* Financial & Comp Badges */}
                  <div className="flex items-center gap-2">
                    <span className="bg-[#050505] px-2 py-0.5 rounded border border-neutral-800 text-[10px] font-bold text-[#C6FF3D] font-mono">
                      {formatCurrency(deal.deal_value)}
                    </span>
                    <span className="bg-[#050505] text-neutral-400 border border-neutral-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono">
                      {deal.compensation_type}
                    </span>
                  </div>
                </div>

                {/* Deal Contract Description / Details */}
                <div className="bg-[#050505] p-3 rounded border border-neutral-800/60 text-xs text-neutral-300 leading-relaxed font-mono">
                  <p className="font-bold text-[10px] text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Info className="w-3 h-3" /> Deal Parameters / Deliverables
                  </p>
                  {deal.description || 'No contract description provided.'}
                </div>

                {/* Contract Meta Footer (Dates, Doc files, Actions) */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-1">
                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-neutral-400 font-mono">
                    {/* Dates */}
                    <div className="flex items-center gap-1.5 bg-[#050505] px-2 py-0.5 rounded border border-neutral-800">
                      <Calendar className="w-3 h-3 text-neutral-500" />
                      <span>{deal.start_date || 'N/A'}</span>
                      <span className="text-neutral-600">to</span>
                      <span>{deal.end_date || 'Ongoing'}</span>
                    </div>

                    {/* PDF Document URL */}
                    {deal.document_url ? (
                      <a
                        href={deal.document_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[#C6FF3D] hover:underline cursor-pointer bg-[#C6FF3D]/5 border border-[#C6FF3D]/10 px-2 py-0.5 rounded transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                        PDF Contract
                      </a>
                    ) : (
                      <span className="text-neutral-600 italic bg-[#050505] px-2 py-0.5 rounded border border-neutral-800/40">No PDF attached</span>
                    )}
                  </div>

                  {/* Actions (Approve / Reject) */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleTriggerAction(deal, 'reject')}
                      className="inline-flex items-center gap-1 py-1 px-2.5 bg-red-950/10 border border-red-500/20 hover:border-red-500 text-red-400 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" /> Reject
                    </button>
                    <button
                      onClick={() => handleTriggerAction(deal, 'clear')}
                      className="inline-flex items-center gap-1 py-1 px-2.5 bg-[#C6FF3D]/10 border border-[#C6FF3D]/20 hover:bg-[#C6FF3D] hover:text-black hover:border-[#C6FF3D] text-[#C6FF3D] rounded text-[10px] font-bold uppercase transition-all cursor-pointer"
                    >
                      <Check className="w-3 h-3" /> Clear
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
