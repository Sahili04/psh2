import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { Link } from 'react-router-dom';
import { Cpu, Bed, AlertTriangle, Scissors } from 'lucide-react';

export function ResourceManagerDashboard() {
  const { user } = useAuth();
  const [beds, setBeds] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [ots, setOts] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([api.getBeds(), api.getEquipment(), api.getOTs(), api.getConflicts()]).then(([b, eq, ot, c]) => {
      setBeds(b);
      setEquipment(eq);
      setOts(ot);
      setConflicts(c);
    });
  }, []);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-rose-600" /> Resource Operations & Allocation Control
          </h1>
          <p className="text-xs text-slate-500 mt-1">Real-time inventory management of Beds, Ventilators & Operation Theatres</p>
        </div>
        <Link
          to="/conflicts"
          className="px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" /> Conflict Center ({conflicts.filter((c) => c.status === 'OPEN').length})
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Beds Control Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Bed className="w-4 h-4 text-sky-600" /> Beds ({beds.length})
            </h2>
            <Link to="/beds" className="text-xs text-sky-600 hover:underline">Manage</Link>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {beds.slice(0, 10).map((b) => (
              <div key={b.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-mono">
                <div>
                  <div className="font-bold text-slate-900">{b.bedNumber}</div>
                  <div className="text-slate-500 text-[11px]">{b.type} • Floor {b.floor}</div>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Equipment Control Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Cpu className="w-4 h-4 text-rose-600" /> Equipment ({equipment.length})
            </h2>
            <Link to="/equipment" className="text-xs text-sky-600 hover:underline">Manage</Link>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {equipment.slice(0, 10).map((eq) => (
              <div key={eq.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-mono">
                <div>
                  <div className="font-bold text-slate-900">{eq.name}</div>
                  <div className="text-slate-500 text-[11px]">{eq.serialNumber}</div>
                </div>
                <StatusBadge status={eq.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Operation Theatres Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Scissors className="w-4 h-4 text-emerald-600" /> Operation Theatres ({ots.length})
            </h2>
            <Link to="/ots" className="text-xs text-sky-600 hover:underline">Manage</Link>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {ots.map((ot) => (
              <div key={ot.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-mono">
                <div>
                  <div className="font-bold text-slate-900">{ot.name}</div>
                  <div className="text-slate-500 text-[11px]">Floor {ot.floor}</div>
                </div>
                <StatusBadge status={ot.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
