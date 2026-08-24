import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Building, Stethoscope, HeartPulse, Bed, Users } from 'lucide-react';

export function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([api.getDepartments(), api.getDoctors(), api.getBeds()]).then(([d, doc, b]) => {
      setDepartments(d);
      setDoctors(doc);
      setBeds(b);
    });
  }, []);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Building className="w-6 h-6 text-sky-600" /> Multi-Specialty Hospital Departments ({departments.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">Specialized clinical units, assigned staff, bed capacities & department heads</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => {
          const deptDocs = doctors.filter((d) => d.departmentId === dept.id);
          const deptBeds = beds.filter((b) => b.departmentId === dept.id);
          const occupiedBeds = deptBeds.filter((b) => b.status === 'OCCUPIED').length;
          const occupancyRate = deptBeds.length > 0 ? Math.round((occupiedBeds / deptBeds.length) * 100) : 0;

          return (
            <div key={dept.id} className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm hover:border-sky-300 transition">
              <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{dept.name}</h3>
                  <p className="text-xs text-sky-700 font-mono font-semibold">{dept.specialty} • Floor {dept.floor}</p>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-1 bg-sky-50 text-sky-800 border border-sky-200 rounded-full">
                  Floor {dept.floor}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="text-slate-500 flex items-center gap-1">
                    <Stethoscope className="w-3.5 h-3.5 text-emerald-600" /> Doctors
                  </div>
                  <div className="text-lg font-bold text-slate-900">{deptDocs.length} Specialists</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="text-slate-500 flex items-center gap-1">
                    <Bed className="w-3.5 h-3.5 text-sky-600" /> Bed Capacity
                  </div>
                  <div className="text-lg font-bold text-slate-900">{deptBeds.length} Beds</div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600 font-mono">
                  <span>Occupancy Rate</span>
                  <span className="font-bold text-slate-900">{occupancyRate}% ({occupiedBeds}/{deptBeds.length})</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                  <div className="bg-sky-500 h-full rounded-full" style={{ width: `${occupancyRate}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
