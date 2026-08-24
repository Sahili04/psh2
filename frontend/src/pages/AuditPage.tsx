import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Activity, Search, ShieldCheck, User, RefreshCw, FileText, CheckCircle2, Lock, AlertTriangle, Zap, Info } from 'lucide-react';

export function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const data = await api.getAuditLogs();
    setLogs(data);
  };

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        log.reason?.toLowerCase().includes(term) ||
        log.action?.toLowerCase().includes(term) ||
        log.userId?.toLowerCase().includes(term) ||
        log.entityId?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes('COMMITTED') || action.includes('ALLOCATED') || action.includes('CREATED')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    } else if (action.includes('LOCK') || action.includes('RESERVED')) {
      return 'bg-sky-100 text-sky-800 border-sky-300';
    } else if (action.includes('PREEMPTION') || action.includes('CONFLICT')) {
      return 'bg-amber-100 text-amber-800 border-amber-300';
    } else if (action.includes('ROLLBACK') || action.includes('OUT_OF_ORDER')) {
      return 'bg-rose-100 text-rose-800 border-rose-300';
    }
    return 'bg-slate-100 text-slate-800 border-slate-300';
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Friendly Plain-English Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-sky-600 animate-pulse" /> Immutable Audit & Security Logs
          </h1>
          <span className="text-xs font-mono font-bold px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-full">
            Tamper-Evident Trail Active
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          <strong>What are Audit Logs?</strong> This is the hospital's permanent security diary. Every single time a doctor allocates a bed, an engine lock is acquired, a priority preemption occurs, or a Saga rollback completes, an un-editable sentence is written here with the user's ID, timestamp, and exact reason.
        </p>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 text-xs font-mono">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audit logs by doctor name, bed ID, or event details..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Actions ({logs.length} Total Logs)</option>
            <option value="TRANSACTION_COMMITTED">TRANSACTION_COMMITTED</option>
            <option value="RESOURCE_LOCK_ACQUIRED">RESOURCE_LOCK_ACQUIRED</option>
            <option value="PRIORITY_PREEMPTION">PRIORITY_PREEMPTION</option>
            <option value="SAGA_ROLLBACK_COMPLETED">SAGA_ROLLBACK_COMPLETED</option>
            <option value="OUT_OF_ORDER_EVENT_FLAGGED">OUT_OF_ORDER_EVENT_FLAGGED</option>
          </select>

          <button onClick={loadLogs} className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-bold flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Audit Log Entries List (Plain-English Sentences) */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-mono text-slate-600 font-bold">
          <span>HUMAN-READABLE EVENT DIARY ({filteredLogs.length} Records)</span>
          <span>SYSTEM TIMESTAMP</span>
        </div>

        <div className="divide-y divide-slate-200">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-5 hover:bg-slate-50 transition space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getActionBadgeColor(log.action)}`}>
                    {log.action}
                  </span>
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    Entity: {log.entityType} ({log.entityId})
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>

              {/* Easy Plain-English Sentence */}
              <div className="text-xs font-mono text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start gap-2">
                <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Audit Summary:</strong> {log.reason || `Action ${log.action} performed on ${log.entityType} ${log.entityId}.`}
                </div>
              </div>

              {/* State Transition Details */}
              {(log.oldState || log.newState) && (
                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 pt-1">
                  <span>User: <strong className="text-slate-700">{log.userId}</strong></span>
                  <span>•</span>
                  <span>Old State: <strong className="text-slate-700">{log.oldState || 'NULL'}</strong></span>
                  <span>&rarr;</span>
                  <span>New State: <strong className="text-emerald-700">{log.newState || 'UPDATED'}</strong></span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
