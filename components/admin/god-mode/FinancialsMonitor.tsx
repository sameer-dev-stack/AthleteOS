import React, { useState, useEffect, useCallback } from 'react';
import { supabaseApi } from './supabase';
import { Profile } from './types';
import { DollarSign, Landmark, HelpCircle, Briefcase, Award, ArrowUpRight, ShieldAlert } from 'lucide-react';

export default function FinancialsMonitor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'incomplete' | 'none'>('all');
  const [athletes, setAthletes] = useState<(Profile & { tips_total: number; deals_total: number })[]>([]);
  const [aggregates, setAggregates] = useState({
    totalTips: 0,
    totalDealsDisclosed: 0,
    platformFeeRevenue: 0
  });

  const fetchFinancialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await supabaseApi.getPayoutData(statusFilter);
      setAthletes(data.athletes);
      setAggregates(data.aggregates);
    } catch (err) {
      console.error(err);
      setError('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  // Convert cents to formatted USD String
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  return (
    <div className="space-y-6">
      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded p-4 text-red-400 text-xs font-mono">
          {error}
        </div>
      )}

      {/* Aggregates Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Tips */}
        <div className="bg-neutral-900/50 p-4 rounded border border-neutral-800 relative overflow-hidden group">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-neutral-900 rounded text-[#C6FF3D]">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Total Tipping Volume</p>
              <h3 className="text-lg font-black text-white font-mono mt-0.5">{formatCurrency(aggregates.totalTips)}</h3>
            </div>
          </div>
        </div>

        {/* Card 2: Platform Revenue */}
        <div className="bg-neutral-900/50 p-4 rounded border border-neutral-800 relative overflow-hidden group">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-neutral-900 rounded text-[#C6FF3D]">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Platform Fee Revenue (5%)</p>
              <h3 className="text-lg font-black text-[#C6FF3D] font-mono mt-0.5">{formatCurrency(aggregates.platformFeeRevenue)}</h3>
            </div>
          </div>
        </div>

        {/* Card 3: Total Deals Disclosed */}
        <div className="bg-neutral-900/50 p-4 rounded border border-neutral-800 relative overflow-hidden group">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-neutral-900 rounded text-blue-400">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Disclosed Deal Volume</p>
              <h3 className="text-lg font-black text-white font-mono mt-0.5">{formatCurrency(aggregates.totalDealsDisclosed)}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-900/50 p-4 rounded border border-neutral-800">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-white">Athlete Payout Monitor</h3>
          <p className="text-[10px] text-neutral-500 font-mono mt-0.5">Filter athletes based on their Stripe Connected status.</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'complete', 'incomplete', 'none'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded text-[10px] font-bold border transition-colors cursor-pointer uppercase font-mono ${
                statusFilter === filter 
                  ? 'bg-neutral-900 border-[#C6FF3D]/30 text-[#C6FF3D]' 
                  : 'bg-[#050505] border-neutral-800 text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {filter === 'all' && 'All Athletes'}
              {filter === 'complete' && 'Stripe Complete'}
              {filter === 'incomplete' && 'Incomplete'}
              {filter === 'none' && 'No Stripe'}
            </button>
          ))}
        </div>
      </div>

      {/* Athlete Payout Table */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-900/80 border-b border-neutral-800 text-[10px] font-black uppercase tracking-wider text-neutral-400">
                <th className="py-3 px-4">Athlete</th>
                <th className="py-3 px-4">Stripe Connected ID</th>
                <th className="py-3 px-4">Onboarding</th>
                <th className="py-3 px-4 text-right">Tipping (Net)</th>
                <th className="py-3 px-4 text-right">Cleared Deals</th>
                <th className="py-3 px-4 text-right">Platform Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-500 font-mono">
                    <div className="w-5 h-5 animate-spin border border-[#C6FF3D] border-t-transparent rounded-full mx-auto mb-2"></div>
                    Fetching Financial Data...
                  </td>
                </tr>
              ) : athletes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-500 font-mono">
                    No athletes matching this Stripe onboarding filter found.
                  </td>
                </tr>
              ) : (
                athletes.map((a) => {
                  const tipsFee = Math.round(a.tips_total * 0.05);
                  return (
                    <tr key={a.id} className="hover:bg-neutral-900/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{a.full_name || 'Anonymous'}</div>
                        <div className="text-[10px] text-neutral-400">{a.sport} · {a.school}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-neutral-400">
                        {a.stripe_account_id ? (
                          <span className="bg-[#050505] border border-neutral-800 px-2 py-0.5 rounded font-mono">
                            {a.stripe_account_id}
                          </span>
                        ) : (
                          <span className="text-neutral-600 italic">None Connected</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {a.stripe_account_id ? (
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            a.stripe_onboarding_complete 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                          }`}>
                            {a.stripe_onboarding_complete ? 'Complete' : 'Incomplete'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-neutral-500 uppercase font-bold">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-neutral-200 font-mono">
                        {formatCurrency(a.tips_total)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-neutral-200 font-mono">
                        {formatCurrency(a.deals_total)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#C6FF3D] font-mono">
                        {formatCurrency(tipsFee)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
