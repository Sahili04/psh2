import React, { useEffect, useState, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Activity, Zap, CheckCircle2, AlertTriangle, RefreshCw, Radio, ArrowRight } from 'lucide-react';

interface LiveEvent {
  id: string;
  timestamp: Date;
  type: 'committed' | 'escalated' | 'rolled_back' | 'conflict' | 'resource_update' | 'info';
  title: string;
  detail: string;
  txNumber?: string;
  priority?: string;
  resourceType?: string;
}

export function LiveActivityFeed({ onDataChange }: { onDataChange?: () => void }) {
  const { socket, isConnected } = useSocket();
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [totalReceived, setTotalReceived] = useState<number>(0);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    const handleTransaction = (data: any) => {
      const tx = data?.transaction;
      if (!tx) return;

      setTotalReceived((prev) => prev + 1);

      let type: LiveEvent['type'] = 'info';
      let title = '';
      let detail = '';

      if (tx.status === 'COMMITTED') {
        type = 'committed';
        title = `✅ COMMITTED: ${tx.transactionNumber}`;
        detail = `Resource ${tx.resourceType} (${tx.resourceId?.slice(0, 8)}...) allocated successfully. Priority: ${tx.priority}`;
      } else if (tx.status === 'ESCALATED') {
        type = 'escalated';
        title = `⚠️ ESCALATED: ${tx.transactionNumber}`;
        detail = `Request lost priority conflict for ${tx.resourceType}. Lower priority displaced.`;
      } else if (tx.status === 'ROLLED_BACK') {
        type = 'rolled_back';
        title = `🔄 ROLLED BACK: ${tx.transactionNumber}`;
        detail = `Saga compensation executed. All reserved resources released back to AVAILABLE.`;
      } else if (tx.status === 'COMPENSATING') {
        type = 'rolled_back';
        title = `⏳ COMPENSATING: ${tx.transactionNumber}`;
        detail = `Partial failure detected — compensation in progress, releasing locked resources...`;
      } else {
        type = 'info';
        title = `📡 TX UPDATE: ${tx.transactionNumber}`;
        detail = `Status changed to ${tx.status}. Resource: ${tx.resourceType}`;
      }

      if (data.isDuplicate) {
        type = 'info';
        title = `🔁 DUPLICATE BLOCKED: ${tx.transactionNumber}`;
        detail = `Idempotency check passed — duplicate request safely ignored. No double allocation.`;
      }

      const newEvent: LiveEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date(),
        type,
        title,
        detail,
        txNumber: tx.transactionNumber,
        priority: tx.priority,
        resourceType: tx.resourceType,
      };

      setEvents((prev) => [newEvent, ...prev].slice(0, 50));

      // Trigger parent data refresh
      if (onDataChange) onDataChange();
    };

    const handleConflict = (data: any) => {
      setTotalReceived((prev) => prev + 1);

      const newEvent: LiveEvent = {
        id: `evt-conflict-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date(),
        type: 'conflict',
        title: `🚨 CONFLICT DETECTED`,
        detail: data?.conflict?.reason || 'Two requests competed for the same resource. Priority engine resolved winner.',
        resourceType: 'CONFLICT',
      };

      setEvents((prev) => [newEvent, ...prev].slice(0, 50));
      if (onDataChange) onDataChange();
    };

    const handleResourceUpdate = (data: any) => {
      const newEvent: LiveEvent = {
        id: `evt-res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date(),
        type: 'resource_update',
        title: `📦 RESOURCE STATE CHANGED`,
        detail: data?.resourceType === 'MULTI'
          ? `Multi-resource update: ${data.resources?.map((r: any) => r.type).join(' + ')}`
          : `${data?.resourceType} ${data?.resourceId?.slice(0, 8)}... status updated`,
        resourceType: data?.resourceType,
      };

      setEvents((prev) => [newEvent, ...prev].slice(0, 50));
      if (onDataChange) onDataChange();
    };

    const handleSimProgress = (data: any) => {
      const newEvent: LiveEvent = {
        id: `evt-sim-${Date.now()}`,
        timestamp: new Date(),
        type: 'info',
        title: `🏁 STRESS TEST: ${data?.phase}`,
        detail: `${data?.totalRequests} concurrent requests targeting ${data?.targetBed}`,
      };
      setEvents((prev) => [newEvent, ...prev].slice(0, 50));
    };

    const handleSimCompleted = (data: any) => {
      const newEvent: LiveEvent = {
        id: `evt-sim-done-${Date.now()}`,
        timestamp: new Date(),
        type: 'committed',
        title: `✅ STRESS TEST COMPLETE`,
        detail: `${data?.totalRequests} requests processed. ${data?.successfulTransactions} committed, ${data?.conflicts} conflicts resolved. 0 double allocations.`,
      };
      setEvents((prev) => [newEvent, ...prev].slice(0, 50));
      if (onDataChange) onDataChange();
    };

    socket.on('transaction:updated', handleTransaction);
    socket.on('conflict:created', handleConflict);
    socket.on('conflict:updated', handleConflict);
    socket.on('resource:updated', handleResourceUpdate);
    socket.on('simulation:progress', handleSimProgress);
    socket.on('simulation:completed', handleSimCompleted);

    return () => {
      socket.off('transaction:updated', handleTransaction);
      socket.off('conflict:created', handleConflict);
      socket.off('conflict:updated', handleConflict);
      socket.off('resource:updated', handleResourceUpdate);
      socket.off('simulation:progress', handleSimProgress);
      socket.off('simulation:completed', handleSimCompleted);
    };
  }, [socket, onDataChange]);

  // Auto-scroll feed to top
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [events]);

  const getEventBg = (type: LiveEvent['type']) => {
    switch (type) {
      case 'committed': return 'border-l-emerald-500 bg-emerald-50/60';
      case 'escalated': return 'border-l-amber-500 bg-amber-50/60';
      case 'rolled_back': return 'border-l-rose-500 bg-rose-50/60';
      case 'conflict': return 'border-l-red-600 bg-red-50/60';
      case 'resource_update': return 'border-l-sky-500 bg-sky-50/60';
      default: return 'border-l-slate-400 bg-slate-50/60';
    }
  };

  const getEventIcon = (type: LiveEvent['type']) => {
    switch (type) {
      case 'committed': return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'escalated': return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'rolled_back': return <RefreshCw className="w-4 h-4 text-rose-600" />;
      case 'conflict': return <Zap className="w-4 h-4 text-red-600" />;
      case 'resource_update': return <ArrowRight className="w-4 h-4 text-sky-600" />;
      default: return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 live-feed-header rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></div>
          <div>
            <h3 className="font-extrabold text-sm flex items-center gap-2">
              <Radio className="w-4 h-4" /> LIVE TRANSACTION STREAM
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">Real-time WebSocket feed — all requests visible as they process</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-emerald-300 font-bold">{totalReceived} events received</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isConnected ? 'bg-emerald-600' : 'bg-rose-600'}`}>
            {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>
      </div>

      {/* Event Stream */}
      <div ref={feedRef} className="max-h-[500px] overflow-y-auto divide-y divide-slate-100">
        {events.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-mono text-xs space-y-2">
            <Radio className="w-8 h-8 mx-auto text-slate-300 animate-pulse" />
            <p>Waiting for live events...</p>
            <p className="text-[10px]">Run a simulation from the Simulation Lab or another tab to see requests flowing in real-time here.</p>
          </div>
        ) : (
          events.map((evt) => (
            <div key={evt.id} className={`p-3 border-l-4 ${getEventBg(evt.type)} animate-fade-in`}>
              <div className="flex items-start gap-2">
                {getEventIcon(evt.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-slate-900 truncate">{evt.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                      {evt.timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}.{evt.timestamp.getMilliseconds().toString().padStart(3, '0')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{evt.detail}</p>
                  {evt.priority && (
                    <span className={`inline-block mt-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      evt.priority === 'EMERGENCY' ? 'bg-rose-100 text-rose-800' :
                      evt.priority === 'CRITICAL' ? 'bg-amber-100 text-amber-800' :
                      evt.priority === 'URGENT' ? 'bg-sky-100 text-sky-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {evt.priority}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span>Showing last {events.length} events (max 50 retained in memory)</span>
        <button
          onClick={() => setEvents([])}
          className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded text-slate-700 font-bold"
        >
          Clear Feed
        </button>
      </div>
    </div>
  );
}
