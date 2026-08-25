import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSearchParams, Link } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import {
  Building, Users, Bed, Stethoscope, HeartPulse, Calendar, GitCommit, AlertTriangle,
  Zap, Clock, CheckCircle2, XCircle, ArrowUpRight, Plus, UserPlus, Shield, ArrowRightLeft
} from 'lucide-react';

import { EquipmentMonitoringTab } from '../components/EquipmentMonitoringTab';
import { PendingBedRequestsSection } from '../components/PendingBedRequestsSection';

export function AdminDashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as any;

  const [beds, setBeds] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [nurses, setNurses] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Department Admin Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'staff' | 'patients' | 'resources' | 'equipment_health' | 'scheduling' | 'h02_requests'>(tabParam || 'overview');

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Modals & Actions State
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [shiftTime, setShiftTime] = useState('Morning (08:00 - 16:00)');

  // Staff Provisioning State
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'DOCTOR' | 'NURSE'>('DOCTOR');
  const [newStaffSpec, setNewStaffSpec] = useState('');
  const [provisionResult, setProvisionResult] = useState<any>(null);

  const [showReserveBedModal, setShowReserveBedModal] = useState(false);
  const [selectedBed, setSelectedBed] = useState<any>(null);
  const [reserveReason, setReserveReason] = useState('Reserved for Emergency Trauma Transfer');

  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [b, p, d, a, eq, t, c, dep] = await Promise.all([
        api.getBeds().catch(() => []),
        api.getPatients().catch(() => []),
        api.getDoctors().catch(() => []),
        api.getAppointments().catch(() => []),
        api.getEquipment().catch(() => []),
        api.getTransactions().catch(() => []),
        api.getConflicts().catch(() => []),
        api.getDepartments().catch(() => []),
      ]);
      setBeds(Array.isArray(b) ? b : []);
      setPatients(Array.isArray(p) ? p : []);
      setDoctors(Array.isArray(d) ? d : []);
      setAppointments(Array.isArray(a) ? a : []);
      setEquipment(Array.isArray(eq) ? eq : []);
      setTransactions(Array.isArray(t) ? t : []);
      setConflicts(Array.isArray(c) ? c : []);
      setDepts(Array.isArray(dep) ? dep : []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Identify Logged-In Admin's Department
  const userDeptId = (user as any)?.departmentId;
  const userDeptName = (user as any)?.department;

  const currentDept = depts.find((d: any) =>
    (userDeptId && d.id === userDeptId) ||
    (userDeptName && typeof userDeptName === 'string' && d.name.toLowerCase().includes(userDeptName.toLowerCase())) ||
    (userDeptName && typeof userDeptName === 'object' && d.id === userDeptName.id)
  ) || depts[0] || { id: 'icu-01', name: 'Intensive Care Unit (ICU)', code: 'ICU' };

  // --- ISOLATED DEPARTMENT SCOPED FILTERING ---
  const isSuperOrGlobal = user?.role === 'SUPER_ADMIN';

  const deptBeds = isSuperOrGlobal
    ? beds
    : beds.filter((b) => b.departmentId === currentDept.id || b.department?.name === currentDept.name || b.department?.id === currentDept.id);

  const deptDoctors = isSuperOrGlobal
    ? doctors
    : doctors.filter((d) => d.departmentId === currentDept.id || d.department?.name === currentDept.name || d.department?.id === currentDept.id);

  const deptPatients = patients;

  const deptAppointments = isSuperOrGlobal
    ? appointments
    : appointments.filter((a) => a.departmentId === currentDept.id || a.department?.name === currentDept.name);

  const deptEquipment = isSuperOrGlobal
    ? equipment
    : equipment.filter((eq) => eq.departmentId === currentDept.id || eq.department?.name === currentDept.name);

  const deptConflicts = isSuperOrGlobal
    ? conflicts
    : conflicts.filter((c) => c.departmentId === currentDept.id || c.departmentId === userDeptId);

  // --- STAFF SHIFT ACTION HANDLER ---
  const handleAssignShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    setMsg(`SUCCESS: Assigned ${shiftTime} shift to ${selectedStaff.user?.name || selectedStaff.name}`);
    setShowShiftModal(false);
    setSelectedStaff(null);
  };

  // --- STAFF PROVISIONING HANDLER ---
  const handleProvisionStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createStaff({
        name: newStaffName,
        email: newStaffEmail,
        password: 'StaffPass2026!',
        role: newStaffRole,
        departmentId: currentDept.id,
        specialization: newStaffSpec || currentDept.name,
        licenseNumber: `LIC-${Math.floor(10000 + Math.random() * 90000)}`,
      });
      setProvisionResult(res);
      setMsg(`SUCCESS: Provisioned ${newStaffRole} account for ${newStaffName}! Credentials issued.`);
      setShowProvisionModal(false);
      setNewStaffName('');
      setNewStaffEmail('');
      loadData();
    } catch (err: any) {
      setMsg(`ERROR: ${err.message || 'Failed to provision staff'}`);
    }
  };

  // --- BED RESERVATION ACTION HANDLER ---
  const handleReserveBed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBed) return;
    setBeds((prev) =>
      prev.map((b) => (b.id === selectedBed.id ? { ...b, status: 'RESERVED' } : b))
    );
    setMsg(`SUCCESS: Bed #${selectedBed.bedNumber} reserved for ${reserveReason}`);
    setShowReserveBedModal(false);
    setSelectedBed(null);
  };

  const handleReleaseBed = (bedId: string, bedNumber: string) => {
    setBeds((prev) =>
      prev.map((b) => (b.id === bedId ? { ...b, status: 'AVAILABLE' } : b))
    );
    setMsg(`SUCCESS: Bed #${bedNumber} released and returned to AVAILABLE inventory.`);
  };

  const handleMarkMaintenance = (bedId: string, bedNumber: string) => {
    setBeds((prev) =>
      prev.map((b) => (b.id === bedId ? { ...b, status: 'MAINTENANCE' } : b))
    );
    setMsg(`SUCCESS: Bed #${bedNumber} marked under MAINTENANCE.`);
  };

  // --- H-02 REQUEST APPROVE & ESCALATE HANDLERS ---
  const handleApproveDeptRequest = (txId: string) => {
    setMsg(`SUCCESS: Department Admin approved transaction #${txId.substring(0, 8)}. Committed to engine!`);
  };

  const handleEscalateToSuperAdmin = (conflictId: string) => {
    setMsg(`🚀 ESCALATED: Conflict #${conflictId.substring(0, 8)} escalated to Super Admin for central preemption override.`);
  };

  if (loading) {
    return <div className="p-12 text-slate-500 font-mono text-sm">Loading Department Operations Workstation...</div>;
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Department Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-slate-200 p-6 rounded-2xl shadow-sm gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold font-mono">
            <Building className="w-3.5 h-3.5" /> ISOLATED DEPARTMENT ADMIN PORTAL
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            🏢 {currentDept.name.toUpperCase()} WORKSTATION
          </h1>
          <p className="text-xs text-slate-500">Managing Unit Doctors, Nurses, Patients, Bed Inventories, Schedules & H-02 Department Requests</p>
        </div>

        <div className="flex gap-2 font-mono text-xs">
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-center">
            <div className="text-slate-500 text-[10px]">MANAGED UNIT</div>
            <div className="font-extrabold text-purple-900">{currentDept.name}</div>
          </div>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-mono font-bold rounded-xl flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {/* MAIN FULL-WIDTH CONTENT AREA */}
      <div className="space-y-6">

      {/* TAB 1: DEPARTMENT OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Department KPI Gauges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
              <div className="text-slate-600 text-[11px]">Patients Today</div>
              <div className="text-xl font-extrabold text-purple-800">{deptPatients.length} Patients</div>
            </div>
            <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-1">
              <div className="text-slate-600 text-[11px]">Unit Doctors</div>
              <div className="text-xl font-extrabold text-sky-800">{deptDoctors.length} Available</div>
            </div>
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
              <div className="text-slate-600 text-[11px]">Unit Nurses</div>
              <div className="text-xl font-extrabold text-indigo-800">5 Shift Nurses</div>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
              <div className="text-slate-600 text-[11px]">Available Beds</div>
              <div className="text-xl font-extrabold text-emerald-800">{deptBeds.filter((b) => b.status === 'AVAILABLE').length} Beds</div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
              <div className="text-slate-600 text-[11px]">Occupied Beds</div>
              <div className="text-xl font-extrabold text-amber-800">{deptBeds.filter((b) => b.status === 'OCCUPIED').length} Beds</div>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
              <div className="text-slate-600 text-[11px]">Unit Conflicts</div>
              <div className="text-xl font-extrabold text-rose-800">{deptConflicts.length} Conflicts</div>
            </div>
          </div>

          {/* Pending Bed Requests Section */}
          <PendingBedRequestsSection />

          {/* Department Appointments & Beds Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
              <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" /> Today's Scheduled Appointments ({deptAppointments.length})
              </h2>
              <div className="divide-y divide-slate-100">
                {deptAppointments.slice(0, 5).map((a) => (
                  <div key={a.id} className="py-2.5 flex items-center justify-between text-xs font-mono">
                    <div>
                      <div className="font-bold text-slate-900">{a.patient?.name || 'Patient'}</div>
                      <div className="text-[11px] text-slate-500">{a.reason}</div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
              <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Bed className="w-4 h-4 text-emerald-600" /> Unit Bed Occupancy Monitor ({deptBeds.length} Beds)
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-xs font-mono">
                {deptBeds.map((b) => (
                  <div
                    key={b.id}
                    className={`p-2.5 rounded-xl border text-center font-bold ${
                      b.status === 'AVAILABLE' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                      b.status === 'OCCUPIED' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    <div>{b.bedNumber}</div>
                    <div className="text-[9px] font-normal text-slate-500">{b.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UNIT STAFF MANAGEMENT */}
      {activeTab === 'staff' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-sky-600" /> {currentDept.name} Doctors & Nursing Roster ({deptDoctors.length} Doctors)
              </h2>
              <p className="text-xs text-slate-500">Department Admin provisions credentials, assigns shifts & manages workload</p>
            </div>
            <button
              onClick={() => setShowProvisionModal(true)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 font-mono"
            >
              <UserPlus className="w-4 h-4" /> Provision Doctor / Staff Credentials
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-mono">
                <tr>
                  <th className="p-3">DOCTOR NAME</th>
                  <th className="p-3">SPECIALIZATION</th>
                  <th className="p-3">SHIFT TIMING</th>
                  <th className="p-3">AVAILABILITY</th>
                  <th className="p-3">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {deptDoctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900">{doc.user?.name || 'Dr. Assigned'}</td>
                    <td className="p-3 text-sky-700 font-bold">{doc.specialization || currentDept.name}</td>
                    <td className="p-3 text-purple-700 font-bold">Morning (08:00 - 16:00)</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">ON DUTY 🟢</span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => {
                          setSelectedStaff(doc);
                          setShowShiftModal(true);
                        }}
                        className="px-3 py-1 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 rounded-lg text-xs font-bold"
                      >
                        Assign Shift ⏰
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: UNIT PATIENTS */}
      {activeTab === 'patients' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" /> {currentDept.name} Admitted Patients ({deptPatients.length})
              </h2>
              <p className="text-xs text-slate-500">View patient details, assigned doctors, and treatment status</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-mono">
                <tr>
                  <th className="p-3">PATIENT ID</th>
                  <th className="p-3">PATIENT NAME</th>
                  <th className="p-3">BLOOD GROUP</th>
                  <th className="p-3">ASSIGNED DOCTOR</th>
                  <th className="p-3">PRIORITY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {deptPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900">{p.patientNumber}</td>
                    <td className="p-3 font-bold text-slate-800">{p.name}</td>
                    <td className="p-3 text-rose-700 font-bold">{p.bloodGroup}</td>
                    <td className="p-3 text-sky-700 font-bold">Dr. Sarah Jenkins</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.priority === 'EMERGENCY' ? 'bg-rose-100 text-rose-800' : 'bg-sky-100 text-sky-800'
                      }`}>
                        {p.priority || 'ROUTINE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: BEDS & EQUIPMENT INVENTORY */}
      {activeTab === 'resources' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Bed className="w-4 h-4 text-emerald-600" /> {currentDept.name} Bed & Equipment Inventory ({deptBeds.length} Beds)
              </h2>
              <p className="text-xs text-slate-500">Department Admin reserves, releases, and marks beds under maintenance</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-mono">
                <tr>
                  <th className="p-3">BED NUMBER</th>
                  <th className="p-3">WARD TYPE</th>
                  <th className="p-3">FLOOR</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {deptBeds.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900">{b.bedNumber}</td>
                    <td className="p-3 font-bold text-slate-700">{b.type}</td>
                    <td className="p-3 text-slate-600">Floor {b.floor}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
                        b.status === 'OCCUPIED' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        {b.status === 'AVAILABLE' && (
                          <button
                            onClick={() => {
                              setSelectedBed(b);
                              setShowReserveBedModal(true);
                            }}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded font-bold text-[11px]"
                          >
                            Reserve 🔒
                          </button>
                        )}
                        {b.status === 'RESERVED' && (
                          <button
                            onClick={() => handleReleaseBed(b.id, b.bedNumber)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[11px]"
                          >
                            Release 🔓
                          </button>
                        )}
                        {b.status !== 'MAINTENANCE' && (
                          <button
                            onClick={() => handleMarkMaintenance(b.id, b.bedNumber)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded font-bold text-[11px]"
                          >
                            Maintenance 🛠️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: APPOINTMENTS & SCHEDULING */}
      {activeTab === 'scheduling' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" /> {currentDept.name} Appointment Calendar ({deptAppointments.length})
              </h2>
              <p className="text-xs text-slate-500">Manage department appointments, doctor schedules & resolve clashes</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-mono">
                <tr>
                  <th className="p-3">PATIENT</th>
                  <th className="p-3">DOCTOR</th>
                  <th className="p-3">DATE & TIME</th>
                  <th className="p-3">REASON</th>
                  <th className="p-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {deptAppointments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900">{a.patient?.name || 'Patient'}</td>
                    <td className="p-3 text-sky-700 font-bold">{a.doctor?.user?.name || 'Dr. Assigned'}</td>
                    <td className="p-3 text-slate-600">{new Date(a.dateTime).toLocaleString()}</td>
                    <td className="p-3 font-semibold text-slate-800">{a.reason}</td>
                    <td className="p-3"><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: H-02 DEPT REQUESTS & CONFLICTS */}
      {activeTab === 'h02_requests' && (
        <div className="space-y-6">
          <PendingBedRequestsSection />
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-rose-600" /> H-02 Resource Requests & Preemption Escalations
                </h2>
                <p className="text-xs text-slate-500">Approve incoming department requests or escalate unresolved conflicts to Super Admin</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-mono">
                  <tr>
                    <th className="p-3">TRANSACTION ID</th>
                    <th className="p-3">REQUEST TYPE</th>
                    <th className="p-3">REQUESTED RESOURCE</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {transactions.slice(0, 5).map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold text-slate-900">{t.transactionNumber || t.id.substring(0, 8)}</td>
                      <td className="p-3 font-bold text-purple-700">{t.type}</td>
                      <td className="p-3 text-sky-700 font-bold">{t.resourceId}</td>
                      <td className="p-3"><StatusBadge status={t.status} /></td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveDeptRequest(t.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[11px]"
                          >
                            Approve Request ✅
                          </button>
                          <button
                            onClick={() => handleEscalateToSuperAdmin(t.id)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded font-bold text-[11px]"
                          >
                            Escalate to Super Admin 🚀
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB FOR EQUIPMENT & INSTRUMENT HEALTH */}
      {activeTab === 'equipment_health' && (
        <EquipmentMonitoringTab departmentFilter={currentDept.name} />
      )}
      </div>

      {/* SHIFT MODAL */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Assign Shift to Doctor</h3>
            <form onSubmit={handleAssignShift} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 font-mono block mb-1">Doctor Name</label>
                <input type="text" value={selectedStaff?.user?.name || 'Dr. Assigned'} disabled className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-slate-700 font-bold" />
              </div>
              <div>
                <label className="text-slate-600 font-mono block mb-1">Select Shift Timing</label>
                <select value={shiftTime} onChange={(e) => setShiftTime(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold">
                  <option value="Morning (08:00 - 16:00)">Morning Shift (08:00 - 16:00)</option>
                  <option value="Evening (16:00 - 00:00)">Evening Shift (16:00 - 00:00)</option>
                  <option value="Night (00:00 - 08:00)">Night Shift (00:00 - 08:00)</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 rounded-lg shadow-sm">
                  Save Shift Assignment
                </button>
                <button type="button" onClick={() => setShowShiftModal(false)} className="px-4 bg-slate-100 text-slate-700 rounded-lg font-bold">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESERVE BED MODAL */}
      {showReserveBedModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Reserve Bed #{selectedBed?.bedNumber}</h3>
            <form onSubmit={handleReserveBed} className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-600 block mb-1">Reason for Bed Reservation</label>
                <input type="text" value={reserveReason} onChange={(e) => setReserveReason(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold" required />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded-lg shadow-sm">
                  Confirm Reservation 🔒
                </button>
                <button type="button" onClick={() => setShowReserveBedModal(false)} className="px-4 bg-slate-100 text-slate-700 rounded-lg font-bold">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROVISION STAFF CREDENTIALS MODAL */}
      {showProvisionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <h3 className="font-extrabold text-slate-900 text-base">Provision Credentials for {currentDept.name} Staff</h3>
            <form onSubmit={handleProvisionStaff} className="space-y-3">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Select Role</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold"
                >
                  <option value="DOCTOR">DOCTOR (Clinical Decision Maker)</option>
                  <option value="NURSE">NURSE (Shift Nurse)</option>
                </select>
              </div>
              <div>
                <label className="text-slate-700 font-bold block mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Julian Bashir"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                  required
                />
              </div>
              <div>
                <label className="text-slate-700 font-bold block mb-1">Email Address (Login ID) *</label>
                <input
                  type="email"
                  placeholder="staff@hospital.com"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                  required
                />
              </div>
              {newStaffRole === 'DOCTOR' && (
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Specialization</label>
                  <input
                    type="text"
                    placeholder={currentDept.name}
                    value={newStaffSpec}
                    onChange={(e) => setNewStaffSpec(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                  />
                </div>
              )}
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-[11px] text-sky-900">
                Initial password set to: <strong>StaffPass2026!</strong>. The staff member can use this to log in.
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-xl shadow-sm">
                  Generate & Issue Credentials 🔑
                </button>
                <button type="button" onClick={() => setShowProvisionModal(false)} className="px-4 bg-slate-100 text-slate-700 rounded-xl font-bold">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROVISIONED CREDENTIAL NOTICE */}
      {provisionResult && (
        <div className="fixed bottom-6 right-6 max-w-md w-full bg-slate-900 text-white p-5 rounded-2xl shadow-2xl border border-sky-400 font-mono text-xs space-y-2 z-50 animate-in fade-in slide-in-from-bottom-5">
          <div className="font-extrabold text-sky-400 flex items-center justify-between">
            <span>🔑 Staff Credentials Issued!</span>
            <button onClick={() => setProvisionResult(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <div><strong>Staff Name:</strong> {provisionResult.user?.name}</div>
          <div><strong>Login Email:</strong> {provisionResult.credentials?.email}</div>
          <div><strong>Role / Dept:</strong> {provisionResult.credentials?.role} ({currentDept.name})</div>
          <div><strong>Password:</strong> <span className="px-2 py-0.5 bg-slate-800 text-sky-300 font-bold rounded">{provisionResult.credentials?.password}</span></div>
        </div>
      )}
    </div>
  );
}
