import React, { useState, useEffect, useCallback } from 'react';
import { supabaseApi } from './supabase';
import { Database, Link2, Mail, Users, ToggleLeft, ToggleRight, Loader2, Sparkles, CheckCircle, Shield, X } from 'lucide-react';

export default function PlatformSettings() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<{
    supabaseStatus: 'connected' | 'error';
    stripeWebhookHealth: 'healthy' | 'error';
    waitlistCount: number;
    newsletterCount: number;
    featureFlags: { [key: string]: boolean };
  }>({
    supabaseStatus: 'connected',
    stripeWebhookHealth: 'healthy',
    waitlistCount: 0,
    newsletterCount: 0,
    featureFlags: {}
  });

  const fetchHealthAndSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await supabaseApi.getPlatformHealth();
      setHealth(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load platform health');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => fetchHealthAndSettings());
  }, [fetchHealthAndSettings]);

  // Handle Feature Flag toggle click
  const handleToggleFlag = async (flagName: string, currentVal: boolean) => {
    const nextVal = !currentVal;
    // Optimistic Update
    setHealth(h => ({
      ...h,
      featureFlags: { ...h.featureFlags, [flagName]: nextVal }
    }));

    try {
      // Call API
      const res = await supabaseApi.toggleFeatureFlag(flagName, nextVal);
      // Sync back with actual database state
      setHealth(h => ({
        ...h,
        featureFlags: res.featureFlags
      }));
    } catch (err) {
      console.error(err);
      // Revert optimistic update on failure
      setHealth(h => ({
        ...h,
        featureFlags: { ...h.featureFlags, [flagName]: currentVal }
      }));
      setError(`Failed to toggle ${flagName.replace(/_/g, ' ')}`);
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

      {/* Overview Intro Card */}
      <div className="bg-neutral-900/50 p-4 rounded border border-neutral-800">
        <h2 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wider">
          Platform Settings & System Health
        </h2>
        <p className="text-[10px] text-neutral-500 font-mono mt-0.5">Audit active integrations, track funnel aggregates, and modify global feature toggles instantly.</p>
      </div>

      {/* Health Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Supabase Connection */}
        <div className="bg-neutral-900/50 p-4 rounded border border-neutral-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-neutral-900 text-emerald-400 rounded">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Supabase Postgres</p>
              <h4 className="text-xs font-black text-white mt-0.5 uppercase tracking-wide">Database Client</h4>
            </div>
          </div>
          <span className={`w-2.5 h-2.5 rounded-full ${
            health.supabaseStatus === 'connected' ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-red-500 shadow-sm shadow-red-500/50'
          }`} title={health.supabaseStatus === 'connected' ? 'Database Operational' : 'Connection Failure'} />
        </div>

        {/* Stripe Webhook */}
        <div className="bg-neutral-900/50 p-4 rounded border border-neutral-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-neutral-900 text-emerald-400 rounded">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Stripe Endpoints</p>
              <h4 className="text-xs font-black text-white mt-0.5 uppercase tracking-wide">Webhooks Status</h4>
            </div>
          </div>
          <span className={`w-2.5 h-2.5 rounded-full ${
            health.stripeWebhookHealth === 'healthy' ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-red-500 shadow-sm shadow-red-500/50'
          }`} title={health.stripeWebhookHealth === 'healthy' ? 'Webhook Endpoint Active' : 'Webhook Validation Issues'} />
        </div>

        {/* Waitlist Capture Counts */}
        <div className="bg-neutral-900/50 p-4 rounded border border-neutral-800 flex items-center space-x-3">
          <div className="p-2 bg-neutral-900 text-neutral-400 rounded">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Waitlist Entries</p>
            <h4 className="text-xs font-black text-white mt-0.5 uppercase tracking-wide font-mono">{health.waitlistCount.toLocaleString()} athletes</h4>
          </div>
        </div>

        {/* Newsletter capture */}
        <div className="bg-neutral-900/50 p-4 rounded border border-neutral-800 flex items-center space-x-3">
          <div className="p-2 bg-neutral-900 text-neutral-400 rounded">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Newsletter Subs</p>
            <h4 className="text-xs font-black text-white mt-0.5 uppercase tracking-wide font-mono">{health.newsletterCount.toLocaleString()} subscribers</h4>
          </div>
        </div>
      </div>

      {/* Feature Flags Toggle Panel */}
      <div className="bg-neutral-900/50 p-4 rounded border border-neutral-800 space-y-4">
        <div>
          <h3 className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-[#C6FF3D]" /> Global Feature Flag Switches
          </h3>
          <p className="text-[10px] text-neutral-500 font-mono mt-0.5">Control active platform components in real-time. Toggling registers admin actions and modifies workspace capabilities.</p>
        </div>

        {loading ? (
          <div className="py-6 text-center text-neutral-500 font-mono text-[10px]">
            Querying active system flags...
          </div>
        ) : Object.keys(health.featureFlags).length === 0 ? (
          <p className="text-[10px] text-neutral-500 font-mono italic">No feature flags registered in platform configurations.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.keys(health.featureFlags).map((flag) => {
              const val = health.featureFlags[flag];
              return (
                <div 
                  key={flag} 
                  className="bg-[#050505]/40 p-4 rounded border border-neutral-800 flex items-center justify-between group hover:border-neutral-750 transition-colors"
                >
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">
                      {flag.replace(/_/g, ' ')}
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-mono">
                      {flag === 'onboarding_active' && 'Allows new athlete accounts to claim usernames and onboard.'}
                      {flag === 'ai_limitations_enabled' && 'Enforces monthly generation quotas per tier (Free/Pro/Elite).'}
                      {flag === 'automatic_compliance_review' && 'Enables AI to auto-screen deals before human compliance audit.'}
                      {flag === 'platform_tipping_enabled' && 'Allows public card profiles to display the Stripe TIP support modal.'}
                      {flag === 'payout_instant_withdrawals' && 'Enables instant debit payouts to connected bank debit cards.'}
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleFlag(flag, val)}
                    className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
                  >
                    {val ? (
                      <ToggleRight className="w-8 h-8 text-[#C6FF3D]" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-neutral-700" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
