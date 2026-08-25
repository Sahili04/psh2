import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Bed, Filter, Search } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export function BedsPage() {
  const [beds, setBeds] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  const { socket } = useSocket();

  // Filter States
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const loadData = () => {
    Promise.all([api.getBeds(), api.getDepartments()]).then(([b, d]) => {
      setBeds(b);
      setDepts(d);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-refresh beds when resource state changes via WebSocket
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => { loadData(); };
    socket.on('resource:updated', handleUpdate);
    socket.on('transaction:updated', handleUpdate);
    return () => {
      socket.off('resource:updated', handleUpdate);
      socket.off('transaction:updated', handleUpdate);
    };
  }, [socket]);

  const filteredBeds = beds.filter((b) => {
    if (selectedStatus !== 'ALL' && b.status !== selectedStatus) return false;
    if (selectedDeptId !== 'ALL' && b.departmentId !== selectedDeptId) return false;
    if (selectedType !== 'ALL' && b.type !== selectedType) return false;
    return true;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-slate-200 p-6 rounded-2xl shadow-sm gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Bed className="w-6 h-6 text-sky-600" /> Hospital Beds & Ward Inventory ({beds.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">Real-time bed allocation grid with multi-level department, status & ward filtering</p>
        </div>
      </div>

      {/* 3 Multi-Level Filter Dropdowns */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-700 font-bold">
          <Filter className="w-4 h-4 text-sky-600" /> Filters:
        </div>

        {/* 1. Filter by Status */}
        <div className="flex-1 space-y-1">
          <label className="text-slate-500 block">Bed Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-sky-500 font-bold"
          >
            <option value="ALL">All Statuses (Occupied / Available / Reserved / Maintenance)</option>
            <option value="AVAILABLE">AVAILABLE (Ready for Admission)</option>
            <option value="OCCUPIED">OCCUPIED (Active Patient Allotted)</option>
            <option value="RESERVED">RESERVED (Engine Transaction Lock)</option>
            <option value="MAINTENANCE">MAINTENANCE (Sterilization / Repair)</option>
          </select>
        </div>

        {/* 2. Filter by Department */}
        <div className="flex-1 space-y-1">
          <label className="text-slate-500 block">Department Unit</label>
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-sky-500 font-bold"
          >
            <option value="ALL">All 10 Departments</option>
            {depts.map((d) => (
              <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
            ))}
          </select>
        </div>

        {/* 3. Filter by Ward Type */}
        <div className="flex-1 space-y-1">
          <label className="text-slate-500 block">Ward Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-sky-500 font-bold"
          >
            <option value="ALL">All Ward Types (ICU, Emergency, General, Isolation)</option>
            <option value="ICU">ICU (Intensive Care Unit)</option>
            <option value="EMERGENCY">EMERGENCY (Trauma Care)</option>
            <option value="GENERAL">GENERAL (Standard Ward)</option>
            <option value="ISOLATION">ISOLATION (Oncology / Infection Control)</option>
          </select>
        </div>
      </div>

      {/* Filter Summary */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
        <div>Showing <strong className="text-slate-900 font-bold">{filteredBeds.length}</strong> of {beds.length} Total Beds</div>
        {(selectedStatus !== 'ALL' || selectedDeptId !== 'ALL' || selectedType !== 'ALL') && (
          <button
            onClick={() => { setSelectedStatus('ALL'); setSelectedDeptId('ALL'); setSelectedType('ALL'); }}
            className="text-sky-700 font-bold hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Filtered Beds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredBeds.map((b) => (
          <div key={b.id} className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-sm hover:border-sky-300 transition">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-extrabold text-base text-slate-900 font-mono">{b.bedNumber}</span>
              <StatusBadge status={b.status} />
            </div>
            <div className="text-xs text-slate-600 font-mono space-y-1">
              <div>Ward Type: <span className="text-slate-900 font-bold">{b.type}</span></div>
              <div>Floor: <span className="text-slate-800 font-bold">{b.floor}</span></div>
              <div>Department: <span className="text-sky-700 font-bold">{b.department?.name || 'General Ward'}</span></div>
              {b.currentPatientId && (
                <div className="pt-1 text-[11px] text-indigo-700 font-bold">
                  Allotted Patient ID: PAT-{b.currentPatientId.substring(0, 6)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
