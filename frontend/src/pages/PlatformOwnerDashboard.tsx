import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  ShieldCheck, Building, CheckCircle2, XCircle, Clock, AlertTriangle,
  RefreshCw, Search, Key, Sparkles, Layers, Activity, Users, Bed, Plus, Eye, Send
} from 'lucide-react';
import { Organization } from '../types';

export function PlatformOwnerDashboard() {
  const { user } = useAuth();
  const { socket, addToast } = useSocket();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'approved' | 'logs'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Approval Modal & Password State
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [initialPassword, setInitialPassword] = useState('HospitalPass2026!');
  const [approveResult, setApproveResult] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('Application details could not be verified with regional medical council.');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleOrgCreated = (data: any) => {
      addToast(
        'info',
        'New Hospital Application 🏥',
        `Hospital "${data.organization?.name || 'New Organization'}" requested platform authorization.`
      );
      setMsg(`NEW HOSPITAL APPLICATION: "${data.organization?.name}" submitted registration request!`);
      loadOrganizations();
    };

    const handleOrgUpdated = () => {
      loadOrganizations();
    };

    socket.on('organization:created', handleOrgCreated);
    socket.on('organization:updated', handleOrgUpdated);

    return () => {
      socket.off('organization:created', handleOrgCreated);
      socket.off('organization:updated', handleOrgUpdated);
    };
  }, [socket]);

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      const data = await api.getOrganizations();
      setOrganizations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;
    setActionLoading(true);
    try {
      const res = await api.approveOrganization(selectedOrg.id, { initialPassword });
      setApproveResult(res);
      setMsg(`SUCCESS: Hospital ${selectedOrg.name} authorized! Super Admin credentials generated.`);
      loadOrganizations();
    } catch (err: any) {
      setMsg(`ERROR: ${err.message || 'Failed to approve hospital'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;
    setActionLoading(true);
    try {
      await api.rejectOrganization(selectedOrg.id, { reason: rejectReason });
      setMsg(`REJECTED: Application for ${selectedOrg.name} has been rejected.`);
      setShowRejectModal(false);
      setSelectedOrg(null);
      loadOrganizations();
    } catch (err: any) {
      setMsg(`ERROR: ${err.message || 'Failed to reject hospital'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingOrgs = organizations.filter((o) => o.status === 'PENDING');
  const approvedOrgs = organizations.filter((o) => o.status === 'APPROVED');
  const rejectedOrgs = organizations.filter((o) => o.status === 'REJECTED');

  const filteredOrgs = organizations.filter((o) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        o.name.toLowerCase().includes(q) ||
        o.registrationNumber.toLowerCase().includes(q) ||
        o.code.toLowerCase().includes(q) ||
        o.superAdminEmail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-mono font-bold tracking-wider uppercase">
            <ShieldCheck className="w-4 h-4 text-indigo-400 animate-pulse" /> Software Owner Governance Portal
          </div>
          <h1 className="text-2xl md:text-4xl font-black mt-2 tracking-tight">
            👑 Hospital Ecosystem Control Center
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-2xl">
            Global authorization platform for multi-hospital registration requests, executive Super Admin credential provisioning, and ecosystem-wide transaction telemetry.
          </p>
        </div>

        <button
          onClick={loadOrganizations}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold font-mono transition shadow-md flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Ecosystem
        </button>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-mono font-bold rounded-2xl flex items-center justify-between shadow-sm">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="text-emerald-900 font-bold text-sm">✕</button>
        </div>
      )}

      {/* Pending Applications Action Banner */}
      {pendingOrgs.length > 0 && (
        <div className="p-5 bg-amber-500/10 border-2 border-amber-400 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs text-amber-950 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500 text-white rounded-2xl font-extrabold text-sm shadow animate-pulse">
              ⏳ {pendingOrgs.length}
            </div>
            <div>
              <div className="font-black text-amber-900 text-sm">
                Action Required: {pendingOrgs.length} Hospital Application{pendingOrgs.length > 1 ? 's' : ''} Pending Authorization!
              </div>
              <div className="text-amber-800 text-[11px] mt-0.5">
                Latest Request: <strong>{pendingOrgs[0]?.name}</strong> ({pendingOrgs[0]?.registrationNumber}) • Super Admin: {pendingOrgs[0]?.superAdminEmail}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTab('pending');
              setSelectedOrg(pendingOrgs[0]);
            }}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl shadow transition text-xs whitespace-nowrap"
          >
            Authorize Hospital & Issue Credentials 🔑
          </button>
        </div>
      )}

      {/* KPI Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1 shadow-sm">
          <div className="text-slate-500 font-bold">TOTAL HOSPITALS</div>
          <div className="text-2xl font-black text-slate-900">{organizations.length} Ecosystem Orgs</div>
        </div>
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1 shadow-sm">
          <div className="text-amber-800 font-bold flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-600" /> PENDING APPLICATIONS
          </div>
          <div className="text-2xl font-black text-amber-900">{pendingOrgs.length} Awaiting Approval</div>
        </div>
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1 shadow-sm">
          <div className="text-emerald-800 font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> AUTHORIZED HOSPITALS
          </div>
          <div className="text-2xl font-black text-emerald-900">{approvedOrgs.length} Active System Orgs</div>
        </div>
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-1 shadow-sm">
          <div className="text-rose-800 font-bold flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-rose-600" /> REJECTED REQUESTS
          </div>
          <div className="text-2xl font-black text-rose-900">{rejectedOrgs.length} Disqualified</div>
        </div>
      </div>

      {/* Control Tabs */}
      <div className="flex border-b border-slate-200 gap-2 font-mono text-xs font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 border-b-2 transition ${
            activeTab === 'overview' ? 'border-indigo-600 text-indigo-600 font-black' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          📊 All Organizations ({organizations.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2.5 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'pending' ? 'border-amber-600 text-amber-700 font-black' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>⏳ Pending Applications ({pendingOrgs.length})</span>
          {pendingOrgs.length > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded-full text-[10px] animate-pulse">
              ACTION REQUIRED
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-2.5 border-b-2 transition ${
            activeTab === 'approved' ? 'border-emerald-600 text-emerald-700 font-black' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          ✅ Authorized Hospitals ({approvedOrgs.length})
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-4 border border-slate-200 rounded-2xl flex items-center gap-3 shadow-sm">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search hospital name, registration number, hospital code, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs font-mono border-none focus:outline-none text-slate-800"
        />
      </div>

      {/* TAB 1 & 2: PENDING APPROVAL WORKFLOW */}
      {(activeTab === 'pending' || activeTab === 'overview' || activeTab === 'approved') && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(activeTab === 'pending'
              ? pendingOrgs.filter((o) => o.name.toLowerCase().includes(searchQuery.toLowerCase()) || o.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()))
              : activeTab === 'approved'
              ? approvedOrgs.filter((o) => o.name.toLowerCase().includes(searchQuery.toLowerCase()) || o.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()))
              : filteredOrgs
            ).map((org) => (
              <div
                key={org.id}
                className={`bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 transition hover:shadow-md ${
                  org.status === 'PENDING' ? 'border-amber-300 bg-amber-50/20' : org.status === 'APPROVED' ? 'border-emerald-200' : 'border-rose-200 bg-rose-50/20'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-widest">{org.code}</span>
                      <h3 className="font-extrabold text-slate-900 text-base">{org.name}</h3>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{org.hospitalType} • {org.city}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                      org.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                      org.status === 'PENDING' ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {org.status}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-slate-600">
                      <span>Registration No:</span>
                      <span className="font-bold text-slate-900">{org.registrationNumber}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Contact Email:</span>
                      <span className="font-bold text-slate-900">{org.email}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1.5">
                      <span>Super Admin Email:</span>
                      <span className="font-bold text-indigo-700">{org.superAdminEmail}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Super Admin Exec:</span>
                      <span className="font-bold text-slate-900">{org.superAdminName}</span>
                    </div>
                  </div>

                  {org.rejectionReason && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-[11px] italic font-mono">
                      Reason for Rejection: "{org.rejectionReason}"
                    </div>
                  )}
                </div>

                {/* Actions */}
                {org.status === 'PENDING' && (
                  <div className="flex gap-2 pt-2 border-t border-slate-100 font-mono text-xs">
                    <button
                      onClick={() => {
                        setSelectedOrg(org);
                        setInitialPassword('HospitalPass2026!');
                        setApproveResult(null);
                      }}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve & Issue Credentials
                    </button>
                    <button
                      onClick={() => {
                        setSelectedOrg(org);
                        setShowRejectModal(true);
                      }}
                      className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl transition"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                )}

                {org.status === 'APPROVED' && (
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs font-mono text-emerald-800 font-bold">
                    <span>Authorized System Hospital</span>
                    <span className="text-[10px] text-slate-500">Authorized: {new Date(org.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* APPROVAL & CREDENTIAL GENERATION MODAL */}
      {selectedOrg && !showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" /> Authorize Hospital & Issue Credentials
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedOrg.name} ({selectedOrg.code})</p>
              </div>
              <button onClick={() => setSelectedOrg(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
            </div>

            {!approveResult ? (
              <form onSubmit={handleApprove} className="space-y-4 font-mono text-xs">
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-2 text-indigo-950">
                  <div className="font-bold flex items-center gap-1.5 text-indigo-900">
                    <Key className="w-4 h-4 text-indigo-600" /> Super Admin Provisioning Details
                  </div>
                  <div>Executive: <strong>{selectedOrg.superAdminName}</strong></div>
                  <div>Assigned Email: <strong>{selectedOrg.superAdminEmail}</strong></div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Set Initial Password for Hospital Super Admin</label>
                  <input
                    type="text"
                    value={initialPassword}
                    onChange={(e) => setInitialPassword(e.target.value)}
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">This initial password will be issued to the Hospital Super Admin.</p>
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs"
                  >
                    {actionLoading ? 'Authorizing...' : 'Authorize Hospital & Generate Super Admin Credentials 🔑'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedOrg(null)}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 font-mono text-xs">
                <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl space-y-3 text-emerald-950">
                  <div className="font-extrabold text-emerald-900 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Hospital Authorized & Account Generated!
                  </div>

                  <div className="p-3 bg-white border border-emerald-300 rounded-xl space-y-1.5">
                    <div><strong>Hospital Name:</strong> {approveResult.organization?.name}</div>
                    <div><strong>Hospital Code:</strong> {approveResult.organization?.code}</div>
                    <div className="border-t border-slate-100 pt-1.5 text-indigo-900">
                      <strong>Super Admin Email:</strong> {approveResult.superAdmin?.email}
                    </div>
                    <div className="text-indigo-900">
                      <strong>Generated Password:</strong> <span className="px-2 py-0.5 bg-slate-100 rounded font-black font-mono text-slate-900">{approveResult.superAdmin?.generatedPassword}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    The Super Admin can now log in using these credentials to configure department admins, staff roster, and bed allocations.
                  </p>
                </div>

                <div className="text-right">
                  <button
                    onClick={() => {
                      setSelectedOrg(null);
                      setApproveResult(null);
                    }}
                    className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs"
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {selectedOrg && showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Reject Application for {selectedOrg.name}</h3>
            <form onSubmit={handleReject} className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Reason for Rejection</label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl shadow-sm"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection ❌'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
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
