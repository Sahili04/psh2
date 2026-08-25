import React, { useState } from 'react';
import { api } from '../services/api';
import {
  Zap, Play, CheckCircle2, XCircle, ShieldAlert, Activity,
  RefreshCw, Sparkles, BarChart3, Clock, TrendingUp, AlertTriangle,
  Shield, Cpu, Database, GitBranch, Server
} from 'lucide-react';

interface ScenarioResult {
  scenario: string;
  [key: string]: any;
}

interface StressMetrics {
  totalRequests: number;
  successfulTransactions: number;
  failedTransactions: number;
  conflicts: number;
  duplicates: number;
  doubleAllocations: number;
  totalTimeMs: number;
  avgResponseTimeMs: string;
  throughputReqPerSec: string;
  targetBed?: string;
  assertion?: string;
}

const scenarioBadgeColors: Record<string, string> = {
  CONFLICT: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  DUPLICATE: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  OUT_OF_ORDER: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  DOCTOR_FAILURE: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  PARTIAL_FAILURE: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  NETWORK_TIMEOUT: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
};

export function SimulationLab() {
  const [running, setRunning] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [scenarioResult, setScenarioResult] = useState<ScenarioResult | null>(null);
  const [stressMetrics, setStressMetrics] = useState<StressMetrics | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    const ts = new Date().toLocaleTimeString('en-IN');
    setLog((prev) => [`[${ts}] ${msg}`, ...prev.slice(0, 19)]);
  };

  const triggerScenario = async (scenario: string, label: string) => {
    setRunning(true);
    setActiveScenario(label);
    setActiveScenarioId(scenario);
    setErrorMsg('');
    setScenarioResult(null);
    setStressMetrics(null);
    addLog(`▶ Starting: ${label}...`);

    try {
      const res = await api.runSimulation(scenario);
      if (scenario.startsWith('STRESS')) {
        setStressMetrics(res);
        addLog(`✅ Stress test complete — ${res.totalRequests} requests, ${res.doubleAllocations} double allocations`);
      } else {
        setScenarioResult(res);
        addLog(`✅ ${label} executed — result: ${res.status || res.eventStatus || 'OK'}`);
      }
    } catch (err: any) {
      const msg = err.message || 'Simulation execution failed';
      setErrorMsg(msg);
      addLog(`❌ Error: ${msg}`);
    } finally {
      setRunning(false);
    }
  };

  const edgeCases = [
    {
      id: 'CONFLICT',
      title: 'Resource Conflict Resolution',
      desc: 'EMERGENCY vs ROUTINE request same ICU Bed simultaneously — Priority Engine picks winner',
      icon: <ShieldAlert className="w-5 h-5 text-amber-400" />,
      badge: 'PRIORITY WINNER',
      borderColor: 'hover:border-amber-500/50',
      textColor: 'text-amber-400',
    },
    {
      id: 'DUPLICATE',
      title: 'Idempotency Protection',
      desc: 'Submit identical TX-IDEMPOTENT twice — verifies zero double allocation',
      icon: <Shield className="w-5 h-5 text-sky-400" />,
      badge: 'IDEMPOTENCY',
      borderColor: 'hover:border-sky-500/50',
      textColor: 'text-sky-400',
    },
    {
      id: 'OUT_OF_ORDER',
      title: 'Out-of-Order Event Handling',
      desc: 'Send Event Sequence #5 when #2 is expected — system flags and protects state',
      icon: <GitBranch className="w-5 h-5 text-purple-400" />,
      badge: 'SEQUENCE CHECK',
      borderColor: 'hover:border-purple-500/50',
      textColor: 'text-purple-400',
    },
    {
      id: 'DOCTOR_FAILURE',
      title: 'Doctor Failure Validation',
      desc: 'Simulate unavailable doctor mid-assignment — conflict escalated cleanly',
      icon: <XCircle className="w-5 h-5 text-rose-400" />,
      badge: 'FAILURE INJECT',
      borderColor: 'hover:border-rose-500/50',
      textColor: 'text-rose-400',
    },
    {
      id: 'PARTIAL_FAILURE',
      title: 'Saga Compensation & Rollback',
      desc: 'Bed ✅ → Doctor ✅ → Ventilator ❌ → All released via Saga Compensator',
      icon: <RefreshCw className="w-5 h-5 text-emerald-400" />,
      badge: 'SAGA ROLLBACK',
      borderColor: 'hover:border-emerald-500/50',
      textColor: 'text-emerald-400',
    },
    {
      id: 'NETWORK_TIMEOUT',
      title: 'Network Retry Resilience',
      desc: 'Dropped packet simulation — duplicate retry returns same result without re-allocating',
      icon: <Server className="w-5 h-5 text-teal-400" />,
      badge: 'RETRY SAFE',
      borderColor: 'hover:border-teal-500/50',
      textColor: 'text-teal-400',
    },
  ];

  const renderScenarioOutput = (result: ScenarioResult) => {
    const id = activeScenarioId;

    return (
      <div className="glass-panel p-6 rounded-2xl space-y-4 shadow-2xl border border-cyan-500/20">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            {result.scenario || activeScenario}
          </h3>
          {id && (
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${scenarioBadgeColors[id] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
              EXECUTION COMPLETE
            </span>
          )}
        </div>

        {/* CONFLICT-specific rich display */}
        {id === 'CONFLICT' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-950/60 border border-emerald-500/30 rounded-xl space-y-1">
              <div className="text-[10px] font-mono text-emerald-300 font-bold uppercase">🏆 Winner</div>
              <div className="text-sm font-bold text-emerald-300">{result.winner?.priority} Priority</div>
              <div className="text-xs text-slate-400 font-mono">{result.winner?.txNumber}</div>
              <div className="text-xs text-slate-300">Patient: {result.winner?.patient}</div>
            </div>
            <div className="p-4 bg-rose-950/60 border border-rose-500/30 rounded-xl space-y-1">
              <div className="text-[10px] font-mono text-rose-300 font-bold uppercase">❌ Loser (Escalated)</div>
              <div className="text-sm font-bold text-rose-300">{result.loser?.priority} Priority</div>
              <div className="text-xs text-slate-400 font-mono">{result.loser?.txNumber}</div>
              <div className="text-xs text-slate-300">Status: {result.loser?.status}</div>
            </div>
            <div className="col-span-full p-3 bg-amber-950/40 border border-amber-500/20 rounded-xl text-xs text-amber-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              {result.message}
            </div>
          </div>
        )}

        {/* DUPLICATE/NETWORK-specific display */}
        {(id === 'DUPLICATE' || id === 'NETWORK_TIMEOUT') && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-sky-950/60 border border-sky-500/30 rounded-xl space-y-1">
                <div className="text-[10px] font-mono text-sky-300 font-bold">1st REQUEST</div>
                <div className="text-xs text-slate-300">{result.firstAttempt?.message}</div>
                <div className="text-sm font-bold text-emerald-300">Status: {result.firstAttempt?.status}</div>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl space-y-1">
                <div className="text-[10px] font-mono text-slate-400 font-bold">2nd REQUEST (Duplicate)</div>
                <div className="text-xs text-slate-300">{result.secondAttempt?.message}</div>
                <div className={`text-sm font-bold ${result.secondAttempt?.isDuplicate ? 'text-sky-300' : 'text-rose-300'}`}>
                  Idempotency: {result.secondAttempt?.isDuplicate ? '✅ Protected' : '❌ Failed'}
                </div>
              </div>
            </div>
            <div className="p-3 bg-slate-950/80 border border-slate-700 rounded-xl text-xs font-mono text-slate-400">
              TX Number: <span className="text-cyan-300">{result.transactionNumber}</span> &nbsp;|&nbsp;
              Double Allocations: <span className="text-emerald-400 font-bold">{result.doubleAllocations}</span>
            </div>
          </div>
        )}

        {/* OUT_OF_ORDER specific */}
        {id === 'OUT_OF_ORDER' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-1">
                <div className="text-[10px] font-mono text-slate-500">Sequence Sent</div>
                <div className="text-2xl font-black text-rose-400">{result.sequenceSent}</div>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-1">
                <div className="text-[10px] font-mono text-slate-500">Expected Seq</div>
                <div className="text-2xl font-black text-emerald-400">{result.expectedSequence}</div>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-1">
                <div className="text-[10px] font-mono text-slate-500">Event Status</div>
                <div className="text-sm font-black text-purple-300">{result.eventStatus}</div>
              </div>
            </div>
            <div className={`p-3 border rounded-xl text-xs flex items-center gap-2 font-mono ${result.detectedOutOfOrder ? 'bg-purple-950/60 border-purple-500/30 text-purple-200' : 'bg-rose-950/60 border-rose-500/30 text-rose-200'}`}>
              {result.detectedOutOfOrder ? '✅' : '❌'} {result.message}
            </div>
          </div>
        )}

        {/* DOCTOR_FAILURE specific */}
        {id === 'DOCTOR_FAILURE' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="text-[10px] font-mono text-slate-500">Doctor</div>
                <div className="text-sm font-bold text-slate-200">{result.doctorAssigned || 'Unknown'}</div>
              </div>
              <div className="p-4 bg-rose-950/60 border border-rose-500/30 rounded-xl space-y-1">
                <div className="text-[10px] font-mono text-rose-300">Final Status</div>
                <div className="text-sm font-bold text-rose-300">{result.status}</div>
              </div>
            </div>
            <div className="p-3 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-slate-300 font-mono">
              {result.engineAction || result.message}
            </div>
          </div>
        )}

        {/* PARTIAL_FAILURE specific */}
        {id === 'PARTIAL_FAILURE' && (
          <div className="space-y-3">
            <div className="space-y-2 font-mono text-xs">
              {[
                { label: 'Step 1: Bed Reservation', val: result.step1_BedReservation },
                { label: 'Step 2: Doctor Assignment', val: result.step2_DoctorAssignment },
                { label: 'Step 3: Equipment Allocation', val: result.step3_EquipmentAllocation },
                { label: 'Saga Compensation', val: result.sagaCompensation },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between p-2 bg-slate-950/80 border border-slate-800 rounded-lg">
                  <span className="text-slate-400">{s.label}</span>
                  <span className={`${s.val?.includes('✅') ? 'text-emerald-300' : s.val?.includes('❌') ? 'text-rose-300' : 'text-amber-300'}`}>{s.val}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="text-slate-500">Bed Before</div>
                <div className="text-emerald-300 font-bold">{result.bedStatusBefore}</div>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="text-slate-500">Bed After Rollback</div>
                <div className={`font-bold ${result.bedStatusAfterCompensation === 'AVAILABLE' ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {result.bedStatusAfterCompensation}
                </div>
              </div>
            </div>
            <div className={`p-3 border rounded-xl text-xs flex items-center gap-2 ${result.compensationExecuted ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-200' : 'bg-rose-950/40 border-rose-500/20 text-rose-200'}`}>
              {result.compensationExecuted ? '✅ Saga Compensation Executed — All resources freed successfully.' : '⚠️ ' + result.message}
            </div>
          </div>
        )}

        {/* Raw JSON fallback */}
        <details className="text-xs">
          <summary className="cursor-pointer text-slate-500 font-mono hover:text-slate-300 transition-colors">View Raw JSON Output</summary>
          <div className="mt-2 p-3 bg-slate-950/90 border border-slate-800/80 rounded-xl font-mono text-cyan-300 overflow-x-auto">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        </details>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 fill-current" /> MediVerse Live Verification Suite
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-100 tracking-tight">
            Simulation Lab & Concurrency Engine
          </h1>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Test backend edge cases live or trigger parallel load tests (100, 500, 1000 requests) to verify zero double-allocation correctness.
          </p>
        </div>
        {/* Live status */}
        <div className="flex flex-col items-end gap-2">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${running ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 animate-pulse' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
            <span className={`w-2 h-2 rounded-full ${running ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            {running ? 'RUNNING' : 'READY'}
          </div>
          <div className="text-[10px] font-mono text-slate-500">MediVerse Engine Connected</div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-950/80 border border-rose-700 text-rose-300 text-xs rounded-2xl font-mono flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SECTION 1: Edge Cases */}
      <div className="space-y-4">
        <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" /> 1. Edge-Case Scenario Triggers
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {edgeCases.map((ec) => (
            <button
              key={ec.id}
              disabled={running}
              onClick={() => triggerScenario(ec.id, ec.title)}
              className={`glass-card p-5 rounded-2xl text-left flex flex-col justify-between space-y-4 ${ec.borderColor} transition duration-300 group disabled:opacity-50 disabled:cursor-not-allowed ${activeScenarioId === ec.id && running ? 'border-cyan-500/50 shadow-lg shadow-cyan-900/20' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 ${ec.textColor}`}>
                  {ec.badge}
                </span>
                {activeScenarioId === ec.id && running
                  ? <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                  : <Play className={`w-4 h-4 ${ec.textColor} group-hover:translate-x-1 transition-transform`} />
                }
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">{ec.icon}<h3 className="font-bold text-slate-100 text-sm group-hover:text-cyan-300 transition-colors">{ec.title}</h3></div>
                <p className="text-xs text-slate-400 leading-relaxed">{ec.desc}</p>
              </div>
              <div className={`text-[11px] font-mono ${ec.textColor} opacity-60 pt-2 border-t border-white/5`}>
                Click to execute live →
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 2: Stress Tests */}
      <div className="space-y-4 pt-4 border-t border-slate-800/80">
        <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-amber-400" /> 2. High-Concurrency Stress Test Suite
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: '100 Requests', id: 'STRESS_100', count: '100', color: 'text-sky-300', borderClass: 'hover:border-sky-500/40', icon: <Activity className="w-5 h-5 text-sky-400" /> },
            { label: '500 Requests', id: 'STRESS_500', count: '500', color: 'text-purple-300', borderClass: 'hover:border-purple-500/40', icon: <Activity className="w-5 h-5 text-purple-400" /> },
            { label: '1000 Requests', id: 'STRESS_1000', count: '1000', color: 'text-amber-300', borderClass: 'hover:border-amber-500/40 border-amber-500/20', icon: <Zap className="w-5 h-5 text-amber-400 fill-current" /> },
          ].map((s) => (
            <button
              key={s.id}
              disabled={running}
              onClick={() => triggerScenario(s.id, s.label)}
              className={`glass-card p-6 rounded-2xl text-left space-y-3 group ${s.borderClass} transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xl font-black ${s.color}`}>{s.count} Requests</span>
                {activeScenarioId === s.id && running ? <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" /> : s.icon}
              </div>
              <p className="text-xs text-slate-400">{s.count} parallel HTTP requests targeting 1 ICU Bed simultaneously</p>
              <div className={`text-xs font-bold ${s.color} flex items-center gap-1 pt-2 border-t border-white/5`}>
                Run Load Test <Play className="w-3.5 h-3.5" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Running Indicator */}
      {running && (
        <div className="p-6 glass-panel rounded-2xl flex items-center justify-center gap-3 text-cyan-400 font-mono text-sm shadow-2xl animate-pulse border border-cyan-500/20">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Executing <span className="font-bold text-cyan-300">{activeScenario}</span>... Serializing DB locks & asserting 0 double allocations...
        </div>
      )}

      {/* Stress Metrics Hero */}
      {stressMetrics && (
        <div className="glass-panel p-8 rounded-3xl space-y-6 shadow-2xl border border-emerald-500/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
            <div>
              <div className="text-xs font-mono text-slate-400 uppercase">Load Test Execution Complete</div>
              <h3 className="text-2xl font-black text-slate-100 mt-1">{activeScenario} Results</h3>
              {stressMetrics.targetBed && (
                <div className="text-xs font-mono text-slate-500 mt-1">
                  Target Bed: <span className="text-cyan-400">{stressMetrics.targetBed}</span>
                </div>
              )}
            </div>
            <div className="p-6 bg-gradient-to-br from-emerald-950 to-slate-900 border border-emerald-500/50 rounded-2xl text-right shadow-2xl">
              <div className="text-xs font-mono text-emerald-300 font-bold uppercase tracking-wider">Double Allocations</div>
              <div className={`text-4xl font-black font-mono my-1 ${stressMetrics.doubleAllocations === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stressMetrics.doubleAllocations}
              </div>
              <div className={`text-[11px] font-mono flex items-center justify-end gap-1 font-bold ${stressMetrics.doubleAllocations === 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {stressMetrics.doubleAllocations === 0 ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {stressMetrics.doubleAllocations === 0 ? 'VERIFIED 100% CORRECT' : 'ALLOCATION ERROR'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 font-mono text-xs">
            {[
              { label: 'Total Requests', val: stressMetrics.totalRequests, color: 'text-slate-100' },
              { label: 'Successful Tx', val: stressMetrics.successfulTransactions, color: 'text-emerald-400' },
              { label: 'Conflicts Escalated', val: stressMetrics.conflicts, color: 'text-amber-400' },
              { label: 'Duplicates Filtered', val: stressMetrics.duplicates, color: 'text-cyan-400' },
              { label: 'Avg Response', val: `${stressMetrics.avgResponseTimeMs} ms`, color: 'text-purple-400' },
              { label: 'Throughput', val: `${stressMetrics.throughputReqPerSec} r/s`, color: 'text-teal-400' },
            ].map((m) => (
              <div key={m.label} className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-1">
                <div className="text-slate-500 text-[10px]">{m.label}</div>
                <div className={`text-xl font-bold ${m.color}`}>{m.val}</div>
              </div>
            ))}
          </div>

          {stressMetrics.assertion && (
            <div className={`p-3 border rounded-xl text-xs font-mono ${stressMetrics.assertion.includes('✅') ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-200' : 'bg-rose-950/40 border-rose-500/20 text-rose-200'}`}>
              {stressMetrics.assertion}
            </div>
          )}
        </div>
      )}

      {/* Scenario Result Display */}
      {scenarioResult && renderScenarioOutput(scenarioResult)}

      {/* Activity Log */}
      {log.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Cpu className="w-4 h-4 text-slate-500" /> Live Execution Log
          </h3>
          <div className="p-4 bg-slate-950/90 border border-slate-800/60 rounded-2xl font-mono text-xs space-y-1 max-h-44 overflow-y-auto">
            {log.map((entry, i) => (
              <div key={i} className={`${i === 0 ? 'text-cyan-300' : 'text-slate-500'}`}>{entry}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
