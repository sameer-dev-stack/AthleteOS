import React, { useState, useEffect, useCallback } from 'react';
import { supabaseApi } from './supabase';
import { RateLimit, Profile } from './types';
import { ShieldAlert, ShieldCheck, AlertTriangle, UserMinus, Globe, RefreshCcw, Lock, X } from 'lucide-react';

export default function AbuseDashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rateLimits, setRateLimits] = useState<RateLimit[]>([]);
  const [suspendedAccounts, setSuspendedAccounts] = useState<(Profile & { suspension_reason: string })[]>([]);

  // Confirmation Modal for Reactivation
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Profile | null>(null);

  const fetchSecurityData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await supabaseApi.getSecurityDashboard();
      setRateLimits(data.rateLimits);
      setSuspendedAccounts(data.suspendedAccounts);
    } catch (err) {
      console.error(err);
      setError('Failed to load security data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => fetchSecurityData());
  }, [fetchSecurityData]);

  // Handle Reactivate Trigger
  const handleTriggerReactivate = (athlete: Profile) => {
    setSelectedAthlete(athlete);
    setModalOpen(true);
  };

  const handleConfirmReactivate = async () => {
    if (!selectedAthlete) return;
    setActionLoading(true);
    try {
      await supabaseApi.updateProfileField(
        selectedAthlete.id,
        { suspended: false },
        'USER_ACTIVATED',
        { reason: 'Reactivated from Security Abuse Desk.' }
      );
      fetchSecurityData();
    } catch (err) {
      console.error(err);
      setError('Failed to reactivate account');
    } finally {
      setActionLoading(false);
      setModalOpen(false);
      setSelectedAthlete(null);
    }
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

      {/* Overview Intro Box */}
      <div className="bg-neutral-900/50 p-4 rounded border border-neutral-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="space-y-0.5">
          <h2 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wider">
            <Lock className="w-4 h-4 text-red-500" /> Platform Security & Abuse Desk
          </h2>
          <p className="text-[10px] text-neutral-500 font-mono">Monitor suspicious IP traffic, block automated scrapers, and manage account suspensions.</p>
        </div>
        <button
          onClick={fetchSecurityData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-950 hover:bg-neutral-900 text-[10px] font-mono font-bold text-[#C6FF3D] rounded border border-neutral-850 uppercase tracking-wider transition-colors cursor-pointer"
        >
          <RefreshCcw className="w-3 h-3" /> Refresh Feeds
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Rate Limits Exceeding Threshold Ledger */}
        <div className="bg-neutral-900/50 p-4 rounded border border-neutral-800 space-y-3">
          <div>
            <h3 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-red-500" /> Rate-Limiting Violations
            </h3>
            <p className="text-[10px] text-neutral-500 font-mono mt-0.5">IP addresses triggered with high frequency, potential login attempts, or scraper bots.</p>
          </div>

          <div className="border border-neutral-800 rounded overflow-hidden bg-[#050505]/30">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono">
                <thead>
                  <tr className="bg-[#050505]/80 border-b border-neutral-800 text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                    <th className="py-2 px-3">Identifier / Key</th>
                    <th className="py-2 px-3 text-center">Hits</th>
                    <th className="py-2 px-3 text-right">Window Start</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-850 text-[10px]">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-neutral-500 font-mono">Querying security violations...</td>
                    </tr>
                  ) : rateLimits.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-neutral-500 font-mono italic">No rate limit violations exceeding thresholds.</td>
                    </tr>
                  ) : (
                    rateLimits.map((rl) => (
                      <tr key={rl.id} className="hover:bg-neutral-900/40 transition-colors">
                        <td className="py-2 px-3 font-mono text-neutral-300 flex items-center gap-1.5">
                          <Globe className="w-3 h-3 text-neutral-500" />
                          {rl.key}
                        </td>
                        <td className="py-2 px-3 text-center font-bold">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                            rl.count > 100 
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                              : 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                          }`}>
                            {rl.count} hits
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right text-neutral-500">
                          {new Date(rl.window_start).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Suspended Athlete Accounts Table */}
        <div className="bg-neutral-900/50 p-4 rounded border border-neutral-800 space-y-3">
          <div>
            <h3 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wider">
              <UserMinus className="w-4 h-4 text-neutral-400" /> Suspended Athlete Accounts
            </h3>
            <p className="text-[10px] text-neutral-500 font-mono mt-0.5">Suspended profiles currently taken offline. Reasons retrieved from admin audit trails.</p>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
            {loading ? (
              <div className="py-6 text-center text-neutral-500 font-mono text-[10px]">Querying suspended athletes...</div>
            ) : suspendedAccounts.length === 0 ? (
              <div className="py-8 text-center text-neutral-500 font-mono text-[10px] italic border border-dashed border-neutral-800 rounded bg-[#050505]/20">
                Excellent! There are no suspended profiles on the platform.
              </div>
            ) : (
              suspendedAccounts.map((a) => (
                <div key={a.id} className="bg-[#050505]/40 p-3 rounded border border-neutral-800/80 space-y-2 hover:border-neutral-750 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-bold text-white text-xs uppercase font-mono">{a.full_name}</h4>
                      <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider mt-0.5">{a.sport} · {a.school} · {a.email}</p>
                    </div>
                    <button
                      onClick={() => handleTriggerReactivate(a)}
                      className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black border border-emerald-500/20 px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer transition-all"
                    >
                      Reactivate
                    </button>
                  </div>

                  <div className="bg-neutral-950/60 p-2 rounded text-[10px] text-neutral-400 border border-neutral-850/80 font-mono">
                    <span className="font-bold text-[9px] text-neutral-500 uppercase tracking-wider block mb-0.5">Reason for Suspension:</span>
                    &quot;{a.suspension_reason}&quot;
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Reactivate Account Confirmation Modal */}
      {modalOpen && selectedAthlete && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-neutral-800 rounded w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-5 space-y-3">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Reactivate Athlete Profile</h3>
                <p className="text-[10px] text-neutral-400 font-mono">
                  Are you sure you want to lift the suspension for <span className="font-bold text-[#C6FF3D]">{selectedAthlete.full_name}</span>? This will instantly publish their public card and restore full access to their dashboard.
                </p>
              </div>
            </div>
            
            <div className="bg-[#050505] p-3 border-t border-neutral-850 flex justify-end gap-2 font-mono text-[10px]">
              <button
                onClick={() => setModalOpen(false)}
                className="px-3 py-1.5 text-neutral-500 hover:text-white font-bold uppercase tracking-wider cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReactivate}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-[#C6FF3D] hover:bg-[#d0ff70] text-black font-bold uppercase tracking-wider rounded cursor-pointer transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? (
                  <>
                    <div className="w-3 h-3 animate-spin border border-current border-t-transparent rounded-full"></div>
                    Processing...
                  </>
                ) : (
                  'Reactivate Profile'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
