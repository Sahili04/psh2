import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Users, UserPlus, Trash2, Stethoscope, HeartPulse, Calendar, Cpu } from 'lucide-react';

export function StaffManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('DOCTOR');
  const [deptId, setDeptId] = useState('');
  const [spec, setSpec] = useState('General Medicine');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [u, d] = await Promise.all([api.getUsers(), api.getDepartments()]);
    setUsers(u);
    setDepts(d);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptId) return alert('Please select a department');
    try {
      await api.createStaff({
        name,
        email,
        password: 'password123',
        role,
        departmentId: deptId,
        specialization: spec,
      });
      setMsg(`SUCCESS: Added ${name} as ${role}`);
      setShowAddModal(false);
      setName('');
      setEmail('');
      loadData();
    } catch (err: any) {
      setMsg(`ERROR: ${err.message}`);
    }
  };

  const handleDeleteUser = async (id: string, userName: string) => {
    if (!window.confirm(`Revoke access and remove ${userName}?`)) return;
    try {
      await api.deleteUser(id);
      setMsg(`SUCCESS: Removed access for ${userName}`);
      loadData();
    } catch (err: any) {
      setMsg(`ERROR: ${err.message}`);
    }
  };

  const staffUsers = users.filter((u) => ['DOCTOR', 'NURSE', 'RECEPTIONIST', 'RESOURCE_MANAGER'].includes(u.role));

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-slate-200 p-6 rounded-2xl shadow-sm gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-600" /> Hospital Staff & Department Assignment
          </h1>
          <p className="text-xs text-slate-500 mt-1">Admin Control: Add Doctors, Nurses, Receptionists & Resource Managers to Departments</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
        >
          <UserPlus className="w-4 h-4" /> Add Staff Member
        </button>
      </div>

      {msg && (
        <div className={`p-4 text-xs font-mono rounded-xl border ${msg.startsWith('SUCCESS') ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800'}`}>
          {msg}
        </div>
      )}

      {/* Staff Roster Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-sky-600" /> Clinical & Administrative Staff Roster ({staffUsers.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-mono">
              <tr>
                <th className="p-3">STAFF NAME</th>
                <th className="p-3">EMAIL</th>
                <th className="p-3">ROLE</th>
                <th className="p-3">ASSIGNED DEPARTMENT</th>
                <th className="p-3">STATUS</th>
                <th className="p-3">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {staffUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-bold text-slate-900">{u.name}</td>
                  <td className="p-3 text-slate-600">{u.email}</td>
                  <td className="p-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-slate-800 font-bold">{u.department?.name || 'Unassigned'}</td>
                  <td className="p-3"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">ACTIVE</span></td>
                  <td className="p-3">
                    <button
                      onClick={() => handleDeleteUser(u.id, u.name)}
                      className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Add New Staff Member</h3>
            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 font-mono block mb-1">Staff Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900" required />
              </div>
              <div>
                <label className="text-slate-600 font-mono block mb-1">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900" required />
              </div>
              <div>
                <label className="text-slate-600 font-mono block mb-1">Staff Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900">
                  <option value="DOCTOR">DOCTOR (Physician / Surgeon)</option>
                  <option value="NURSE">NURSE (Ward & ICU Staff)</option>
                  <option value="RECEPTIONIST">RECEPTIONIST (Check-In & Bookings)</option>
                  <option value="RESOURCE_MANAGER">RESOURCE MANAGER (Beds & Equipment)</option>
                </select>
              </div>
              <div>
                <label className="text-slate-600 font-mono block mb-1">Assigned Department</label>
                <select value={deptId} onChange={(e) => setDeptId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900" required>
                  <option value="">-- Select Department --</option>
                  {depts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                  ))}
                </select>
              </div>
              {role === 'DOCTOR' && (
                <div>
                  <label className="text-slate-600 font-mono block mb-1">Specialization</label>
                  <input type="text" value={spec} onChange={(e) => setSpec(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900" required />
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-lg shadow-sm">
                  Add Staff to Department
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 bg-slate-100 text-slate-700 rounded-lg font-bold">
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
