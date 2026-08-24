import React from 'react';

export function StatusBadge({ status, type = 'default' }: { status: string; type?: string }) {
  let color = 'bg-slate-100 text-slate-700 border-slate-300';

  const s = status.toUpperCase();

  if (['COMMITTED', 'AVAILABLE', 'COMPLETED', 'ACTIVE', 'RESOLVED'].includes(s)) {
    color = 'bg-emerald-50 text-emerald-700 border-emerald-300';
  } else if (['RESERVED', 'PROCESSING', 'CHECKED_IN', 'IN_PROGRESS', 'VALIDATING', 'PENDING', 'SCHEDULED', 'URGENT'].includes(s)) {
    color = 'bg-sky-50 text-sky-700 border-sky-300';
  } else if (['OCCUPIED', 'IN_USE', 'ADMITTED', 'CRITICAL'].includes(s)) {
    color = 'bg-indigo-50 text-indigo-700 border-indigo-300';
  } else if (['EMERGENCY', 'FAILED', 'ROLLED_BACK', 'CANCELLED', 'OUT_OF_ORDER', 'REJECTED'].includes(s)) {
    color = 'bg-rose-50 text-rose-700 border-rose-300';
  } else if (['ESCALATED', 'COMPENSATING', 'CONFLICT', 'OPEN', 'MAINTENANCE'].includes(s)) {
    color = 'bg-amber-50 text-amber-700 border-amber-300';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const p = priority.toUpperCase();
  let color = 'bg-slate-100 text-slate-700 border-slate-300';

  if (p === 'EMERGENCY') color = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
  else if (p === 'CRITICAL') color = 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
  else if (p === 'URGENT') color = 'bg-sky-100 text-sky-800 border-sky-300';
  else if (p === 'ROUTINE') color = 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border ${color}`}>
      {p === 'EMERGENCY' && '⚡ '}
      {priority}
    </span>
  );
}
