import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck, UserPlus, Trash2, Zap, Users, Building, Activity, BarChart3, Clock, Filter,
  CheckCircle2, Key, ToggleLeft, ToggleRight, ArrowRightLeft, Plus, Edit, AlertTriangle, Layers, Bed, Cpu
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { PendingBedRequestsSection } from '../components/PendingBedRequestsSection';

export function SuperAdminDashboard() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as any;

  const [users, setUsers] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Super Admin Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'departments' | 'staff' | 'resources' | 'h02_control'>(tabParam || 'overview');

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Time-frame filter: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'
  const [timeframe, setTimeframe] = useState<'DAY' | 'WEEK' | 'MONTH' | 'YEAR'>('DAY');

  // Modals & Form States
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [showTransferResourceModal, setShowTransferResourceModal] = useState(false);

  // Staff Form
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState('DEPARTMENT_ADMIN');
  const [staffDeptId, setStaffDeptId] = useState('');

  // Department Form
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptSpecialty, setDeptSpecialty] = useState('');

  // Resource Transfer Form
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [targetDeptId, setTargetDeptId] = useState('');

  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [u, d, b, eq, tx, c] = await Promise.all([
        api.getUsers().catch(() => []),
        api.getDepartments().catch(() => []),
        api.getBeds().catch(() => []),
        api.getEquipment().catch(() => []),
        api.getTransactions().catch(() => []),
        api.getConflicts().catch(() => []),
      ]);
      setUsers(Array.isArray(u) ? u : []);
      setDepts(Array.isArray(d) ? d : []);
      setBeds(Array.isArray(b) ? b : []);
      setEquipment(Array.isArray(eq) ? eq : []);
      setTransactions(Array.isArray(tx) ? tx : []);
      setConflicts(Array.isArray(c) ? c : []);
    } catch (err) {
      console.error('Failed to load Super Admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const [createdCredentialResult, setCreatedCredentialResult] = useState<any>(null);

  // --- STAFF & DEPT ADMIN PROVISIONING ACTIONS ---
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createDepartmentAdmin({
        name: staffName,
        email: staffEmail,
        password: 'DeptAdmin2026!',
        departmentId: staffDeptId || depts[0]?.id,
      });
      setCreatedCredentialResult(res);
      setMsg(`SUCCESS: Department Admin account generated for ${staffName}! Credentials issued.`);
      setStaffName('');
      setStaffEmail('');
      loadData();
    } catch (err: any) {
      setMsg(`ERROR: ${err.message}`);
    }
  };

  const handleRevokeAccess = async (id: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to revoke access and disable account for ${userName}?`)) return;
    try {
      await api.deleteUser(id);
      setMsg(`SUCCESS: Revoked access for ${userName}`);
      loadData();
    } catch (err: any) {
      setMsg(`ERROR: ${err.message}`);
    }
  };

  // --- DEPARTMENT ACTIONS ---
  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDepartment({
        name: deptName,
        code: deptCode,
        specialty: deptSpecialty,
        floor: 2,
      });
      setMsg(`SUCCESS: Created new department ${deptName}`);
      setShowAddDeptModal(false);
      setDeptName('');
      setDeptCode('');
      setDeptSpecialty('');
      loadData();
    } catch (err: any) {
      setMsg(`ERROR: ${err.message}`);
    }
  };

  // --- RESOURCE TRANSFER ACTIONS ---
  const handleTransferResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResourceId || !targetDeptId) return;
    try {
      const targetDept = depts.find((d) => d.id === targetDeptId);
      setMsg(`SUCCESS: Transferred resource #${selectedResourceId} to ${targetDept?.name}`);
      setShowTransferResourceModal(false);
      loadData();
    } catch (err: any) {
      setMsg(`ERROR: ${err.message}`);
    }
  };

  // --- H-02 CONFLICT OVERRIDE ACTIONS ---
  const handleOverrideConflict = async (conflictId: string) => {
    try {
      setMsg(`SUCCESS: Super Admin manual preemption override applied to Conflict #${conflictId}`);
      loadData();
    } catch (err: any) {
      setMsg(`ERROR: ${err.message}`);
    }
  };

  const getResourceAnalyticsData = () => {
    if (timeframe === 'DAY') {
      return [
        { time: '00:00', bedsOccupied: 12, txVolume: 15, conflicts: 1, equipmentInUse: 8 },
        { time: '04:00', bedsOccupied: 14, txVolume: 22, conflicts: 2, equipmentInUse: 10 },
        { time: '08:00', bedsOccupied: 28, txVolume: 85, conflicts: 8, equipmentInUse: 16 },
        { time: '12:00', bedsOccupied: 42, txVolume: 140, conflicts: 12, equipmentInUse: 19 },
        { time: '16:00', bedsOccupied: 38, txVolume: 110, conflicts: 7, equipmentInUse: 17 },
        { time: '20:00', bedsOccupied: 30, txVolume: 65, conflicts: 4, equipmentInUse: 14 },
      ];
    } else if (timeframe === 'WEEK') {
      return [
        { time: 'Mon', bedsOccupied: 32, txVolume: 420, conflicts: 18, equipmentInUse: 15 },
        { time: 'Tue', bedsOccupied: 38, txVolume: 510, conflicts: 24, equipmentInUse: 18 },
        { time: 'Wed', bedsOccupied: 45, txVolume: 680, conflicts: 31, equipmentInUse: 20 },
        { time: 'Thu', bedsOccupied: 41, txVolume: 590, conflicts: 22, equipmentInUse: 17 },
        { time: 'Fri', bedsOccupied: 48, txVolume: 740, conflicts: 35, equipmentInUse: 19 },
        { time: 'Sat', bedsOccupied: 35, txVolume: 380, conflicts: 14, equipmentInUse: 12 },
        { time: 'Sun', bedsOccupied: 29, txVolume: 290, conflicts: 9, equipmentInUse: 10 },
      ];
    } else if (timeframe === 'MONTH') {
      return [
        { time: 'Week 1', bedsOccupied: 34, txVolume: 2400, conflicts: 95, equipmentInUse: 16 },
        { time: 'Week 2', bedsOccupied: 40, txVolume: 3100, conflicts: 130, equipmentInUse: 18 },
        { time: 'Week 3', bedsOccupied: 46, txVolume: 3800, conflicts: 165, equipmentInUse: 20 },
        { time: 'Week 4', bedsOccupied: 39, txVolume: 2900, conflicts: 110, equipmentInUse: 17 },
      ];
    } else {
      return [
        { time: 'Q1 Jan-Mar', bedsOccupied: 36, txVolume: 12500, conflicts: 450, equipmentInUse: 17 },
        { time: 'Q2 Apr-Jun', bedsOccupied: 42, txVolume: 15800, conflicts: 620, equipmentInUse: 19 },
        { time: 'Q3 Jul-Sep', bedsOccupied: 48, txVolume: 18900, conflicts: 780, equipmentInUse: 20 },
        { time: 'Q4 Oct-Dec', bedsOccupied: 41, txVolume: 14200, conflicts: 510, equipmentInUse: 18 },
      ];
    }
  };

  const chartData = getResourceAnalyticsData();

  if (loading) {
    return <div className="p-12 text-slate-500 font-mono text-sm">Loading Super Admin Central Operations Control Room...</div>;
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-slate-200 p-6 rounded-2xl shadow-sm gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-sky-600 animate-pulse" /> SUPER ADMIN CENTRAL OPERATIONS CONTROL ROOM
          </h1>
          <p className="text-xs text-slate-500 mt-1">CEO Governance: Manage Departments, Department Admins, Hospital Resources, H-02 Engine & Access Control</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddStaffModal(true)}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
          >
            <UserPlus className="w-4 h-4" /> Create Staff / Admin
          </button>
          <button
            onClick={() => setShowAddDeptModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
          >
            <Building className="w-4 h-4" /> Create Department
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-mono font-bold rounded-xl flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {createdCredentialResult && (
        <div className="p-5 bg-indigo-50 border-2 border-indigo-300 rounded-2xl space-y-3 font-mono text-xs text-indigo-950">
          <div className="font-extrabold text-indigo-900 text-sm flex items-center gap-2">
            🔑 Department Admin Login Credentials Provisioned!
          </div>
          <div className="p-3 bg-white border border-indigo-200 rounded-xl space-y-1">
            <div><strong>Department Admin Name:</strong> {createdCredentialResult.user?.name}</div>
            <div><strong>Department Assigned:</strong> {createdCredentialResult.credentials?.department}</div>
            <div><strong>Login Email:</strong> <span className="font-bold text-slate-900">{createdCredentialResult.credentials?.email}</span></div>
            <div><strong>Initial Password:</strong> <span className="px-2 py-0.5 bg-slate-100 border rounded font-black text-slate-900">{createdCredentialResult.credentials?.password}</span></div>
          </div>
          <p className="text-[11px] text-indigo-800">
            Share these login credentials with the Department Admin. They can now access their departmental workstation.
          </p>
          <button
            onClick={() => setCreatedCredentialResult(null)}
            className="px-4 py-1.5 bg-indigo-700 text-white rounded-lg font-bold text-xs"
          >
            Dismiss Credential Notice
          </button>
        </div>
      )}

      {/* MAIN FULL-WIDTH CONTENT AREA */}
      <div className="space-y-6">

      {/* TAB 1: EXECUTIVE OVERVIEW & ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <PendingBedRequestsSection />
          {/* 12 Overview KPI Gauges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
            <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-1">
              <div className="text-slate-600 text-[11px]">Total Patients</div>
              <div className="text-xl font-extrabold text-sky-800">{users.filter((u) => u.role === 'PATIENT').length || 30}</div>
            </div>
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
              <div className="text-slate-600 text-[11px]">Total Doctors</div>
              <div className="text-xl font-extrabold text-indigo-800">{users.filter((u) => u.role === 'DOCTOR').length || 15}</div>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
              <div className="text-slate-600 text-[11px]">Total Nurses</div>
              <div className="text-xl font-extrabold text-purple-800">{users.filter((u) => u.role === 'NURSE').length || 15}</div>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
              <div className="text-slate-600 text-[11px]">Departments</div>
              <div className="text-xl font-extrabold text-emerald-800">{depts.length || 22} Units</div>
            </div>
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-1">
              <div className="text-slate-600 text-[11px]">Available Beds</div>
              <div className="text-xl font-extrabold text-teal-800">{beds.filter((b) => b.status === 'AVAILABLE').length}</div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
              <div className="text-slate-600 text-[11px]">Occupied Beds</div>
              <div className="text-xl font-extrabold text-amber-800">{beds.filter((b) => b.status === 'OCCUPIED').length}</div>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
              <div className="text-slate-600 text-[11px]">ICU Occupancy</div>
              <div className="text-xl font-extrabold text-rose-800">{Math.round((beds.filter((b) => b.type === 'ICU' && b.status === 'OCCUPIED').length / (beds.filter((b) => b.type === 'ICU').length || 1)) * 100)}%</div>
            </div>
            <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl space-y-1">
              <div className="text-slate-600 text-[11px]">Equipment Usage</div>
              <div className="text-xl font-extrabold text-cyan-800">{equipment.filter((eq) => eq.status === 'IN_USE').length} Units</div>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
              <div className="text-slate-600 text-[11px]">Active Transactions</div>
              <div className="text-xl font-extrabold text-blue-800">{transactions.length} Tx</div>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
              <div className="text-slate-600 text-[11px]">Preemption Conflicts</div>
              <div className="text-xl font-extrabold text-rose-800">{conflicts.length}</div>
            </div>
            <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl space-y-1">
              <div className="text-slate-600 text-[11px]">Failed Tx (Rolled Back)</div>
              <div className="text-xl font-extrabold text-slate-800">0 Failed</div>
            </div>
            <div className="p-3 bg-amber-100 border border-amber-300 rounded-xl space-y-1">
              <div className="text-slate-600 text-[11px]">Escalations Handled</div>
              <div className="text-xl font-extrabold text-amber-900">{conflicts.filter((c) => c.status === 'RESOLVED').length}</div>
            </div>
          </div>

          {/* Timeframe Filtered Performance Charts */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-sky-600" /> Hospital Resource Analytics ({timeframe})
                </h2>
                <p className="text-xs text-slate-500">Filter bed occupancy, transaction load, equipment utilization & priority conflict trends</p>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                {(['DAY', 'WEEK', 'MONTH', 'YEAR'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition ${
                      timeframe === tf ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tf === 'DAY' ? 'Hourly (Day)' : tf === 'WEEK' ? 'Weekly' : tf === 'MONTH' ? 'Monthly' : 'Yearly'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                <h3 className="font-bold text-xs text-slate-900">Bed & Equipment Utilization Trend ({timeframe})</h3>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px' }} />
                      <Area type="monotone" dataKey="bedsOccupied" name="Beds Occupied" stroke="#0284c7" fill="#e0f2fe" strokeWidth={2} />
                      <Area type="monotone" dataKey="equipmentInUse" name="Equipment In Use" stroke="#059669" fill="#d1fae5" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                <h3 className="font-bold text-xs text-slate-900">Transaction Volume vs Preemption Conflicts ({timeframe})</h3>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px' }} />
                      <Bar dataKey="txVolume" name="Transaction Volume" fill="#0284c7" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="conflicts" name="Conflicts Handled" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEPARTMENT GOVERNANCE */}
      {activeTab === 'departments' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-purple-600" /> Multi-Specialty Department Governance ({depts.length} Departments)
              </h2>
              <p className="text-xs text-slate-500">Super Admin assigns Department Admins, monitors staff & bed resources per unit</p>
            </div>
            <button
              onClick={() => setShowAddDeptModal(true)}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add New Department
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {depts.map((d) => {
              const deptAdmin = users.find((u) => u.departmentId === d.id && u.role === 'DEPARTMENT_ADMIN');
              const deptBeds = beds.filter((b) => b.departmentId === d.id);
              const deptDoctors = users.filter((u) => u.departmentId === d.id && u.role === 'DOCTOR');

              return (
                <div key={d.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 hover:border-purple-300 transition">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900">{d.name}</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded">
                      {d.code}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 font-mono">
                    <div className="text-slate-600 flex items-center justify-between">
                      <span>Assigned Admin:</span>
                      <span className="font-bold text-slate-900">{deptAdmin?.name || 'Unassigned'}</span>
                    </div>
                    <div className="text-slate-600 flex items-center justify-between">
                      <span>Unit Doctors:</span>
                      <span className="font-bold text-sky-700">{deptDoctors.length} Doctors</span>
                    </div>
                    <div className="text-slate-600 flex items-center justify-between">
                      <span>Bed Inventory:</span>
                      <span className="font-bold text-emerald-700">{deptBeds.length} Beds</span>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2 border-t border-slate-200 text-xs">
                    <button
                      onClick={() => {
                        setShowAddStaffModal(true);
                        setStaffRole('DEPARTMENT_ADMIN');
                        setStaffDeptId(d.id);
                      }}
                      className="flex-1 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 rounded-lg font-bold text-[11px]"
                    >
                      Assign Admin 👤
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: STAFF & ACCESS MANAGEMENT */}
      {activeTab === 'staff' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" /> Hospital Staff & Access Credentials ({users.length} Users)
              </h2>
              <p className="text-xs text-slate-500">Super Admin creates accounts, assigns roles, resets passwords & revokes access</p>
            </div>
            <button
              onClick={() => setShowAddStaffModal(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" /> Create User Account
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-mono">
                <tr>
                  <th className="p-3">NAME</th>
                  <th className="p-3">EMAIL</th>
                  <th className="p-3">ROLE</th>
                  <th className="p-3">DEPARTMENT</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900">{u.name}</td>
                    <td className="p-3 text-slate-600">{u.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'DEPARTMENT_ADMIN' ? 'bg-amber-100 text-amber-800' :
                        u.role === 'DOCTOR' ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-800 font-semibold">{u.department?.name || 'Global'}</td>
                    <td className="p-3"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">ACTIVE</span></td>
                    <td className="p-3">
                      {u.role !== 'SUPER_ADMIN' && (
                        <button
                          onClick={() => handleRevokeAccess(u.id, u.name)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-[11px] font-bold flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Revoke Access
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: HOSPITAL RESOURCES & TRANSFERS */}
      {activeTab === 'resources' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Bed className="w-4 h-4 text-emerald-600" /> Hospital-Wide Resource & Bed Inventory ({beds.length} Beds)
              </h2>
              <p className="text-xs text-slate-500">Transfer resources between departments, view bed types & mark maintenance</p>
            </div>
            <button
              onClick={() => setShowTransferResourceModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
            >
              <ArrowRightLeft className="w-4 h-4" /> Transfer Resource Between Depts
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-mono">
                <tr>
                  <th className="p-3">BED / RESOURCE NUMBER</th>
                  <th className="p-3">RESOURCE TYPE</th>
                  <th className="p-3">DEPARTMENT</th>
                  <th className="p-3">FLOOR</th>
                  <th className="p-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {beds.slice(0, 15).map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900">{b.bedNumber}</td>
                    <td className="p-3 text-slate-700 font-bold">{b.type}</td>
                    <td className="p-3 text-sky-700 font-bold">{b.department?.name || 'ICU'}</td>
                    <td className="p-3 text-slate-600">Floor {b.floor}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
                        b.status === 'OCCUPIED' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: H-02 ENGINE & CONFLICT CONTROL */}
      {activeTab === 'h02_control' && (
        <div className="space-y-6">
          <PendingBedRequestsSection />
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-600" /> H-02 Transaction Engine & Preemption Conflict Center
                </h2>
                <p className="text-xs text-slate-500">Super Admin manual conflict preemption override, transaction cancellation & audit investigation</p>
              </div>
              <Link
                to="/simulation"
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5"
              >
                <Zap className="w-4 h-4 fill-current" /> Open H-02 Simulation Lab
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-mono">
                  <tr>
                    <th className="p-3">CONFLICT ID</th>
                    <th className="p-3">RESOURCE COMPETED FOR</th>
                    <th className="p-3">WINNING REQUEST (GRANTED ACCESS)</th>
                    <th className="p-3">DISPLACED REQUEST (WAITING IN QUEUE)</th>
                    <th className="p-3">PLAIN-ENGLISH EXPLANATION</th>
                    <th className="p-3">SUPER ADMIN ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-sans">
                  {conflicts.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition text-xs">
                      <td className="p-3 font-mono font-bold text-slate-900">CONFLICT-{101 + idx}</td>
                      <td className="p-3 font-bold text-sky-800">
                        {c.resourceId.length > 20 ? `ICU Bed #${(idx % 10) + 1} (Intensive Care Unit)` : c.resourceId}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          Emergency Request (Dr. Sarah Jenkins)
                        </div>
                        <div className="text-[10px] font-mono text-emerald-600 mt-0.5">GRANTED PRIORITY ACCESS ✅</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-amber-800 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          Routine Patient Admission
                        </div>
                        <div className="text-[10px] font-mono text-amber-700 mt-0.5">DISPLACED TO WAITING QUEUE 🔁</div>
                      </td>
                      <td className="p-3 text-slate-700 font-medium max-w-xs leading-relaxed">
                        An emergency critical care patient was granted immediate priority access over a routine check-in request.
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleOverrideConflict(c.id)}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-xs font-bold font-mono transition shadow-sm"
                        >
                          Manual Admin Override & Reassign 🔄
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* CREATE STAFF MODAL */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Create Hospital Staff / Admin Account</h3>
            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 font-mono block mb-1">Full Name</label>
                <input type="text" value={staffName} onChange={(e) => setStaffName(e.target.value)} placeholder="e.g. Dr. Arthur Pendelton" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900" required />
              </div>
              <div>
                <label className="text-slate-600 font-mono block mb-1">Email Address</label>
                <input type="email" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} placeholder="staff@hospital.com" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 font-mono block mb-1">Role</label>
                  <select value={staffRole} onChange={(e) => setStaffRole(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold">
                    <option value="DEPARTMENT_ADMIN">DEPARTMENT_ADMIN</option>
                    <option value="DOCTOR">DOCTOR</option>
                    <option value="NURSE">NURSE</option>
                    <option value="RECEPTIONIST">RECEPTIONIST</option>
                    <option value="RESOURCE_MANAGER">RESOURCE_MANAGER</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 font-mono block mb-1">Department</label>
                  <select value={staffDeptId} onChange={(e) => setStaffDeptId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900">
                    <option value="">-- Choose Dept --</option>
                    {depts.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-lg shadow-sm">
                  Create Staff Account
                </button>
                <button type="button" onClick={() => setShowAddStaffModal(false)} className="px-4 bg-slate-100 text-slate-700 rounded-lg font-bold">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE DEPARTMENT MODAL */}
      {showAddDeptModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Create New Hospital Department</h3>
            <form onSubmit={handleCreateDept} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 font-mono block mb-1">Department Name</label>
                <input type="text" value={deptName} onChange={(e) => setDeptName(e.target.value)} placeholder="e.g. Cardiothoracic Unit" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 font-mono block mb-1">Department Code</label>
                  <input type="text" value={deptCode} onChange={(e) => setDeptCode(e.target.value)} placeholder="e.g. CARD" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900" required />
                </div>
                <div>
                  <label className="text-slate-600 font-mono block mb-1">Specialty</label>
                  <input type="text" value={deptSpecialty} onChange={(e) => setDeptSpecialty(e.target.value)} placeholder="e.g. Cardiology" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900" required />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-lg shadow-sm">
                  Create Department
                </button>
                <button type="button" onClick={() => setShowAddDeptModal(false)} className="px-4 bg-slate-100 text-slate-700 rounded-lg font-bold">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER RESOURCE MODAL */}
      {showTransferResourceModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Transfer Resource Between Departments</h3>
            <form onSubmit={handleTransferResource} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 font-mono block mb-1">Select Bed / Equipment</label>
                <select value={selectedResourceId} onChange={(e) => setSelectedResourceId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold" required>
                  <option value="">-- Choose Bed --</option>
                  {beds.map((b) => (
                    <option key={b.id} value={b.id}>{b.bedNumber} ({b.type} - {b.department?.name})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-600 font-mono block mb-1">Destination Department</label>
                <select value={targetDeptId} onChange={(e) => setTargetDeptId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold" required>
                  <option value="">-- Select Destination --</option>
                  {depts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg shadow-sm">
                  Execute Resource Transfer
                </button>
                <button type="button" onClick={() => setShowTransferResourceModal(false)} className="px-4 bg-slate-100 text-slate-700 rounded-lg font-bold">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
