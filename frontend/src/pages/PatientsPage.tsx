import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Users, Search } from 'lucide-react';

export function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getPatients().then((p) => setPatients(p));
  }, []);

  const filtered = patients.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.patientNumber.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" /> Patient Registry ({patients.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">Synthetic Electronic Health Records database</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500 w-64"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-mono">
            <tr>
              <th className="p-4">PATIENT NUMBER</th>
              <th className="p-4">NAME</th>
              <th className="p-4">GENDER / DOB</th>
              <th className="p-4">BLOOD GROUP</th>
              <th className="p-4">PRIORITY</th>
              <th className="p-4">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition">
                <td className="p-4 font-bold text-sky-700">{p.patientNumber}</td>
                <td className="p-4 font-bold text-slate-900">{p.name}</td>
                <td className="p-4 text-slate-600">{p.gender}, {p.dateOfBirth}</td>
                <td className="p-4 font-bold text-rose-600">{p.bloodGroup}</td>
                <td className="p-4 text-amber-700 font-bold">{p.priority}</td>
                <td className="p-4"><span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-bold">{p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
