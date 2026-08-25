import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Transaction } from '../types';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { TransactionTimeline } from '../components/TransactionTimeline';
import { GitCommit, Eye, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Layers, ShieldCheck, Zap } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export function TransactionCenter() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const { socket } = useSocket();

  useEffect(() => {
    loadTransactions();
  }, []);

  // Auto-refresh transactions when WebSocket events arrive
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      loadTransactions();
    };
    socket.on('transaction:updated', handleUpdate);
    socket.on('conflict:created', handleUpdate);
    return () => {
      socket.off('transaction:updated', handleUpdate);
      socket.off('conflict:created', handleUpdate);
    };
  }, [socket]);

  const loadTransactions = async () => {
    const data = await api.getTransactions();
    setTransactions(data);
  };

  const filtered = transactions.filter((t) => {
    if (filterStatus === 'ALL') return true;
    return t.status === filterStatus;
  });

  const getEasyExplanation = (tx: Transaction) => {
    if (tx.status === 'COMMITTED') {
      return `✅ SUCCESS: Resource (${tx.resourceType}: ${tx.resourceId}) was safely locked and committed for the patient by ${tx.initiatedBy}.`;
    } else if (tx.status === 'ROLLED_BACK') {
      return `🔄 SAFE ROLLBACK: Step failed or timed out. The system engine automatically triggered Saga compensation to release all reserved resources back to inventory.`;
    } else if (tx.status === 'ESCALATED') {
      return `⚠️ ESCALATED: A higher priority emergency request pre-empted this resource. The request has been sent to the Conflict Center for re-routing.`;
    } else if (tx.status === 'OUT_OF_ORDER') {
      return `⏱️ OUT-OF-ORDER: Event sequence arrived out of order (#3 before #2). Flagged by engine to prevent database corruption.`;
    }
    return `⚡ PROCESSING: Engine is acquiring mutex lock and validating clinical availability.`;
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Friendly Plain-English Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <GitCommit className="w-6 h-6 text-sky-600 animate-pulse" /> Live Clinical Transaction Ledger
          </h1>
          <span className="text-xs font-mono font-bold px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-full">
            Event-Sourced ACID Protection Active
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          <strong>What is this page?</strong> Think of this as the hospital's central flight-recorder. Whenever a doctor or nurse requests a bed, ventilator, or operating room, the system processes it in 4 simple stages. If two doctors request the exact same bed at the exact same millisecond, this ledger ensures only 1 gets it, preventing double allocations.
        </p>

        {/* 4 Simple Stages Explainer */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 text-xs font-mono">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
              Request Submitted
            </div>
            <div className="text-[11px] text-slate-500">Doctor/Nurse requests resource</div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
              Mutex Lock Acquired
            </div>
            <div className="text-[11px] text-slate-500">Locks resource for 1 request</div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[10px] flex items-center justify-center font-bold">3</span>
              Clinical Validation
            </div>
            <div className="text-[11px] text-slate-500">Verifies vitals & doctor specs</div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">4</span>
              Final Status
            </div>
            <div className="text-[11px] text-slate-500">Committed or Safely Rolled Back</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['ALL', 'COMMITTED', 'ROLLED_BACK', 'ESCALATED', 'OUT_OF_ORDER'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition border ${
                filterStatus === st
                  ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {st === 'ALL' ? 'All Transactions' : st}
            </button>
          ))}
        </div>
        <button
          onClick={loadTransactions}
          className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Live Ledger
        </button>
      </div>

      {/* Easy Stage Analysis Transaction Cards List */}
      <div className="space-y-4">
        {filtered.map((tx) => (
          <div key={tx.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 hover:border-sky-300 transition">
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-extrabold text-sky-700">{tx.transactionNumber}</span>
                <span className="text-xs font-bold text-slate-800 font-mono px-2.5 py-0.5 bg-slate-100 rounded border border-slate-200">
                  {tx.type}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={tx.priority} />
                <StatusBadge status={tx.status} />
              </div>
            </div>

            {/* Plain English Summary Box */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 leading-relaxed">
              <strong>Plain-English Summary:</strong> {getEasyExplanation(tx)}
            </div>

            {/* Stage Progress Bar (Visual Stage Analysis) */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-slate-500 font-bold flex justify-between">
                <span>STAGE ANALYSIS WORKFLOW:</span>
                <span>Requested by {tx.initiatedBy}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-[10px] font-mono">
                <div className="p-2 bg-sky-50 border border-sky-200 text-sky-800 rounded-lg text-center font-bold">
                  Stage 1: Submitted
                </div>
                <div className="p-2 bg-sky-50 border border-sky-200 text-sky-800 rounded-lg text-center font-bold">
                  Stage 2: Lock Acquired
                </div>
                <div className="p-2 bg-sky-50 border border-sky-200 text-sky-800 rounded-lg text-center font-bold">
                  Stage 3: Doctor Verified
                </div>
                <div className={`p-2 rounded-lg text-center font-bold border ${
                  tx.status === 'COMMITTED' ? 'bg-emerald-100 border-emerald-300 text-emerald-800' :
                  tx.status === 'ROLLED_BACK' ? 'bg-amber-100 border-amber-300 text-amber-800' :
                  'bg-rose-100 border-rose-300 text-rose-800'
                }`}>
                  Stage 4: {tx.status}
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <div className="text-slate-500 font-mono text-[11px]">
                Target Resource: <strong className="text-slate-800">{tx.resourceType} ({tx.resourceId})</strong>
              </div>
              <button
                onClick={() => setSelectedTx(tx)}
                className="px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 rounded-xl font-bold font-mono text-xs flex items-center gap-1.5"
              >
                <Eye className="w-4 h-4" /> Inspect Sequence Timeline ({tx.events?.length || 4} Events)
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Transaction Timeline Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Sequence Timeline Trace: {selectedTx.transactionNumber}</h3>
              <button onClick={() => setSelectedTx(null)} className="px-3 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg text-xs">
                Close Trace
              </button>
            </div>
            <TransactionTimeline transaction={selectedTx} />
          </div>
        </div>
      )}
    </div>
  );
}
