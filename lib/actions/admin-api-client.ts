// Front-end API client wrapper communicating with the catch-all Next.js route handler /api/admin
const API_BASE = '/api/admin';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `API Error: ${response.status}`);
  }
  try {
    return await response.json();
  } catch {
    throw new Error(`API Error: ${response.status} (non-JSON response)`);
  }
}

export const supabaseApi = {
  // Profiles (User Management)
  async getProfiles(params: {
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ profiles: any[]; total: number }> {
    const query = new URLSearchParams({
      search: params.search || '',
      page: String(params.page || 1),
      pageSize: String(params.pageSize || 10)
    });
    const res = await fetch(`${API_BASE}/profiles?${query}`);
    return handleResponse(res);
  },

  async updateProfileField(
    profileId: string, 
    fields: Partial<any>,
    adminAction: string,
    metadata?: Record<string, any>
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/profiles/${profileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields, adminAction, metadata })
    });
    return handleResponse(res);
  },

  async getProfileDetail(profileId: string): Promise<{
    profile: any;
    socialAccounts: any[];
    stripeStatus: {
      account_id: string | null;
      onboarding_complete: boolean;
    };
  }> {
    const res = await fetch(`${API_BASE}/profiles/${profileId}/detail`);
    return handleResponse(res);
  },

  // Financial Dashboard
  async getFinancials(params: {
    onboardingStatus?: 'complete' | 'incomplete' | 'none' | 'all';
  }): Promise<{
    athletes: any[];
    aggregates: {
      totalTips: number;
      totalDealsDisclosed: number;
      platformFeeRevenue: number;
    };
  }> {
    const query = new URLSearchParams({
      onboardingStatus: params.onboardingStatus || 'all'
    });
    const res = await fetch(`${API_BASE}/financials?${query}`);
    return handleResponse(res);
  },

  async getPayoutData(onboardingStatus?: 'complete' | 'incomplete' | 'none' | 'all') {
    return supabaseApi.getFinancials({ onboardingStatus });
  },

  // Compliance Queue
  async getPendingDeals(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/compliance/pending`);
    return handleResponse(res);
  },

  async updateDealStatus(
    dealId: string, 
    status: 'cleared' | 'rejected',
    metadata?: Record<string, any>
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/compliance/deals/${dealId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, metadata })
    });
    return handleResponse(res);
  },

  // Usage & AI Monitoring
  async getAiUsageMetrics(): Promise<{
    toolUsage: { tool: string; used_count: number }[];
    topUsers: { user_id: string; full_name: string; email: string; used_count: number; plan: string }[];
    quotaConsumption: {
      free: { used: number; total: number; count: number };
      pro: { used: number; total: number; count: number };
    };
  }> {
    const res = await fetch(`${API_BASE}/usage/ai`);
    return handleResponse(res);
  },

  // Analytics Overview
  async getAnalyticsOverview(): Promise<{
    totalViews: number;
    uniqueViewers: number;
    topReferrers: { referrer: string; count: number }[];
    topCountries: { country: string; count: number }[];
    viewsOverTime: { date: string; views: number; clicks: number }[];
  }> {
    const res = await fetch(`${API_BASE}/analytics`);
    return handleResponse(res);
  },

  // Security & Abuse
  async getSecurityDashboard(): Promise<{
    rateLimits: any[];
    suspendedAccounts: any[];
  }> {
    const res = await fetch(`${API_BASE}/security`);
    return handleResponse(res);
  },

  // Audit Log Viewer
  async getAuditLogs(params: {
    page?: number;
    pageSize?: number;
    adminId?: string;
    actionType?: string;
    targetType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ logs: any[]; total: number; admins: string[]; actions: string[] }> {
    const query = new URLSearchParams({
      page: String(params.page || 1),
      pageSize: String(params.pageSize || 15)
    });
    if (params.adminId) query.append('adminId', params.adminId);
    if (params.actionType) query.append('actionType', params.actionType);
    if (params.targetType) query.append('targetType', params.targetType);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);

    const res = await fetch(`${API_BASE}/audit-logs?${query}`);
    return handleResponse(res);
  },

  // Platform Settings
  async getPlatformHealth(): Promise<{
    supabaseStatus: 'connected' | 'error';
    stripeWebhookHealth: 'healthy' | 'error';
    waitlistCount: number;
    newsletterCount: number;
    featureFlags: { [key: string]: boolean };
  }> {
    const res = await fetch(`${API_BASE}/platform/health`);
    return handleResponse(res);
  },

  async toggleFeatureFlag(flag: string, enabled: boolean): Promise<any> {
    const res = await fetch(`${API_BASE}/platform/feature-flags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flag, enabled })
    });
    return handleResponse(res);
  }
};
