import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldAlert, ArrowRight, Filter, Zap } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export function ConflictCenter() {
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [msg, setMsg] = useState('');
  const { socket } = useSocket();

  useEffect(() => {
    loadData();
  }, []);

  // Auto-refresh when conflicts/transactions change via WebSocket
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => { loadData(); };
    socket.on('conflict:created', handleUpdate);
    socket.on('conflict:updated', handleUpdate);
    socket.on('transaction:updated', handleUpdate);
    return () => {
      socket.off('conflict:created', handleUpdate);
      socket.off('conflict:updated', handleUpdate);
      socket.off('transaction:updated', handleUpdate);
    };
  }, [socket]);

  const loadData = async () => {
    const [c, d] = await Promise.all([api.getConflicts(), api.getDepartments()]);
    setConflicts(c);
    setDepts(d);
  };

  const handleOverride = async (conflictId: string, winningTxId: string) => {
    try {
      await api.overrideConflict({ conflictId, winningTxId, reason: 'Super Admin manual override' });
      setMsg('SUCCESS: Conflict overridden! Winning request assigned.');
      loadData();
    } catch (err: any) {
      setMsg(`ERROR: ${err.message}`);
    }
  };

  const filteredConflicts = conflicts.filter((c) => {
    if (selectedDeptId === 'ALL') return true;
    return c.transaction?.departmentId === selectedDeptId || c.conflictingTransaction?.departmentId === selectedDeptId;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Friendly Explainer Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-600 animate-pulse" /> Resource Preemption & Conflict Center
          </h1>
          <span className="text-xs font-mono font-bold px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
            Deterministic Priority Rules Active
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          <strong>What happens when two doctors want the exact same bed at the same time?</strong> The H-02 Conflict Engine arbitrates deterministically using clinical priority rules: <strong className="text-rose-700 font-mono">EMERGENCY (Heart Attack/Trauma) &gt; CRITICAL (ICU Unit) &gt; URGENT (Transfer) &gt; ROUTINE (Check-Up)</strong>. The higher-priority patient gets the bed immediately, while the lower-priority patient is re-routed cleanly.
        </p>

        {/* Priority Ladder */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs font-mono">
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-bold text-center">
            1st: EMERGENCY ⚡ (Pre-empts All)
          </div>
          <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl font-bold text-center">
            2nd: CRITICAL 🔴 (High Priority)
          </div>
          <div className="p-2.5 bg-sky-50 border border-sky-200 text-sky-800 rounded-xl font-bold text-center">
            3rd: URGENT 🔵 (Medium Priority)
          </div>
          <div className="p-2.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold text-center">
            4th: ROUTINE ⚪ (Standard Priority)
          </div>
        </div>
      </div>

      {msg && (
        <div className={`p-4 text-xs font-mono rounded-xl border ${msg.startsWith('SUCCESS') ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800'}`}>
          {msg}
        </div>
      )}

      {/* Filter Dropdown */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-sky-600" /> Filter Conflicts by Department:
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 font-bold focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Departments ({conflicts.length} Total Conflicts Handled)</option>
            {depts.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <button onClick={loadData} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold flex items-center gap-1">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh List
        </button>
      </div>

      {/* Clear Side-by-Side Conflict Cards */}
      <div className="space-y-6">
        {filteredConflicts.map((c, idx) => {
          const reqA = c.transaction;
          const reqB = c.conflictingTransaction;
          const isAWinner = c.winnerTransactionId === c.transactionId || c.winnerTransactionId === c.requestAId;

          return (
            <div key={c.id || idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              {/* Conflict Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 font-mono">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                  <span className="font-extrabold text-slate-900 text-sm">CONFLICT CASE #{c.id?.substring(0, 8) || idx + 1}</span>
                  <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 font-bold">
                    Target Resource: {c.resourceId}
                  </span>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-bold text-xs">
                  RESOLVED BY PRIORITY ENGINE
                </span>
              </div>

              {/* Plain English Conflict Reason */}
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-mono leading-relaxed">
                💡 <strong>Engine Arbitration Rule:</strong> {c.reason || 'Deterministic priority scoring granted resource to the higher emergency priority request.'}
              </div>

              {/* Side-by-Side Request Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Request A */}
                <div className={`p-5 rounded-2xl border space-y-3 font-mono text-xs ${isAWinner ? 'bg-emerald-50/50 border-emerald-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-900">REQUEST A ({reqA?.transactionNumber || 'TX-1001'})</span>
                    <PriorityBadge priority={reqA?.priority || 'EMERGENCY'} />
                  </div>
                  <div className="space-y-1 text-slate-700">
                    <div>Requested By: <strong className="text-slate-900">{reqA?.initiatedBy || 'Dr. Sarah Jenkins'}</strong></div>
                    <div>Resource: <strong className="text-slate-900">{reqA?.resourceType || 'BED'} ({reqA?.resourceId || c.resourceId})</strong></div>
                    <div>Department: <strong className="text-sky-700">{reqA?.department?.name || 'Emergency / ICU'}</strong></div>
                  </div>

                  {isAWinner ? (
                    <div className="p-2.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> WINNER: Granted Resource Allocation ✅
                    </div>
                  ) : (
                    <div className="p-2.5 bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-bold">
                      RE-ROUTED: Displaced to Alternate Bed 🔁
                    </div>
                  )}
                </div>

                {/* Request B */}
                <div className={`p-5 rounded-2xl border space-y-3 font-mono text-xs ${!isAWinner ? 'bg-emerald-50/50 border-emerald-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-900">REQUEST B ({reqB?.transactionNumber || 'TX-1009'})</span>
                    <PriorityBadge priority={reqB?.priority || 'ROUTINE'} />
                  </div>
                  <div className="space-y-1 text-slate-700">
                    <div>Requested By: <strong className="text-slate-900">{reqB?.initiatedBy || 'Resource Mgr David'}</strong></div>
                    <div>Resource: <strong className="text-slate-900">{reqB?.resourceType || 'BED'} ({reqB?.resourceId || c.resourceId})</strong></div>
                    <div>Department: <strong className="text-sky-700">{reqB?.department?.name || 'General Medicine'}</strong></div>
                  </div>

                  {!isAWinner ? (
                    <div className="p-2.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> WINNER: Granted Resource Allocation ✅
                    </div>
                  ) : (
                    <div className="p-2.5 bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-bold">
                      RE-ROUTED: Displaced to Alternate Bed 🔁
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Override Action */}
              <div className="pt-2 flex justify-end gap-2 text-xs font-mono">
                <button
                  onClick={() => handleOverride(c.id, c.transactionId || c.requestAId)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl border border-slate-300 font-bold"
                >
                  Force Override Win: Request A
                </button>
                <button
                  onClick={() => handleOverride(c.id, c.conflictingTransactionId || c.requestBId)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-300 font-bold"
                >
                  Force Override Win: Request B
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
