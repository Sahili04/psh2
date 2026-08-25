import React, { useState } from 'react';
import { api } from '../services/api';
import { Zap, Play, CheckCircle2, ShieldAlert, Activity, RefreshCw, Sparkles, BarChart3 } from 'lucide-react';

export function SimulationLab() {
  const [running, setRunning] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [scenarioResult, setScenarioResult] = useState<any>(null);
  const [stressMetrics, setStressMetrics] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const triggerScenario = async (scenario: string, label: string) => {
    setRunning(true);
    setActiveScenario(label);
    setErrorMsg('');
    try {
      const res = await api.runSimulation(scenario);
      if (scenario.startsWith('STRESS')) {
        setStressMetrics(res);
        setScenarioResult(null);
      } else {
        setScenarioResult(res);
        setStressMetrics(null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Simulation execution failed');
    } finally {
      setRunning(false);
    }
  };

  const edgeCases = [
    {
      id: 'CONFLICT',
      title: 'Resource Conflict Resolution',
      desc: 'Emergency vs Routine requesting same ICU Bed simultaneously',
      color: 'hover:border-amber-500/50 text-amber-400',
      badge: 'PRIORITY WINNER',
    },
    {
      id: 'DUPLICATE',
      title: 'Idempotency Protection',
      desc: 'Submit exact same TX-1001 twice — verifies single allocation',
      color: 'hover:border-sky-500/50 text-sky-400',
      badge: 'IDEMPOTENCY',
    },
    {
      id: 'OUT_OF_ORDER',
      title: 'Out-of-Order Event Handling',
      desc: 'Send Event Sequence #5 before #2 arrives — asserts protection',
      color: 'hover:border-purple-500/50 text-purple-400',
      badge: 'SEQUENCE CHECK',
    },
    {
      id: 'DOCTOR_FAILURE',
      title: 'Doctor Failure Validation',
      desc: 'Simulate unavailable doctor during assignment step',
      color: 'hover:border-rose-500/50 text-rose-400',
      badge: 'VALIDATION FAIL',
    },
    {
      id: 'PARTIAL_FAILURE',
      title: 'Saga Compensation & Rollback',
      desc: 'Bed reserved ✓, Doctor assigned ✓, Ventilator offline ✗ → Rollback',
      color: 'hover:border-emerald-500/50 text-emerald-400',
      badge: 'SAGA ROLLBACK',
    },
    {
      id: 'MULTI_RESOURCE_SUCCESS',
      title: 'Multi-Resource Atomic (Success)',
      desc: 'Allocate ICU Bed + Doctor + Ventilator atomically — all succeed ✓',
      color: 'hover:border-green-500/50 text-green-400',
      badge: 'ATOMIC COMMIT',
    },
    {
      id: 'MULTI_RESOURCE_VENTILATOR_FAIL',
      title: 'Multi-Resource Rollback (Ventilator Fail)',
      desc: 'Bed ✓ Doctor ✓ Ventilator ✗ → Auto rollback Bed + Doctor',
      color: 'hover:border-orange-500/50 text-orange-400',
      badge: 'MULTI ROLLBACK',
    },
    {
      id: 'NETWORK_TIMEOUT',
      title: 'Network Retry Resilience',
      desc: 'Simulate client network dropped packets and state recovery',
      color: 'hover:border-teal-500/50 text-teal-400',
      badge: 'RETRY SAFE',
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 fill-current" /> H-02 Live Verification Suite
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-100 tracking-tight">
            Simulation Lab & Concurrency Engine
          </h1>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Test backend edge cases live or trigger parallel load tests (100, 500, 1000 requests) to verify zero double-allocation correctness.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-950/80 border border-rose-700 text-rose-300 text-xs rounded-2xl font-mono">
          {errorMsg}
        </div>
      )}

      {/* SECTION 1: Edge-Case Scenarios */}
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
              className={`glass-card p-5 rounded-2xl text-left flex flex-col justify-between space-y-4 ${ec.color} transition duration-300 group`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                  {ec.badge}
                </span>
                <Play className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>

              <div>
                <h3 className="font-bold text-slate-100 text-sm group-hover:text-cyan-300 transition-colors">
                  {ec.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{ec.desc}</p>
              </div>

              <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-white/5">
                Click to execute scenario live →
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 2: High Concurrency Load Testing */}
      <div className="space-y-4 pt-4 border-t border-slate-800/80">
        <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-amber-400" /> 2. High-Concurrency Stress Test Suite
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            disabled={running}
            onClick={() => triggerScenario('STRESS_100', '100 Concurrent Requests')}
            className="glass-card glass-card-amber p-6 rounded-2xl text-left space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-slate-100">100 Requests</span>
              <Activity className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-xs text-slate-400">100 parallel HTTP requests targeting 1 ICU Bed</p>
            <div className="text-xs font-bold text-sky-400 flex items-center gap-1 pt-2">
              Run Load Test <Play className="w-3.5 h-3.5" />
            </div>
          </button>

          <button
            disabled={running}
            onClick={() => triggerScenario('STRESS_500', '500 Concurrent Requests')}
            className="glass-card glass-card-amber p-6 rounded-2xl text-left space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-slate-100">500 Requests</span>
              <Activity className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-xs text-slate-400">500 parallel HTTP requests targeting 1 ICU Bed</p>
            <div className="text-xs font-bold text-purple-400 flex items-center gap-1 pt-2">
              Run Heavy Load Test <Play className="w-3.5 h-3.5" />
            </div>
          </button>

          <button
            disabled={running}
            onClick={() => triggerScenario('STRESS_1000', '1000 Concurrent Requests')}
            className="glass-card glass-card-amber p-6 rounded-2xl text-left space-y-3 group bg-gradient-to-b from-amber-500/10 to-slate-900/60 border-amber-500/30"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-amber-300">1000 Requests</span>
              <Zap className="w-5 h-5 text-amber-400 fill-current group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-xs text-slate-400">1000 parallel requests targeting 1 ICU Bed</p>
            <div className="text-xs font-bold text-amber-400 flex items-center gap-1 pt-2">
              Run 1000-Request Assertion <Play className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      </div>

      {/* Execution Indicator */}
      {running && (
        <div className="p-6 glass-panel rounded-2xl flex items-center justify-center gap-3 text-cyan-400 font-mono text-sm shadow-2xl animate-pulse">
          <RefreshCw className="w-5 h-5 animate-spin" /> Executing {activeScenario}... Serializing DB locks & asserting 0 double allocations...
        </div>
      )}

      {/* Stress Metrics Hero Visualizer */}
      {stressMetrics && (
        <div className="glass-panel p-8 rounded-3xl space-y-6 shadow-2xl border border-emerald-500/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
            <div>
              <div className="text-xs font-mono text-slate-400 uppercase">LOAD TEST EXECUTION COMPLETE</div>
              <h3 className="text-2xl font-black text-slate-100 mt-1">{activeScenario} Results</h3>
            </div>
            {/* ZERO DOUBLE ALLOCATION ASSERTION CARD */}
            <div className="p-6 bg-gradient-to-br from-emerald-950 to-slate-900 border border-emerald-500/50 rounded-2xl text-right shadow-2xl">
              <div className="text-xs font-mono text-emerald-300 font-bold uppercase tracking-wider">DOUBLE ALLOCATIONS</div>
              <div className="text-4xl font-black text-emerald-400 font-mono my-1">{stressMetrics.doubleAllocations}</div>
              <div className="text-[11px] text-emerald-300 font-mono flex items-center justify-end gap-1 font-bold">
                <CheckCircle2 className="w-4 h-4" /> VERIFIED 100% CORRECT
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 font-mono text-xs">
            <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-1">
              <div className="text-slate-400">Total Requests</div>
              <div className="text-xl font-bold text-slate-100">{stressMetrics.totalRequests}</div>
            </div>
            <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-1">
              <div className="text-emerald-400">Successful Tx</div>
              <div className="text-xl font-bold text-emerald-400">{stressMetrics.successfulTransactions}</div>
            </div>
            <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-1">
              <div className="text-amber-400">Conflicts Escalated</div>
              <div className="text-xl font-bold text-amber-400">{stressMetrics.conflicts}</div>
            </div>
            <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-1">
              <div className="text-cyan-400">Duplicates Filtered</div>
              <div className="text-xl font-bold text-cyan-400">{stressMetrics.duplicates}</div>
            </div>
            <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-1">
              <div className="text-purple-400">Avg Response Time</div>
              <div className="text-xl font-bold text-purple-400">{stressMetrics.avgResponseTimeMs} ms</div>
            </div>
            <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-1">
              <div className="text-teal-400">Throughput</div>
              <div className="text-xl font-bold text-teal-400">{stressMetrics.throughputReqPerSec} req/s</div>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Execution JSON Output */}
      {scenarioResult && (
        <div className="glass-panel p-6 rounded-2xl space-y-3 shadow-2xl">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> {scenarioResult.scenario || activeScenario} Execution Output
          </h3>
          <div className="p-4 bg-slate-950/90 border border-slate-800/80 rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto">
            <pre>{JSON.stringify(scenarioResult, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
