import React from 'react';
import { Transaction, TransactionEvent } from '../types';
import { StatusBadge } from './StatusBadge';
import { Clock, CheckCircle2, AlertTriangle, RefreshCw, XCircle } from 'lucide-react';

export function TransactionTimeline({ transaction }: { transaction: Transaction }) {
  const events = transaction.events || [];

  const getEventIcon = (eventType: string, status: string) => {
    if (status === 'OUT_OF_ORDER' || status === 'REJECTED') return <AlertTriangle className="w-5 h-5 text-rose-600" />;
    if (eventType.includes('COMMITTED') || eventType.includes('RESERVED')) return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    if (eventType.includes('COMPENSATION') || eventType.includes('ROLLED_BACK')) return <RefreshCw className="w-5 h-5 text-amber-600 animate-spin-slow" />;
    if (eventType.includes('FAILED')) return <XCircle className="w-5 h-5 text-rose-600" />;
    return <Clock className="w-5 h-5 text-sky-600" />;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="text-xs text-slate-500 font-mono">TRANSACTION ID</div>
          <div className="text-xl font-bold text-slate-900 flex items-center gap-2">
            {transaction.transactionNumber}
            <StatusBadge status={transaction.status} />
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500 font-mono">RESOURCE & PRIORITY</div>
          <div className="text-sm font-semibold text-slate-800">
            {transaction.resourceType} ({transaction.resourceId}) • <span className="text-amber-700 font-mono">{transaction.priority}</span>
          </div>
        </div>
      </div>

      <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-200">
        {events.map((evt: TransactionEvent, idx: number) => {
          let payloadData: any = {};
          try {
            payloadData = JSON.parse(evt.payload || '{}');
          } catch (e) {}

          return (
            <div key={evt.id || idx} className="relative flex items-start group">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-300 shadow-sm z-10 mr-4">
                {getEventIcon(evt.eventType, evt.status)}
              </div>
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-sky-300 transition shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 bg-slate-200 text-slate-800 rounded font-bold">
                      Seq #{evt.sequenceNumber}
                    </span>
                    <span className="font-mono text-sm font-bold text-sky-700">{evt.eventType}</span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {evt.createdAt ? new Date(evt.createdAt).toLocaleTimeString() : 'Just now'}
                  </span>
                </div>

                <div className="text-xs text-slate-800 mt-2 font-mono bg-white p-3 rounded-lg border border-slate-200 overflow-x-auto shadow-inner">
                  {Object.keys(payloadData).length > 0 ? (
                    <pre className="text-xs text-slate-800 font-mono">{JSON.stringify(payloadData, null, 2)}</pre>
                  ) : (
                    <span>Payload: {evt.payload}</span>
                  )}
                </div>

                {evt.status === 'OUT_OF_ORDER' && (
                  <div className="mt-2 text-xs font-bold text-rose-700 flex items-center gap-1 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                    <AlertTriangle className="w-4 h-4 text-rose-600" /> Sequence conflict: Flagged OUT_OF_ORDER. State protected.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
