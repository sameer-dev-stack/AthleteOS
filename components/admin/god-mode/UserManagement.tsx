import React, { useState, useEffect, useCallback } from 'react';
import { supabaseApi } from './supabase';
import { Profile } from './types';
import { 
  Search, Shield, CheckCircle, XCircle, Award, 
  UserCheck, AlertTriangle, Info, Eye, Loader2, ArrowRight, Check, X
} from 'lucide-react';

export default function UserManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Selected Profile for Detail Drawer
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [detailProfile, setDetailProfile] = useState<Profile | null>(null);
  const [detailSocials, setDetailSocials] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Confirmation Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    description: string;
    actionLabel: string;
    onConfirm: () => void;
    requiresReason?: boolean;
  } | null>(null);
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch profiles on load or change
  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await supabaseApi.getProfiles({ search, page, pageSize: 8 });
      setProfiles(data.profiles);
      setTotal(data.total);
    } catch (err) {
      console.error('Error fetching profiles:', err);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    queueMicrotask(() => fetchProfiles());
  }, [fetchProfiles]);

  // Fetch detail drawer info
  const handleViewDetail = async (profileId: string) => {
    setSelectedProfileId(profileId);
    setDetailLoading(true);
    try {
      const data = await supabaseApi.getProfileDetail(profileId);
      setDetailProfile(data.profile);
      setDetailSocials(data.socialAccounts);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Triggers the Confirmation Modal
  const triggerConfirmation = (config: {
    title: string;
    description: string;
    actionLabel: string;
    onConfirm: () => void;
    requiresReason?: boolean;
  }) => {
    setReason('');
    setModalConfig(config);
    setModalOpen(true);
  };

  // Handle suspended status change
  const handleToggleSuspend = (profile: Profile) => {
    const isSuspending = !profile.suspended;
    triggerConfirmation({
      title: isSuspending ? 'Suspend Athlete Account' : 'Unsuspend Athlete Account',
      description: isSuspending 
        ? `Are you sure you want to suspend ${profile.full_name || 'this athlete'}? This blocks all access to their dashboard, disables public card page lookups, and hides their monetization links immediately.`
        : `Are you sure you want to reactivate ${profile.full_name || 'this athlete'}?`,
      actionLabel: isSuspending ? 'Suspend Account' : 'Reactivate Account',
      requiresReason: isSuspending,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await supabaseApi.updateProfileField(
            profile.id, 
            { suspended: isSuspending },
            isSuspending ? 'USER_SUSPEND' : 'USER_REACTIVATE',
            { reason: isSuspending ? reason : 'Reactivated by admin.' }
          );
          showToast(`Account ${isSuspending ? 'suspended' : 'reactivated'} successfully`, 'success');
          fetchProfiles();
          if (selectedProfileId === profile.id) {
            handleViewDetail(profile.id);
          }
        } catch (err) {
          console.error(err);
          showToast('Failed to update account status', 'error');
        } finally {
          setActionLoading(false);
          setModalOpen(false);
        }
      }
    });
  };

  // Handle verification status change
  const handleToggleVerify = (profile: Profile) => {
    const nextVal = !profile.is_verified;
    triggerConfirmation({
      title: nextVal ? 'Verify Athlete Badge' : 'Revoke Verification Badge',
      description: nextVal
        ? `Apply the green AthleteOS verified badge to ${profile.full_name || 'this profile'}? This displays a verification signal across all search portals and cards.`
        : `Remove the verification badge from ${profile.full_name || 'this profile'}?`,
      actionLabel: nextVal ? 'Verify Profile' : 'Revoke Verification',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await supabaseApi.updateProfileField(
            profile.id,
            { is_verified: nextVal },
            nextVal ? 'VERIFICATION_GRANT' : 'VERIFICATION_REVOKE',
            { reason: nextVal ? 'Granted by admin.' : 'Revoked by admin.' }
          );
          showToast(`Verification ${nextVal ? 'granted' : 'revoked'} successfully`, 'success');
          fetchProfiles();
          if (selectedProfileId === profile.id) handleViewDetail(profile.id);
        } catch (err) {
          console.error(err);
          showToast('Failed to update verification status', 'error');
        } finally {
          setActionLoading(false);
          setModalOpen(false);
        }
      }
    });
  };

  // Handle profile published change
  const handleTogglePublish = (profile: Profile) => {
    const nextVal = !profile.profile_published;
    triggerConfirmation({
      title: nextVal ? 'Publish Athlete Card' : 'Unpublish Athlete Card',
      description: nextVal
        ? `Force-publish ${profile.full_name || 'this athlete'}'s card to make it publicly viewable?`
        : `Take ${profile.full_name || 'this athlete'}'s card offline? This will result in 404 lookups for public viewers.`,
      actionLabel: nextVal ? 'Publish' : 'Take Offline',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await supabaseApi.updateProfileField(
            profile.id,
            { profile_published: nextVal },
            nextVal ? 'PROFILE_PUBLISH_FORCE' : 'PROFILE_UNPUBLISH_FORCE',
            { reason: 'Overridden by Administrator' }
          );
          showToast(`Profile ${nextVal ? 'published' : 'unpublished'} successfully`, 'success');
          fetchProfiles();
          if (selectedProfileId === profile.id) handleViewDetail(profile.id);
        } catch (err) {
          console.error(err);
          showToast('Failed to update publish status', 'error');
        } finally {
          setActionLoading(false);
          setModalOpen(false);
        }
      }
    });
  };

  // Handle plan override dropdown change
  const handlePlanOverride = (profile: Profile, newPlan: 'free' | 'pro' | 'elite') => {
    if (profile.plan === newPlan) return;
    triggerConfirmation({
      title: `Override Tier to ${newPlan.toUpperCase()}`,
      description: `Override subscription parameters for ${profile.full_name || 'this user'} from ${profile.plan.toUpperCase()} to ${newPlan.toUpperCase()}? This overrides payment gateways and adjusts AI quotas.`,
      actionLabel: 'Confirm Overrides',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await supabaseApi.updateProfileField(
            profile.id,
            { plan: newPlan },
            'PLAN_OVERRIDE',
            { old_plan: profile.plan, new_plan: newPlan }
          );
          showToast(`Plan overridden to ${newPlan.toUpperCase()} successfully`, 'success');
          fetchProfiles();
          if (selectedProfileId === profile.id) handleViewDetail(profile.id);
        } catch (err) {
          console.error(err);
          showToast('Failed to override plan', 'error');
        } finally {
          setActionLoading(false);
          setModalOpen(false);
        }
      }
    });
  };

  // Handle role changes
  const handleRoleToggle = (profile: Profile) => {
    const newRole = profile.role === 'admin' ? 'user' : 'admin';
    triggerConfirmation({
      title: `Demote/Promote User Role to ${newRole.toUpperCase()}`,
      description: `CRITICAL STEP: You are modifying system privileges for ${profile.full_name || 'this account'}. Promoting to admin grants full control over God Mode features, payout parameters, and compliance queues. Do you wish to continue?`,
      actionLabel: `Promote to ${newRole.toUpperCase()}`,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await supabaseApi.updateProfileField(
            profile.id,
            { role: newRole },
            'ROLE_CHANGE',
            { old_role: profile.role, new_role: newRole }
          );
          showToast(`Role changed to ${newRole.toUpperCase()} successfully`, 'success');
          fetchProfiles();
          if (selectedProfileId === profile.id) handleViewDetail(profile.id);
        } catch (err) {
          console.error(err);
          showToast('Failed to change role', 'error');
        } finally {
          setActionLoading(false);
          setModalOpen(false);
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header and Search Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-900/50 p-4 rounded border border-neutral-800">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            User Management <span className="text-[10px] bg-[#C6FF3D]/10 text-[#C6FF3D] border border-[#C6FF3D]/20 py-0.5 px-2 rounded font-bold font-mono">{total} Profiles</span>
          </h2>
          <p className="text-[10px] text-neutral-500 font-mono mt-0.5">Audit, modify, verify, and override athlete profile accounts instantly.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search name, school, sport..."
            className="w-full pl-9 pr-4 py-1.5 bg-[#050505] border border-neutral-800 rounded text-xs text-neutral-300 focus:outline-none focus:border-[#C6FF3D] placeholder:text-neutral-600 transition-colors"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Main Profiles Table */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-900/80 border-b border-neutral-800 text-[10px] font-black uppercase tracking-wider text-neutral-400">
                <th className="py-3 px-4">Athlete Profile</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4">Published</th>
                <th className="py-3 px-4">Account Plan</th>
                <th className="py-3 px-4">Privileges</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500 font-mono">
                    <Loader2 className="w-6 h-6 animate-spin text-[#C6FF3D] mx-auto mb-2" />
                    Fetching athlete records...
                  </td>
                </tr>
              ) : profiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500 font-mono">
                    No athlete records found matching search parameters.
                  </td>
                </tr>
              ) : (
                profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-900/30 transition-colors">
                    {/* Athlete Name / Detail */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-[#C6FF3D]/10 text-[#C6FF3D] border border-[#C6FF3D]/20 flex items-center justify-center font-bold font-mono text-xs">
                          {p.full_name ? p.full_name.charAt(0) : 'A'}
                        </div>
                        <div>
                          <h4 className="font-bold text-white">{p.full_name || 'N/A'}</h4>
                          <p className="text-[10px] text-neutral-400">{p.sport || 'No Sport'} · {p.school || 'No School'}</p>
                          <p className="text-[10px] text-neutral-500 font-mono">{p.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Verification Toggle */}
                    <td className="py-3 px-4">
                      <button 
                        onClick={() => handleToggleVerify(p)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all uppercase ${
                          p.is_verified 
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                            : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700'
                        }`}
                      >
                        <CheckCircle className="w-3 h-3" />
                        {p.is_verified ? 'Verified' : 'Unverified'}
                      </button>
                    </td>

                    {/* Published Toggle */}
                    <td className="py-3 px-4">
                      <button 
                        onClick={() => handleTogglePublish(p)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all uppercase ${
                          p.profile_published 
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                            : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700'
                        }`}
                      >
                        {p.profile_published ? 'Published' : 'Offline'}
                      </button>
                    </td>

                    {/* Plan Override Dropdown */}
                    <td className="py-3 px-4">
                      <select
                        value={p.plan}
                        onChange={(e) => handlePlanOverride(p, e.target.value as any)}
                        className="bg-neutral-900 border border-neutral-800 rounded text-[10px] py-0.5 px-2 font-bold uppercase text-[#C6FF3D] focus:outline-none focus:border-[#C6FF3D] cursor-pointer animate-none"
                      >
                        <option value="free" className="text-neutral-300 bg-[#0a0a0a]">Free Tier</option>
                        <option value="pro" className="text-neutral-300 bg-[#0a0a0a]">Pro Athlete</option>
                        <option value="elite" className="text-neutral-300 bg-[#0a0a0a]">Elite OS</option>
                      </select>
                    </td>

                    {/* Role / Privileges Toggle */}
                    <td className="py-3 px-4">
                      <button 
                        onClick={() => handleRoleToggle(p)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                          p.role === 'admin'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700'
                        }`}
                      >
                        <UserCheck className="w-3 h-3" />
                        {p.role.toUpperCase()}
                      </button>
                    </td>

                    {/* Account Status */}
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        p.suspended 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                          : 'bg-[#C6FF3D]/10 text-[#C6FF3D] border border-[#C6FF3D]/20'
                      }`}>
                        {p.suspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>

                    {/* Row View Detail Action */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleSuspend(p)}
                          className={`text-[10px] uppercase font-bold tracking-wider py-1 px-2.5 rounded border transition-colors cursor-pointer ${
                            p.suspended
                              ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                              : 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                          }`}
                        >
                          {p.suspended ? 'Reactivate' : 'Suspend'}
                        </button>
                        <button
                          onClick={() => handleViewDetail(p.id)}
                          className="bg-neutral-850 hover:bg-neutral-800 text-neutral-400 p-1 rounded border border-neutral-700 transition-colors"
                          title="Open Details Drawer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-neutral-900/60 p-3 border-t border-neutral-800 flex items-center justify-between">
          <p className="text-[10px] font-mono text-neutral-500 uppercase">
            Showing <span className="text-neutral-300">{(page - 1) * 8 + 1}</span> to{' '}
            <span className="text-neutral-300">{Math.min(page * 8, total)}</span> of{' '}
            <span className="text-neutral-300 font-bold text-[#C6FF3D]">{total}</span> records
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-neutral-900 border border-neutral-800 rounded text-[10px] font-mono font-bold uppercase text-neutral-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * 8 >= total}
              className="px-3 py-1 bg-neutral-900 border border-neutral-800 rounded text-[10px] font-mono font-bold uppercase text-neutral-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {modalOpen && modalConfig && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-neutral-800 rounded w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 bg-red-400/10 text-red-400 rounded flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">{modalConfig.title}</h3>
                <p className="text-xs text-neutral-400">{modalConfig.description}</p>
              </div>

              {modalConfig.requiresReason && (
                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Reason for Suspension</label>
                  <textarea
                    className="w-full bg-[#050505] border border-neutral-800 rounded p-3 text-xs text-neutral-300 focus:outline-none focus:border-red-400 h-20"
                    placeholder="Enter compliance, terms violation, or request parameters..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="bg-[#050505] p-4 border-t border-neutral-800 flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-neutral-900 text-neutral-400 hover:text-white text-[10px] font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => modalConfig.onConfirm()}
                disabled={(modalConfig.requiresReason && !reason.trim()) || actionLoading}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-400 text-black text-[10px] font-bold uppercase tracking-wider rounded disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Processing...
                  </>
                ) : (
                  modalConfig.actionLabel
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded border shadow-lg animate-in slide-in-from-bottom duration-300 ${
          toast.type === 'success' 
            ? 'bg-[#C6FF3D]/10 border-[#C6FF3D]/30 text-[#C6FF3D]' 
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {toast.type === 'success' ? (
            <Check className="w-4 h-4" />
          ) : (
            <X className="w-4 h-4" />
          )}
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* Details Slide-Over Drawer */}
      {selectedProfileId && detailProfile && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex justify-end">
          <div className="w-full max-w-lg bg-[#0a0a0a] border-l border-neutral-800 h-full p-4 sm:p-8 overflow-y-auto space-y-6 shadow-2xl relative animate-in slide-in-from-right duration-200">
            <button 
              onClick={() => setSelectedProfileId(null)}
              className="absolute top-6 right-6 text-xs uppercase font-bold tracking-wider text-neutral-400 hover:text-white"
            >
              ✕ Close
            </button>

            {detailLoading ? (
              <div className="h-full flex items-center justify-center text-neutral-500">
                <Loader2 className="w-6 h-6 animate-spin text-[#C6FF3D]" />
              </div>
            ) : (
              <>
                {/* Header Information */}
                <div className="border-b border-neutral-800 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded bg-[#C6FF3D]/10 text-[#C6FF3D] border border-[#C6FF3D]/20 flex items-center justify-center text-xl font-black font-mono">
                      {detailProfile.full_name ? detailProfile.full_name.charAt(0) : 'A'}
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                        {detailProfile.full_name}
                        {detailProfile.is_verified && <CheckCircle className="w-4 h-4 text-[#C6FF3D]" />}
                      </h3>
                      <p className="text-xs text-[#C6FF3D] font-mono">@{detailProfile.username || 'unclaimed'}</p>
                      <p className="text-[10px] text-neutral-500 font-mono mt-1">{detailProfile.sport} · {detailProfile.school} · {detailProfile.class_year}</p>
                    </div>
                  </div>
                </div>

                {/* Account Settings Snapshot */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#050505] p-3 rounded border border-neutral-800">
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Plan Level</p>
                    <p className="text-xs font-bold text-[#C6FF3D] mt-1">{detailProfile.plan.toUpperCase()}</p>
                  </div>
                  <div className="bg-[#050505] p-3 rounded border border-neutral-800">
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">System Role</p>
                    <p className="text-xs font-bold text-neutral-200 mt-1">{detailProfile.role.toUpperCase()}</p>
                  </div>
                </div>

                {/* Stripe Connected Account Status */}
                <div className="bg-[#050505] p-4 rounded border border-neutral-800 space-y-3">
                  <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Stripe connect status</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-neutral-300 font-bold uppercase">Stripe Account ID</p>
                      <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{detailProfile.stripe_account_id || 'Not created'}</p>
                    </div>
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      detailProfile.stripe_onboarding_complete 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                    }`}>
                      {detailProfile.stripe_onboarding_complete ? 'Complete' : 'Incomplete'}
                    </span>
                  </div>
                </div>

                {/* Linked Social Accounts */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Connected Social Analytics</h4>
                  {detailSocials.length === 0 ? (
                    <p className="text-xs text-neutral-500 italic">No social accounts connected to this AthleteOS profile.</p>
                  ) : (
                    <div className="grid gap-2">
                      {detailSocials.map((s, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-[#050505] rounded border border-neutral-800">
                          <span className="text-xs text-neutral-300 font-bold uppercase font-mono">{s.platform}</span>
                          <span className="text-xs text-[#C6FF3D] font-bold font-mono">{s.followers.toLocaleString()} followers</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bio Description */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Athlete Bio</h4>
                  <div className="bg-[#050505] p-4 rounded border border-neutral-800 text-xs text-neutral-300 leading-relaxed italic">
                    &quot;{detailProfile.bio || 'This athlete has not written a bio statement yet.'}&quot;
                  </div>
                </div>

                {/* Raw Database JSON Preview */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-neutral-500" /> Raw Profile DDL JSON
                  </h4>
                  <pre className="bg-[#050505] p-4 rounded text-[10px] font-mono text-[#C6FF3D] overflow-x-auto max-h-48 border border-neutral-800 scrollbar-thin">
                    {JSON.stringify(detailProfile, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
