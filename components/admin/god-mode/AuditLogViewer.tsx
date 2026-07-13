import React, { useState, useEffect, useCallback } from 'react';
import { supabaseApi } from './supabase';
import { AuditLog } from './types';
import { Shield, Search, Calendar, ChevronLeft, ChevronRight, Eye, Info, ListFilter, X } from 'lucide-react';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic filter select options fetched from DB
  const [admins, setAdmins] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);

  // Active filters
  const [adminId, setAdminId] = useState('');
  const [actionType, setActionType] = useState('');
  const [targetType, setTargetType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Log for metadata detail modal
  const [activeMetadata, setActiveMetadata] = useState<Record<string, any> | null>(null);

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await supabaseApi.getAuditLogs({
        page,
        pageSize: 10,
        adminId,
        actionType,
        targetType,
        startDate,
        endDate
      });
      setLogs(data.logs);
      setTotal(data.total);
      setAdmins(data.admins);
      setActions(data.actions);
    } catch (err) {
      console.error(err);
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, adminId, actionType, targetType, startDate, endDate]);

  useEffect(() => {
    queueMicrotask(() => fetchAuditLogs());
  }, [fetchAuditLogs]);

  // Handle Clear Filters
  const handleClearFilters = () => {
    setAdminId('');
    setActionType('');
    setTargetType('');
    setStartDate('');
    setEndDate('');
    setPage(1);
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

      {/* Immutability Security Banner */}
      <div className="bg-[#050505] p-4 rounded border border-red-500/20 flex items-start gap-3">
        <div className="p-2 bg-red-500/10 text-red-400 rounded">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-xs font-black text-white uppercase tracking-wider">IMMUTABLE SYSTEM AUDIT TRAIL</h3>
          <p className="text-[10px] text-neutral-400 font-mono mt-0.5 leading-relaxed">
            This log is designed with write-only security rules. It is database-protected against updates, edits, or deletes, even from administrative service accounts, to ensure strict regulatory and NCAA compliance transparency.
          </p>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-neutral-900/50 p-4 rounded border border-neutral-800 space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
          <h4 className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
            <ListFilter className="w-3.5 h-3.5 text-[#C6FF3D]" /> Filter Audit Logs
          </h4>
          <button
            onClick={handleClearFilters}
            className="text-[10px] text-neutral-500 hover:text-[#C6FF3D] font-bold font-mono uppercase tracking-wider transition-colors cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-[10px] font-mono">
          {/* Admin Filter */}
          <div className="space-y-1">
            <label className="text-neutral-500 font-bold uppercase">Admin ID</label>
            <select
              value={adminId || ''}
              onChange={(e) => { setAdminId(e.target.value); setPage(1); }}
              className="w-full bg-[#050505] border border-neutral-800 p-2 rounded text-neutral-300 focus:outline-none focus:border-[#C6FF3D]"
            >
              <option value="">All Administrators</option>
              {admins.map(id => (
                <option key={id} value={id}>{id === '83c283e5-ef8f-4c4f-a255-abc7e66f4970' ? 'Sameer (Dev Admin)' : id.substr(0, 12) + '...'}</option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div className="space-y-1">
            <label className="text-neutral-500 font-bold uppercase">Action Type</label>
            <select
              value={actionType || ''}
              onChange={(e) => { setActionType(e.target.value); setPage(1); }}
              className="w-full bg-[#050505] border border-neutral-800 p-2 rounded text-neutral-300 focus:outline-none focus:border-[#C6FF3D]"
            >
              <option value="">All Actions</option>
              {actions.map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>

          {/* Target Type Filter */}
          <div className="space-y-1">
            <label className="text-neutral-500 font-bold uppercase">Target Type</label>
            <select
              value={targetType || ''}
              onChange={(e) => { setTargetType(e.target.value); setPage(1); }}
              className="w-full bg-[#050505] border border-neutral-800 p-2 rounded text-neutral-300 focus:outline-none focus:border-[#C6FF3D]"
            >
              <option value="">All Targets</option>
              <option value="user">User / Profile</option>
              <option value="deal">Compliance Deal</option>
              <option value="platform">Platform Settings</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-neutral-500 font-bold uppercase">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-full bg-[#050505] border border-neutral-800 p-1.5 rounded text-neutral-300 focus:outline-none focus:border-[#C6FF3D]"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-neutral-500 font-bold uppercase">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-full bg-[#050505] border border-neutral-800 p-1.5 rounded text-neutral-300 focus:outline-none focus:border-[#C6FF3D]"
            />
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-neutral-900/50 rounded border border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#050505] border-b border-neutral-800 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                <th className="py-2.5 px-4 font-mono">Log ID / Date</th>
                <th className="py-2.5 px-4 font-mono">Administrator</th>
                <th className="py-2.5 px-4 font-mono">Action Event</th>
                <th className="py-2.5 px-4 font-mono">Target Entity</th>
                <th className="py-2.5 px-4 text-right font-mono">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-850 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-neutral-500 font-mono text-[10px]">
                    <div className="w-4 h-4 animate-spin border border-[#C6FF3D] border-t-transparent rounded-full mx-auto mb-1.5"></div>
                    Fetching System Audits...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-neutral-600 font-mono text-[10px] italic">
                    No matching audit entries found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="py-2.5 px-4 font-mono">
                      <div className="text-[10px] text-neutral-300 font-bold">#{log.id}</div>
                      <div className="text-[9px] text-neutral-500 mt-0.5">{new Date(log.created_at).toLocaleString()}</div>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[10px] text-neutral-300">
                      {log.admin_id === '83c283e5-ef8f-4c4f-a255-abc7e66f4970' ? (
                        <span className="text-[#C6FF3D] font-bold">Sameer (Lead Dev Admin)</span>
                      ) : (
                        log.admin_id.substring(0, 12) + '...'
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold font-mono uppercase tracking-wider ${
                        log.action.includes('SUSPEND') 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/25' 
                          : log.action.includes('CLEAR') || log.action.includes('VERIFICATION')
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                          : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-[10px] text-neutral-400 font-mono">
                      <span className="capitalize font-bold text-neutral-300">{log.target_type}</span>
                      <span className="ml-1.5 opacity-60 text-[9px]">({log.target_id})</span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => setActiveMetadata(log.metadata)}
                        disabled={!log.metadata}
                        className="p-1 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white rounded transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                        title="View Event Metadata"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Audit Log Pagination */}
        <div className="bg-[#050505] p-3 border-t border-neutral-800 flex items-center justify-between text-[10px] font-mono">
          <p className="text-neutral-500">
            AUDIT LOGS LIST <span className="text-neutral-300 font-bold">{(page - 1) * 10 + 1}</span> TO{' '}
            <span className="text-neutral-300 font-bold">{Math.min(page * 10, total)}</span> OF{' '}
            <span className="text-[#C6FF3D] font-bold">{total}</span> SYSTEM TRAILS
          </p>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded text-[9px] font-bold text-neutral-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors uppercase tracking-wider cursor-pointer"
            >
              PREVIOUS
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * 10 >= total}
              className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded text-[9px] font-bold text-neutral-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors uppercase tracking-wider cursor-pointer"
            >
              NEXT
            </button>
          </div>
        </div>
      </div>

      {/* Metadata Detail Dialog */}
      {activeMetadata && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-neutral-800 rounded w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 space-y-3">
              <h3 className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
                <Info className="w-4 h-4 text-[#C6FF3D]" /> Event Action Metadata Context
              </h3>
              
              <pre className="bg-[#050505] p-3 rounded border border-neutral-850 text-[10px] font-mono text-[#C6FF3D] max-h-56 overflow-y-auto scrollbar-thin">
                {JSON.stringify(activeMetadata, null, 2)}
              </pre>
            </div>
            
            <div className="bg-[#050505] p-3 border-t border-neutral-850 flex justify-end font-mono text-[10px]">
              <button
                onClick={() => setActiveMetadata(null)}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-850 text-white font-bold uppercase tracking-wider rounded transition-colors cursor-pointer"
              >
                Close Metadata
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
